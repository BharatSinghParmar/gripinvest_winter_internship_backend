// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: string[]
  errorCode?: string
}

// User Types
export interface User {
  id: string
  first_name: string
  last_name?: string
  email: string
  risk_appetite: 'low' | 'moderate' | 'high'
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

// Product Types
export interface Product {
  id: string
  name: string
  investment_type: 'bond' | 'fd' | 'mf' | 'etf' | 'other'
  tenure_months: number
  annual_yield: number
  risk_level: 'low' | 'moderate' | 'high'
  min_investment: number
  max_investment?: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  investment_type?: string
  risk_level?: string
  min_yield?: number
  max_yield?: number
  min_tenure?: number
  max_tenure?: number
  min_investment?: number
  max_investment?: number
  search?: string
  page?: number
  pageSize?: number
}

// Investment Types
export interface Investment {
  id: string
  user_id: string
  product_id: string
  amount: number
  expected_return?: number
  status: 'active' | 'completed' | 'cancelled' | 'matured'
  invested_at: string
  maturity_date?: string
  product: Product
}

export interface PortfolioSummary {
  totalInvested: number
  totalExpectedReturn: number
  activeInvestments: number
  maturedInvestments: number
  cancelledInvestments: number
  riskDistribution: Array<{ risk_level: 'low' | 'moderate' | 'high'; amount: number; percentage: number }>
  topHoldings: Array<{ product_id: string; name: string; amount: number; percentage: number }>
  weightedAverageYield: number
}

export interface CreateInvestmentRequest {
  product_id: string
  amount: number
}

export interface InvestmentFilters {
  status?: string
  from_date?: string
  to_date?: string
  page?: number
  pageSize?: number
}

// Portfolio Types
export interface PortfolioInsights {
  totalInvested: number
  totalValue: number
  totalReturn: number
  returnPercentage: number
  activeInvestments: number
  riskDistribution: {
    low: number
    moderate: number
    high: number
  }
  topPerformers: Array<{
    productName: string
    return: number
  }>
}

// Password Strength Types
export interface PasswordStrength {
  score: number
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  suggestions: string[]
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    numbers: boolean
    symbols: boolean
    noCommonPatterns: boolean
  }
}

// Transaction Log Types
export interface TransactionLog {
  id: number
  user_id?: string
  email?: string
  endpoint: string
  http_method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  status_code: number
  error_message?: string
  request_duration_ms?: number
  response_size_bytes?: number
  user_agent?: string
  ip_address?: string
  correlation_id?: string
  request_body?: any
  response_body?: any
  created_at: string
  updated_at: string
}

export interface TransactionLogFilters {
  user_id?: string
  email?: string
  endpoint?: string
  http_method?: string
  status_code?: number
  error_code?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

// Pagination Types
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface SignupForm {
  first_name: string
  last_name?: string
  email: string
  password: string
  risk_appetite: 'low' | 'moderate' | 'high'
}

export interface PasswordResetForm {
  email: string
}

export interface PasswordResetConfirmForm {
  email: string
  otp: string
  newPassword: string
}

export interface ProfileUpdateForm {
  first_name: string
  last_name?: string
  risk_appetite: 'low' | 'moderate' | 'high'
}

// Chart Data Types
export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

// Error Types
export interface AppError {
  message: string
  code?: string
  details?: any
}
