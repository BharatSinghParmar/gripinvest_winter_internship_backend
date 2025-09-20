export interface Investment {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  invested_at: Date;
  status: 'active' | 'matured' | 'cancelled';
  expected_return: number | null;
  maturity_date: string | null; // ISO date string
  product?: {
    id: string;
    name: string;
    investment_type: string;
    tenure_months: number;
    annual_yield: number;
    risk_level: string;
    min_investment: number;
    max_investment: number | null;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  } | null;
}

export interface CreateInvestmentInput {
  product_id: string;
  amount: number;
}

export interface InvestmentFilters {
  status?: 'active' | 'matured' | 'cancelled';
  from?: string; // ISO date
  to?: string;   // ISO date
  page?: number;
  pageSize?: number;
}

export interface InvestmentListResponse {
  items: Investment[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PortfolioSummary {
  totalInvested: number;
  totalExpectedReturn: number;
  activeInvestments: number;
  maturedInvestments: number;
  cancelledInvestments: number;
  riskDistribution: Array<{ risk_level: 'low' | 'moderate' | 'high'; amount: number; percentage: number }>;
  topHoldings: Array<{ product_id: string; name: string; amount: number; percentage: number }>;
  weightedAverageYield: number;
}
