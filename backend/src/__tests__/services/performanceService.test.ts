import { PerformanceService } from '../../services/performanceService';
import { prisma } from '../../prisma/client';

// Mock Prisma
jest.mock('../../prisma/client', () => ({
  prisma: {
    transaction_logs: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('PerformanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', async () => {
      const mockData = {
        totalRequests: 100,
        errorCount: 5,
        avgResponseTime: { _avg: { request_duration_ms: 200 } },
        slowQueries: 2,
      };

      (prisma.transaction_logs.count as jest.Mock)
        .mockResolvedValueOnce(mockData.totalRequests)
        .mockResolvedValueOnce(mockData.errorCount);
      
      (prisma.transaction_logs.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockData.avgResponseTime);
      
      (prisma.transaction_logs.count as jest.Mock)
        .mockResolvedValueOnce(mockData.slowQueries);

      const metrics = await PerformanceService.getPerformanceMetrics();

      expect(metrics).toHaveProperty('average_response_time');
      expect(metrics).toHaveProperty('total_requests');
      expect(metrics).toHaveProperty('error_rate');
      expect(metrics).toHaveProperty('slow_queries');
      expect(metrics).toHaveProperty('memory_usage');
      expect(metrics).toHaveProperty('cpu_usage');
    });

    it('should handle date range filtering', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.transaction_logs.count as jest.Mock).mockResolvedValue(0);
      (prisma.transaction_logs.aggregate as jest.Mock).mockResolvedValue({ _avg: { request_duration_ms: null } });

      await PerformanceService.getPerformanceMetrics(startDate, endDate);

      expect(prisma.transaction_logs.count).toHaveBeenCalledWith({
        where: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    });
  });

  describe('getEndpointMetrics', () => {
    it('should return endpoint-specific metrics', async () => {
      const endpoint = '/api/v1/products';
      
      (prisma.transaction_logs.count as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(2);
      
      (prisma.transaction_logs.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _avg: { request_duration_ms: 150 } });
      
      (prisma.transaction_logs.count as jest.Mock)
        .mockResolvedValueOnce(1);

      const metrics = await PerformanceService.getEndpointMetrics(endpoint);

      expect(metrics).toHaveProperty('average_response_time');
      expect(metrics).toHaveProperty('total_requests');
      expect(metrics).toHaveProperty('error_rate');
    });
  });

  describe('getSlowestEndpoints', () => {
    it('should return slowest endpoints', async () => {
      const mockResults = [
        {
          endpoint: '/api/v1/slow',
          _avg: { request_duration_ms: 2000 },
          _count: { endpoint: 10 },
        },
        {
          endpoint: '/api/v1/fast',
          _avg: { request_duration_ms: 100 },
          _count: { endpoint: 20 },
        },
      ];

      (prisma.transaction_logs.groupBy as jest.Mock).mockResolvedValue(mockResults);

      const endpoints = await PerformanceService.getSlowestEndpoints(10);

      expect(endpoints).toHaveLength(2);
      expect(endpoints[0].endpoint).toBe('/api/v1/slow');
      expect(endpoints[0].average_duration).toBe(2000);
    });
  });

  describe('getErrorProneEndpoints', () => {
    it('should return error-prone endpoints', async () => {
      const mockResults = [
        {
          endpoint: '/api/v1/error-prone',
          _count: { endpoint: 100 },
        },
      ];

      const mockErrorResults = [
        {
          endpoint: '/api/v1/error-prone',
          _count: { endpoint: 20 },
        },
      ];

      (prisma.transaction_logs.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockResults)
        .mockResolvedValueOnce(mockErrorResults);

      const endpoints = await PerformanceService.getErrorProneEndpoints(10);

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].endpoint).toBe('/api/v1/error-prone');
      expect(endpoints[0].error_rate).toBe(20);
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends', async () => {
      const mockLogs = [
        {
          created_at: new Date('2024-01-01T10:00:00Z'),
          request_duration_ms: 100,
          status_code: 200,
        },
        {
          created_at: new Date('2024-01-01T11:00:00Z'),
          request_duration_ms: 200,
          status_code: 400,
        },
      ];

      (prisma.transaction_logs.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const trends = await PerformanceService.getPerformanceTrends(7, 'day');

      expect(Array.isArray(trends)).toBe(true);
      expect(trends[0]).toHaveProperty('period');
      expect(trends[0]).toHaveProperty('average_response_time');
      expect(trends[0]).toHaveProperty('total_requests');
      expect(trends[0]).toHaveProperty('error_rate');
    });
  });

  describe('getDatabaseMetrics', () => {
    it('should return database metrics', async () => {
      (prisma.transaction_logs.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5);
      
      (prisma.transaction_logs.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _avg: { request_duration_ms: 150 } });

      const metrics = await PerformanceService.getDatabaseMetrics();

      expect(metrics).toHaveProperty('total_queries');
      expect(metrics).toHaveProperty('slow_queries');
      expect(metrics).toHaveProperty('average_query_time');
    });
  });
});
