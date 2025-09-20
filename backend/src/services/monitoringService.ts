import { prisma } from '../prisma/client';
import { PerformanceMetrics } from '../types';

export interface AlertThresholds {
  maxResponseTime: number; // ms
  maxErrorRate: number; // percentage
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // percentage
  maxSlowQueries: number; // count
}

export interface Alert {
  id: string;
  type: 'performance' | 'error' | 'resource' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export class MonitoringService {
  private static readonly DEFAULT_THRESHOLDS: AlertThresholds = {
    maxResponseTime: 2000, // 2 seconds
    maxErrorRate: 5, // 5%
    maxMemoryUsage: 500, // 500MB
    maxCpuUsage: 80, // 80%
    maxSlowQueries: 10, // 10 queries
  };

  /**
   * Check system health and generate alerts
   */
  static async checkSystemHealth(thresholds?: Partial<AlertThresholds>): Promise<Alert[]> {
    const alertThresholds = { ...this.DEFAULT_THRESHOLDS, ...thresholds };
    const alerts: Alert[] = [];

    // Get current performance metrics
    const metrics = await this.getCurrentMetrics();

    // Check response time
    if (metrics.average_response_time > alertThresholds.maxResponseTime) {
      alerts.push({
        id: `response_time_${Date.now()}`,
        type: 'performance',
        severity: metrics.average_response_time > alertThresholds.maxResponseTime * 2 ? 'critical' : 'high',
        message: `Average response time (${metrics.average_response_time.toFixed(2)}ms) exceeds threshold (${alertThresholds.maxResponseTime}ms)`,
        details: {
          current: metrics.average_response_time,
          threshold: alertThresholds.maxResponseTime,
          metric: 'response_time',
        },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check error rate
    if (metrics.error_rate > alertThresholds.maxErrorRate) {
      alerts.push({
        id: `error_rate_${Date.now()}`,
        type: 'error',
        severity: metrics.error_rate > alertThresholds.maxErrorRate * 2 ? 'critical' : 'high',
        message: `Error rate (${metrics.error_rate.toFixed(2)}%) exceeds threshold (${alertThresholds.maxErrorRate}%)`,
        details: {
          current: metrics.error_rate,
          threshold: alertThresholds.maxErrorRate,
          metric: 'error_rate',
        },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check memory usage
    if (metrics.memory_usage > alertThresholds.maxMemoryUsage) {
      alerts.push({
        id: `memory_usage_${Date.now()}`,
        type: 'resource',
        severity: metrics.memory_usage > alertThresholds.maxMemoryUsage * 1.5 ? 'critical' : 'high',
        message: `Memory usage (${metrics.memory_usage.toFixed(2)}MB) exceeds threshold (${alertThresholds.maxMemoryUsage}MB)`,
        details: {
          current: metrics.memory_usage,
          threshold: alertThresholds.maxMemoryUsage,
          metric: 'memory_usage',
        },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check CPU usage
    if (metrics.cpu_usage > alertThresholds.maxCpuUsage) {
      alerts.push({
        id: `cpu_usage_${Date.now()}`,
        type: 'resource',
        severity: metrics.cpu_usage > alertThresholds.maxCpuUsage * 1.2 ? 'critical' : 'high',
        message: `CPU usage (${metrics.cpu_usage.toFixed(2)}%) exceeds threshold (${alertThresholds.maxCpuUsage}%)`,
        details: {
          current: metrics.cpu_usage,
          threshold: alertThresholds.maxCpuUsage,
          metric: 'cpu_usage',
        },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check slow queries
    if (metrics.slow_queries > alertThresholds.maxSlowQueries) {
      alerts.push({
        id: `slow_queries_${Date.now()}`,
        type: 'performance',
        severity: metrics.slow_queries > alertThresholds.maxSlowQueries * 2 ? 'critical' : 'medium',
        message: `Number of slow queries (${metrics.slow_queries}) exceeds threshold (${alertThresholds.maxSlowQueries})`,
        details: {
          current: metrics.slow_queries,
          threshold: alertThresholds.maxSlowQueries,
          metric: 'slow_queries',
        },
        timestamp: new Date(),
        resolved: false,
      });
    }

    return alerts;
  }

  /**
   * Get current system metrics
   */
  private static async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 1); // Last hour

    const whereClause = {
      created_at: { gte: startDate },
    };

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
   * Check for security alerts
   */
  static async checkSecurityAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Check for failed login attempts
    const failedLogins = await prisma.transaction_logs.count({
      where: {
        endpoint: '/api/v1/auth/login',
        status_code: 401,
        created_at: { gte: oneHourAgo },
      },
    });

    if (failedLogins >= 10) {
      alerts.push({
        id: `failed_logins_${Date.now()}`,
        type: 'security',
        severity: failedLogins >= 20 ? 'critical' : 'high',
        message: `High number of failed login attempts: ${failedLogins} in the last hour`,
        details: {
          count: failedLogins,
          timeWindow: '1 hour',
          threshold: 10,
        },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check for suspicious IP addresses
    const suspiciousIPs = await prisma.transaction_logs.groupBy({
      by: ['ip_address'],
      where: {
        status_code: { gte: 400 },
        created_at: { gte: oneHourAgo },
        ip_address: { not: null },
      },
      _count: { ip_address: true },
      having: {
        ip_address: {
          _count: { gte: 20 },
        },
      },
    });

    suspiciousIPs.forEach(ip => {
      alerts.push({
        id: `suspicious_ip_${Date.now()}_${ip.ip_address}`,
        type: 'security',
        severity: 'high',
        message: `Suspicious activity from IP ${ip.ip_address}: ${ip._count.ip_address} errors in the last hour`,
        details: {
          ip_address: ip.ip_address,
          error_count: ip._count.ip_address,
          timeWindow: '1 hour',
        },
        timestamp: new Date(),
        resolved: false,
      });
    });

    return alerts;
  }

  /**
   * Check for database health
   */
  static async checkDatabaseHealth(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      alerts.push({
        id: `database_connection_${Date.now()}`,
        type: 'resource',
        severity: 'critical',
        message: 'Database connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check for long-running queries (if we had query logging)
    // This would require additional setup to track individual queries

    return alerts;
  }

  /**
   * Get system health summary
   */
  static async getHealthSummary(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: PerformanceMetrics;
    alerts: Alert[];
    uptime: number;
    lastCheck: Date;
  }> {
    const [performanceAlerts, securityAlerts, databaseAlerts] = await Promise.all([
      this.checkSystemHealth(),
      this.checkSecurityAlerts(),
      this.checkDatabaseHealth(),
    ]);

    const allAlerts = [...performanceAlerts, ...securityAlerts, ...databaseAlerts];
    const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = allAlerts.filter(alert => alert.severity === 'high');

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (highAlerts.length > 0) {
      status = 'warning';
    }

    const metrics = await this.getCurrentMetrics();
    const uptime = process.uptime();

    return {
      status,
      metrics,
      alerts: allAlerts,
      uptime,
      lastCheck: new Date(),
    };
  }

  /**
   * Get monitoring dashboard data
   */
  static async getDashboardData(): Promise<{
    healthSummary: Awaited<ReturnType<typeof MonitoringService.getHealthSummary>>;
    recentAlerts: Alert[];
    performanceTrends: Array<{
      period: string;
      average_response_time: number;
      total_requests: number;
      error_rate: number;
    }>;
    topEndpoints: Array<{
      endpoint: string;
      request_count: number;
      average_duration: number;
      error_rate: number;
    }>;
  }> {
    const [healthSummary, recentAlerts, performanceTrends, topEndpoints] = await Promise.all([
      this.getHealthSummary(),
      this.getRecentAlerts(24), // Last 24 hours
      this.getPerformanceTrends(7, 'day'),
      this.getTopEndpoints(10),
    ]);

    return {
      healthSummary,
      recentAlerts,
      performanceTrends,
      topEndpoints,
    };
  }

  /**
   * Get recent alerts
   */
  private static async getRecentAlerts(_hours: number): Promise<Alert[]> {
    // In a real implementation, this would query a dedicated alerts table
    // For now, we'll generate fresh alerts
    const [performanceAlerts, securityAlerts, databaseAlerts] = await Promise.all([
      this.checkSystemHealth(),
      this.checkSecurityAlerts(),
      this.checkDatabaseHealth(),
    ]);

    return [...performanceAlerts, ...securityAlerts, ...databaseAlerts];
  }

  /**
   * Get performance trends
   */
  private static async getPerformanceTrends(days: number, interval: 'hour' | 'day'): Promise<Array<{
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
   * Get top endpoints by request count
   */
  private static async getTopEndpoints(limit: number): Promise<Array<{
    endpoint: string;
    request_count: number;
    average_duration: number;
    error_rate: number;
  }>> {
    const results = await prisma.transaction_logs.groupBy({
      by: ['endpoint'],
      _count: { endpoint: true },
      _avg: { request_duration_ms: true },
      orderBy: { _count: { endpoint: 'desc' } },
      take: limit,
    });

    const errorResults = await prisma.transaction_logs.groupBy({
      by: ['endpoint'],
      where: {
        status_code: { gte: 400 },
      },
      _count: { endpoint: true },
    });

    const errorMap = new Map(
      errorResults.map(result => [result.endpoint, result._count.endpoint])
    );

    return results.map(result => {
      const errorCount = errorMap.get(result.endpoint) || 0;
      return {
        endpoint: result.endpoint,
        request_count: result._count.endpoint,
        average_duration: result._avg.request_duration_ms || 0,
        error_rate: result._count.endpoint > 0 ? (errorCount / result._count.endpoint) * 100 : 0,
      };
    });
  }
}
