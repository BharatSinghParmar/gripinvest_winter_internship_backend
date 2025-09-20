import { prisma } from '../prisma/client';
import { AIService } from './aiService';
import { Product, CreateProductInput, UpdateProductInput, ProductFilters, ProductListResponse, ProductRecommendation } from '../types/product';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to convert Prisma Decimal to number
const convertDecimalToNumber = (value: Decimal | null): number => {
  return value ? Number(value.toString()) : 0;
};

// Helper function to convert product from Prisma format to API format
const convertProduct = (product: any): Product => ({
  ...product,
  annual_yield: convertDecimalToNumber(product.annual_yield),
  min_investment: convertDecimalToNumber(product.min_investment),
  max_investment: product.max_investment ? convertDecimalToNumber(product.max_investment) : null,
});

export class ProductService {
  private aiService = new AIService();

  /**
   * Get all products with filtering and pagination
   */
  async getProducts(filters: ProductFilters): Promise<ProductListResponse> {
    const {
      investment_type,
      risk_level,
      min_yield,
      max_yield,
      min_tenure,
      max_tenure,
      min_investment,
      max_investment,
      search,
      page = 1,
      pageSize = 20,
    } = filters;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (investment_type) {
      where.investment_type = investment_type;
    }

    if (risk_level) {
      where.risk_level = risk_level;
    }

    if (min_yield !== undefined || max_yield !== undefined) {
      where.annual_yield = {};
      if (min_yield !== undefined) where.annual_yield.gte = min_yield;
      if (max_yield !== undefined) where.annual_yield.lte = max_yield;
    }

    if (min_tenure !== undefined || max_tenure !== undefined) {
      where.tenure_months = {};
      if (min_tenure !== undefined) where.tenure_months.gte = min_tenure;
      if (max_tenure !== undefined) where.tenure_months.lte = max_tenure;
    }

    if (min_investment !== undefined || max_investment !== undefined) {
      where.min_investment = {};
      if (min_investment !== undefined) where.min_investment.gte = min_investment;
      if (max_investment !== undefined) where.min_investment.lte = max_investment;
    }

    if (search) {
      // Prisma MySQL does not support mode on contains for older engines; use basic contains
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.investment_products.count({ where });

    // Get products
    const products = await prisma.investment_products.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { risk_level: 'asc' },
        { annual_yield: 'desc' },
        { name: 'asc' },
      ],
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: products.map(convertProduct),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const product = await prisma.investment_products.findUnique({
      where: { id },
    });

    return product ? convertProduct(product) : null;
  }

  /**
   * Create new product (Admin only)
   */
  async createProduct(data: CreateProductInput): Promise<Product> {
    // Validate max_investment > min_investment if both provided
    if (data.max_investment && data.max_investment <= data.min_investment) {
      throw new Error('Maximum investment must be greater than minimum investment');
    }

    const product = await prisma.investment_products.create({
      data: {
        name: data.name,
        investment_type: data.investment_type,
        tenure_months: data.tenure_months,
        annual_yield: data.annual_yield,
        risk_level: data.risk_level,
        min_investment: data.min_investment,
        max_investment: data.max_investment || null,
        description: data.description || null,
      },
    });

    return convertProduct(product);
  }

  /**
   * Update product (Admin only)
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    // Check if product exists
    const existingProduct = await prisma.investment_products.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Validate max_investment > min_investment if both provided
    const minInvestment = data.min_investment ?? existingProduct.min_investment;
    const maxInvestment = data.max_investment ?? existingProduct.max_investment;

    if (maxInvestment && maxInvestment <= minInvestment) {
      throw new Error('Maximum investment must be greater than minimum investment');
    }

    const product = await prisma.investment_products.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.investment_type && { investment_type: data.investment_type }),
        ...(data.tenure_months && { tenure_months: data.tenure_months }),
        ...(data.annual_yield && { annual_yield: data.annual_yield }),
        ...(data.risk_level && { risk_level: data.risk_level }),
        ...(data.min_investment && { min_investment: data.min_investment }),
        ...(data.max_investment !== undefined && { max_investment: data.max_investment }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return convertProduct(product);
  }

  /**
   * Delete product (Admin only)
   */
  async deleteProduct(id: string): Promise<void> {
    // Check if product exists
    const existingProduct = await prisma.investment_products.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Check if product has active investments
    const activeInvestments = await prisma.investments.count({
      where: {
        product_id: id,
        status: 'active',
      },
    });

    if (activeInvestments > 0) {
      throw new Error('Cannot delete product with active investments');
    }

    await prisma.investment_products.delete({
      where: { id },
    });
  }

  /**
   * Generate AI-powered product description
   */
  async generateProductDescription(id: string): Promise<{ description: string; keyFeatures: string[]; riskFactors: string[]; suitability: string }> {
    const product = await this.getProductById(id);

    if (!product) {
      throw new Error('Product not found');
    }

    return this.aiService.generateProductDescription(product);
  }

  /**
   * Get product recommendations based on user profile
   */
  async getProductRecommendations(
    riskAppetite: 'low' | 'moderate' | 'high',
    investmentAmount: number,
    preferredTenure?: number
  ): Promise<ProductRecommendation[]> {
    // Get all active products
    const products = await prisma.investment_products.findMany({
      orderBy: [
        { risk_level: 'asc' },
        { annual_yield: 'desc' },
      ],
    });

    return this.aiService.generateRecommendations(products.map(convertProduct), riskAppetite, investmentAmount, preferredTenure);
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    totalProducts: number;
    productsByType: Record<string, number>;
    productsByRisk: Record<string, number>;
    averageYield: number;
    yieldRange: { min: number; max: number };
  }> {
    const [totalProducts, productsByType, productsByRisk, yieldStats] = await Promise.all([
      prisma.investment_products.count(),
      prisma.investment_products.groupBy({
        by: ['investment_type'],
        _count: { investment_type: true },
      }),
      prisma.investment_products.groupBy({
        by: ['risk_level'],
        _count: { risk_level: true },
      }),
      prisma.investment_products.aggregate({
        _avg: { annual_yield: true },
        _min: { annual_yield: true },
        _max: { annual_yield: true },
      }),
    ]);

    const typeStats = productsByType.reduce((acc, item) => {
      acc[item.investment_type] = item._count.investment_type;
      return acc;
    }, {} as Record<string, number>);

    const riskStats = productsByRisk.reduce((acc, item) => {
      acc[item.risk_level] = item._count.risk_level;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProducts,
      productsByType: typeStats,
      productsByRisk: riskStats,
      averageYield: convertDecimalToNumber(yieldStats._avg.annual_yield),
      yieldRange: {
        min: convertDecimalToNumber(yieldStats._min.annual_yield),
        max: convertDecimalToNumber(yieldStats._max.annual_yield),
      },
    };
  }
}
