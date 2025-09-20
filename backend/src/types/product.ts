export interface Product {
  id: string;
  name: string;
  investment_type: 'bond' | 'fd' | 'mf' | 'etf' | 'other';
  tenure_months: number;
  annual_yield: number;
  risk_level: 'low' | 'moderate' | 'high';
  min_investment: number;
  max_investment: number | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductInput {
  name: string;
  investment_type: 'bond' | 'fd' | 'mf' | 'etf' | 'other';
  tenure_months: number;
  annual_yield: number;
  risk_level: 'low' | 'moderate' | 'high';
  min_investment: number;
  max_investment?: number;
  description?: string;
}

export interface UpdateProductInput {
  name?: string;
  investment_type?: 'bond' | 'fd' | 'mf' | 'etf' | 'other';
  tenure_months?: number;
  annual_yield?: number;
  risk_level?: 'low' | 'moderate' | 'high';
  min_investment?: number;
  max_investment?: number;
  description?: string;
}

export interface ProductFilters {
  investment_type?: 'bond' | 'fd' | 'mf' | 'etf' | 'other';
  risk_level?: 'low' | 'moderate' | 'high';
  min_yield?: number;
  max_yield?: number;
  min_tenure?: number;
  max_tenure?: number;
  min_investment?: number;
  max_investment?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductListResponse {
  items: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductRecommendation {
  product: Product;
  score: number;
  reasons: string[];
}

export interface AIProductDescription {
  description: string;
  keyFeatures: string[];
  riskFactors: string[];
  suitability: string;
}
