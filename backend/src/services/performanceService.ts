import { prisma } from '../prisma/client';
import { PerformanceMetrics } from '../types';

export class PerformanceService {
  /**
   * Get comprehensive performance metrics for a given time range
   */
  static async getPerformanceMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<PerformanceMetrics> {
    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.created_at = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.created_at = {
        gte: startDate,
      };
    } else if (endDate) {
      whereClause.created_at = {
        lte: endDate,
      };
    }

    // Get basic metrics
    const [totalRequests, errorCount, avgResponseTime, slowQueries] = await Promise.all([
      prisma.transaction_logs.count({ where: whereClause }),
      prisma.transaction_logs.count({
        where: {
          ...whereClause,
          status_code: { gte: 400 },
        },
      }),
      prisma.transaction_logs.aggregate({
        where: {
          ...whereClause,
          request_duration_ms: { not: null },
        },
        _avg: {
          request_duration_ms: true,
        },
      }),
      prisma.transaction_logs.count({
        where: {
          ...whereClause,
          request_duration_ms: { gte: 1000 }, // Queries taking more than 1 second
        },
      }),
    ]);

    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      average_response_time: avgResponseTime._avg.request_duration_ms || 0,
      total_requests: totalRequests,
      error_rate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      slow_queries: slowQueries,
      memory_usage: memoryUsage.heapUsed / 1024 / 1024, // MB
      cpu_usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
    };
  }

  /**
   * Get performance metrics for a specific endpoint
   */
  static async getEndpointMetrics(
    endpoint: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PerformanceMetrics> {
    const whereClause: any = { endpoint };
    
    if (startDate && endDate) {
      whereClause.created_at = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.created_at = {
        gte: startDate,
      };
    } else if (endDate) {
      whereClause.created_at = {
        lte: endDate,
      };
    }

    const [totalRequests, errorCount, avgResponseTime, slowQueries] = await Promise.all([
      prisma.transaction_logs.count({ where: whereClause }),
      prisma.transaction_logs.count({
        where: {
          ...whereClause,
          status_code: { gte: 400 },
        },
      }),
      prisma.transaction_logs.aggregate({
        where: {
          ...whereClause,
          request_duration_ms: { not: null },
        },
        _avg: {
          request_duration_ms: true,
        },
      }),
      prisma.transaction_logs.count({
        where: {
          ...whereClause,
          request_duration_ms: { gte: 1000 },
        },
      }),
    ]);

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      average_response_time: avgResponseTime._avg.request_duration_ms || 0,
      total_requests: totalRequests,
      error_rate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      slow_queries: slowQueries,
      memory_usage: memoryUsage.heapUsed / 1024 / 1024,
      cpu_usage: (cpuUsage.user + cpuUsage.system) / 1000000,
    };
  }

  /**
   * Get slowest endpoints
   */
  static async getSlowestEndpoints(limit: number = 10): Promise<Array<{
    endpoint: string;
    average_duration: number;
    request_count: number;
  }>> {
    const results = await prisma.transaction_logs.groupBy({
      by: ['endpoint'],
      where: {
        request_duration_ms: { not: null },
      },
      _avg: {
        request_duration_ms: true,
      },
      _count: {
        endpoint: true,
      },
      orderBy: {
        _avg: {
          request_duration_ms: 'desc',
        },
      },
      take: limit,
    });

    return results.map(result => ({
      endpoint: result.endpoint,
      average_duration: result._avg.request_duration_ms || 0,
      request_count: result._count.endpoint,
    }));
  }

  /**
   * Get most error-prone endpoints
   */
  static async getErrorProneEndpoints(limit: number = 10): Promise<Array<{
    endpoint: string;
    error_count: number;
    total_requests: number;
    error_rate: number;
  }>> {
    const results = await prisma.transaction_logs.groupBy({
      by: ['endpoint'],
      _count: {
        endpoint: true,
      },
      orderBy: {
        _count: {
          endpoint: 'desc',
        },
      },
      take: limit,
    });

    const errorResults = await prisma.transaction_logs.groupBy({
      by: ['endpoint'],
      where: {
        status_code: { gte: 400 },
      },
      _count: {
        endpoint: true,
      },
    });

    const errorMap = new Map(
      errorResults.map(result => [result.endpoint, result._count.endpoint])
    );

    return results.map(result => {
      const errorCount = errorMap.get(result.endpoint) || 0;
      return {
        endpoint: result.endpoint,
        error_count: errorCount,
        total_requests: result._count.endpoint,
        error_rate: result._count.endpoint > 0 ? (errorCount / result._count.endpoint) * 100 : 0,
      };
    });
  }

  /**
   * Get performance trends over time
   */
  static async getPerformanceTrends(
    days: number = 7,
    interval: 'hour' | 'day' = 'day'
  ): Promise<Array<{
    period: string;
    average_response_time: number;
    total_requests: number;
    error_rate: number;
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.transaction_logs.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        created_at: true,
        request_duration_ms: true,
        status_code: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Group by time interval
    const grouped = new Map<string, {
      totalRequests: number;
      totalDuration: number;
      errorCount: number;
    }>();

    logs.forEach(log => {
      let period: string;
      if (interval === 'hour') {
        period = log.created_at.toISOString().slice(0, 13) + ':00:00Z';
      } else {
        period = log.created_at.toISOString().slice(0, 10);
      }

      if (!grouped.has(period)) {
        grouped.set(period, {
          totalRequests: 0,
          totalDuration: 0,
          errorCount: 0,
        });
      }

      const group = grouped.get(period)!;
      group.totalRequests++;
      if (log.request_duration_ms) {
        group.totalDuration += log.request_duration_ms;
      }
      if (log.status_code >= 400) {
        group.errorCount++;
      }
    });

    return Array.from(grouped.entries()).map(([period, data]) => ({
      period,
      average_response_time: data.totalRequests > 0 ? data.totalDuration / data.totalRequests : 0,
      total_requests: data.totalRequests,
      error_rate: data.totalRequests > 0 ? (data.errorCount / data.totalRequests) * 100 : 0,
    }));
  }

  /**
   * Get database query performance metrics
   */
  static async getDatabaseMetrics(): Promise<{
    total_queries: number;
    slow_queries: number;
    average_query_time: number;
  }> {
    // This would typically integrate with a database query logger
    // For now, we'll use transaction logs as a proxy
    const totalQueries = await prisma.transaction_logs.count();
    const slowQueries = await prisma.transaction_logs.count({
      where: {
        request_duration_ms: { gte: 1000 },
      },
    });
    
    const avgTime = await prisma.transaction_logs.aggregate({
      _avg: {
        request_duration_ms: true,
      },
    });

    return {
      total_queries: totalQueries,
      slow_queries: slowQueries,
      average_query_time: avgTime._avg.request_duration_ms || 0,
    };
  }
}
