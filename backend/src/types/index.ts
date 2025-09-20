export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface User {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  risk_appetite: 'low' | 'moderate' | 'high';
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface SignupInput {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  risk_appetite: 'low' | 'moderate' | 'high';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

export interface RequestWithUser extends Express.Request {
  user?: User;
  correlationId?: string;
}

export interface HealthStatus {
  service: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  uptime: number;
  version: string;
  timestamp: string;
}

export interface TransactionLog {
  id: bigint;
  user_id: string | null;
  endpoint: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status_code: number;
  error_message: string | null;
  request_duration_ms: number | null;
  response_size_bytes: number | null;
  user_agent: string | null;
  ip_address: string | null;
  error_code: string | null;
  correlation_id: string | null;
  created_at: Date;
}

export interface PerformanceMetrics {
  average_response_time: number;
  total_requests: number;
  error_rate: number;
  slow_queries: number;
  memory_usage: number;
  cpu_usage: number;
}

export interface ErrorAnalysis {
  error_patterns: Array<{
    error_code: string;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    last_occurrence: Date;
  }>;
  error_hotspots: Array<{
    endpoint: string;
    error_count: number;
    error_rate: number;
  }>;
  insights: string[];
  recommendations: string[];
}

export interface AuditTrail {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

// Re-export product types
export * from './product';
// Re-export investment types
export * from './investment';
