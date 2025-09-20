import { prisma } from '../prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateInvestmentInput, Investment, InvestmentFilters, InvestmentListResponse, PortfolioSummary } from '../types/investment';

const toNumber = (value: Decimal | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return Number(value.toString());
};

const convertInvestment = (row: any): Investment => ({
  id: row.id,
  user_id: row.user_id,
  product_id: row.product_id,
  amount: toNumber(row.amount),
  invested_at: row.invested_at,
  status: row.status,
  expected_return: row.expected_return !== null ? toNumber(row.expected_return) : null,
  maturity_date: row.maturity_date ? new Date(row.maturity_date).toISOString() : null,
  product: row.product ? {
    id: row.product.id,
    name: row.product.name,
    investment_type: row.product.investment_type,
    tenure_months: row.product.tenure_months,
    annual_yield: toNumber(row.product.annual_yield),
    risk_level: row.product.risk_level,
    min_investment: toNumber(row.product.min_investment),
    max_investment: row.product.max_investment ? toNumber(row.product.max_investment) : null,
    description: row.product.description,
    is_active: row.product.is_active,
    created_at: row.product.created_at,
    updated_at: row.product.updated_at,
  } : null,
});

export class InvestmentService {
  async create(userId: string, input: CreateInvestmentInput): Promise<Investment> {
    // Validate product exists
    const product = await prisma.investment_products.findUnique({ where: { id: input.product_id } });
    if (!product) {
      throw new Error('Product not found');
    }

    const amount = input.amount;

    // Enforce min/max investment rules
    const min = toNumber(product.min_investment);
    const max = product.max_investment ? toNumber(product.max_investment) : undefined;
    if (amount < min) {
      throw new Error(`Amount below minimum investment (${min})`);
    }
    if (max !== undefined && amount > max) {
      throw new Error(`Amount exceeds maximum investment (${max})`);
    }

    // Calculate expected return (simple interest for demo): amount * (annual_yield/100) * (tenure_months/12) + principal
    const annualYield = toNumber(product.annual_yield);
    const years = product.tenure_months / 12;
    const expectedReturn = Math.round((amount + amount * (annualYield / 100) * years) * 100) / 100;

    // Maturity date: invested_at + tenure_months
    const investedAt = new Date();
    const maturity = new Date(investedAt.getTime());
    maturity.setMonth(maturity.getMonth() + product.tenure_months);

    const created = await prisma.investments.create({
      data: {
        user_id: userId,
        product_id: input.product_id,
        amount: new Decimal(amount),
        expected_return: new Decimal(expectedReturn),
        maturity_date: maturity,
      },
    });

    return convertInvestment(created);
  }

  async listForUser(userId: string, filters: InvestmentFilters): Promise<InvestmentListResponse> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = { user_id: userId };
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.invested_at = {};
      if (filters.from) where.invested_at.gte = new Date(filters.from);
      if (filters.to) where.invested_at.lte = new Date(filters.to);
    }

    const total = await prisma.investments.count({ where });
    const rows = await prisma.investments.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ invested_at: 'desc' }],
      include: { product: true },
    });

    return {
      items: rows.map(convertInvestment),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async portfolioSummary(userId: string, from?: string, to?: string): Promise<PortfolioSummary> {
    const where: any = { user_id: userId };
    if (from || to) {
      where.invested_at = {};
      if (from) where.invested_at.gte = new Date(from);
      if (to) where.invested_at.lte = new Date(to);
    }

    const investments = await prisma.investments.findMany({ where, include: { product: true } });

    const totals = investments.reduce(
      (acc, inv) => {
        const amt = toNumber(inv.amount);
        const exp = inv.expected_return ? toNumber(inv.expected_return) : 0;
        acc.totalInvested += amt;
        acc.totalExpectedReturn += exp;
        if (inv.status === 'active') acc.active += 1;
        if (inv.status === 'matured') acc.matured += 1;
        if (inv.status === 'cancelled') acc.cancelled += 1;
        return acc;
      },
      { totalInvested: 0, totalExpectedReturn: 0, active: 0, matured: 0, cancelled: 0 }
    );

    // Risk distribution by invested amount
    const riskMap = new Map<string, number>();
    for (const inv of investments) {
      const amt = toNumber(inv.amount);
      const risk = inv.product.risk_level as 'low' | 'moderate' | 'high';
      riskMap.set(risk, (riskMap.get(risk) || 0) + amt);
    }
    const riskDistribution = Array.from(riskMap.entries()).map(([risk_level, amount]) => ({
      risk_level: risk_level as any,
      amount,
      percentage: totals.totalInvested > 0 ? Math.round((amount / totals.totalInvested) * 10000) / 100 : 0,
    }));

    // Top holdings by amount
    const productAmounts = new Map<string, { name: string; amount: number }>();
    for (const inv of investments) {
      const amt = toNumber(inv.amount);
      const key = inv.product_id;
      const name = inv.product.name;
      productAmounts.set(key, { name, amount: (productAmounts.get(key)?.amount || 0) + amt });
    }
    const topHoldings = Array.from(productAmounts.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5)
      .map(([product_id, v]) => ({
        product_id,
        name: v.name,
        amount: v.amount,
        percentage: totals.totalInvested > 0 ? Math.round((v.amount / totals.totalInvested) * 10000) / 100 : 0,
      }));

    // Weighted average yield (by invested amount)
    let weightedYieldNumerator = 0;
    for (const inv of investments) {
      const amt = toNumber(inv.amount);
      const yieldPct = toNumber(inv.product.annual_yield);
      weightedYieldNumerator += amt * yieldPct;
    }
    const weightedAverageYield = totals.totalInvested > 0 ? Math.round((weightedYieldNumerator / totals.totalInvested) * 100) / 100 : 0;

    return {
      totalInvested: Math.round(totals.totalInvested * 100) / 100,
      totalExpectedReturn: Math.round(totals.totalExpectedReturn * 100) / 100,
      activeInvestments: totals.active,
      maturedInvestments: totals.matured,
      cancelledInvestments: totals.cancelled,
      riskDistribution,
      topHoldings,
      weightedAverageYield,
    };
  }
}
