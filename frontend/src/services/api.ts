import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import type { ApiResponse } from '../types'

class ApiService {
  private api: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: any) => void
    reject: (error?: any) => void
  }> = []

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v2',
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => {
              return this.api(originalRequest)
            }).catch((err) => {
              return Promise.reject(err)
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const response = await axios.post(
              `${this.api.defaults.baseURL}/security/refresh`,
              {},
              { withCredentials: true }
            )

            const { accessToken } = response.data.data
            localStorage.setItem('accessToken', accessToken)

            this.processQueue(null)
            return this.api(originalRequest)
          } catch (refreshError) {
            this.processQueue(refreshError)
            localStorage.removeItem('accessToken')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })

    this.failedQueue = []
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.api.get(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.post(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.put(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.api.delete(url)
    return response.data
  }

  // Security methods
  async login(email: string, password: string) {
    return this.post('/security/login', { email, password })
  }

  async signup(userData: any) {
    return this.post('/security/register', userData)
  }

  async logout() {
    const result = await this.post('/security/logout')
    localStorage.removeItem('accessToken')
    return result
  }

  async getCurrentUser() {
    return this.get('/security/me')
  }

  async requestPasswordReset(email: string) {
    return this.post('/security/password/otp', { email })
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    return this.post('/security/password/reset', { email, otp, newPassword })
  }

  async checkPasswordStrength(password: string) {
    return this.post('/security/password/strength', { password })
  }

  async refreshToken(refreshToken: string) {
    return this.post('/security/refresh-token', { refreshToken })
  }

  async updateProfile(userData: any) {
    return this.put('/security/profile', userData)
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post('/security/change-password', { currentPassword, newPassword })
  }

  // Instrument methods
  async getProducts(filters?: any) {
    return this.get('/instruments', filters)
  }

  async getProduct(id: string) {
    return this.get(`/instruments/${id}`)
  }

  async getProductRecommendations(filters?: any) {
    return this.get('/instruments/recommendations/me', filters)
  }

  async generateProductDescription(productId: string) {
    return this.post(`/instruments/${productId}/description/ai`)
  }

  async createProduct(productData: any) {
    return this.post('/instruments', productData)
  }

  async updateProduct(productId: string, productData: any) {
    return this.put(`/instruments/${productId}`, productData)
  }

  async deleteProduct(productId: string) {
    return this.delete(`/instruments/${productId}`)
  }

  // Wealth methods
  async createInvestment(data: any) {
    return this.post('/wealth', data)
  }

  async getInvestments(filters?: any) {
    return this.get('/wealth/me', filters)
  }

  async getPortfolioInsights(period?: string) {
    return this.get('/wealth/portfolio/insights', { period })
  }

  // Admin methods
  async getTransactionLogs(filters?: any) {
    return this.get('/logging/transaction-logs', filters)
  }

  async getPerformanceMetrics(period?: string) {
    return this.get('/logging/performance/metrics', { period })
  }

  async getErrorAnalysis(period?: string) {
    return this.get('/logging/error-analysis', { period })
  }

  async getPerformanceTrends(metric?: string, period?: string) {
    return this.get('/logging/performance/trends', { metric, period })
  }

  async getAuditTrail(filters?: any) {
    return this.get('/logging/audit-trail', filters)
  }

  async getAuditStatistics(period?: string, groupBy?: string) {
    return this.get('/logging/audit-statistics', { period, group_by: groupBy })
  }

  async getSlowestEndpoints(limit?: number, period?: string) {
    return this.get('/logging/performance/slowest-endpoints', { limit, period })
  }

  async getErrorProneEndpoints(limit?: number, period?: string, minRequests?: number) {
    return this.get('/logging/performance/error-prone-endpoints', { limit, period, min_requests: minRequests })
  }

  async exportLogs(format?: string, from?: string, to?: string) {
    return this.get('/logging/export', { format, from, to })
  }

  // Health check
  async getHealth() {
    return this.get('/health')
  }
}

export const apiService = new ApiService()
export default apiService
