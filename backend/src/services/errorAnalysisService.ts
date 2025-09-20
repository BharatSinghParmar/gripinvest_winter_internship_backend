import { prisma } from '../prisma/client';
import { DatabaseDiagnostics } from './databaseDiagnostics';

export interface ErrorPattern {
  id: string;
  errorCode: string;
  errorType: string;
  frequency: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedEndpoints: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: 'increasing' | 'decreasing' | 'stable';
  resolution: {
    status: 'unresolved' | 'investigating' | 'resolved';
    assignedTo?: string;
    notes?: string;
    resolvedAt?: Date;
  };
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorRate: number; // errors per hour
  patterns: ErrorPattern[];
  topErrors: Array<{
    errorCode: string;
    count: number;
    percentage: number;
  }>;
  affectedEndpoints: Array<{
    endpoint: string;
    errorCount: number;
    percentage: number;
  }>;
  timeDistribution: Array<{
    hour: number;
    errorCount: number;
  }>;
  recommendations: string[];
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  errorCode: string;
  errorType: string;
  message: string;
  stack?: string;
  endpoint: string;
  method: string;
  userId?: string;
  correlationId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  metadata: Record<string, any>;
}

export class ErrorAnalysisService {
  private dbDiagnostics: DatabaseDiagnostics;

  constructor() {
    this.dbDiagnostics = new DatabaseDiagnostics();
  }

  /**
   * Analyze errors from transaction logs and generate insights
   */
  async analyzeErrors(timeRangeHours: number = 24): Promise<ErrorAnalysis> {
    const startTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const endTime = new Date();

    // Get error logs from transaction_logs table
    const errorLogs = await prisma.transaction_logs.findMany({
      where: {
        status_code: {
          gte: 400, // Only error status codes
        },
        created_at: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Calculate total errors and error rate
    const totalErrors = errorLogs.length;
    const errorRate = totalErrors / timeRangeHours;

    // Group errors by error code
    const errorGroups = this.groupErrorsByCode(errorLogs);

    // Generate error patterns
    const patterns = await this.generateErrorPatterns(errorGroups, startTime, endTime);

    // Get top errors
    const topErrors = this.getTopErrors(errorGroups, totalErrors);

    // Get affected endpoints
    const affectedEndpoints = this.getAffectedEndpoints(errorLogs, totalErrors);

    // Get time distribution
    const timeDistribution = this.getTimeDistribution(errorLogs);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(patterns);

    return {
      totalErrors,
      errorRate,
      patterns,
      topErrors,
      affectedEndpoints,
      timeDistribution,
      recommendations,
    };
  }

  /**
   * Group errors by error code
   */
  private groupErrorsByCode(errorLogs: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    errorLogs.forEach(log => {
      const errorCode = this.extractErrorCode(log.error_message || 'UNKNOWN');
      if (!groups.has(errorCode)) {
        groups.set(errorCode, []);
      }
      groups.get(errorCode)!.push(log);
    });

    return groups;
  }

  /**
   * Extract error code from error message
   */
  private extractErrorCode(errorMessage: string): string {
    // Try to extract Prisma error codes
    const prismaMatch = errorMessage.match(/P\d{4}/);
    if (prismaMatch) {
      return prismaMatch[0];
    }

    // Try to extract MySQL error codes
    const mysqlMatch = errorMessage.match(/ER_\w+/);
    if (mysqlMatch) {
      return mysqlMatch[0];
    }

    // Try to extract HTTP status codes
    const httpMatch = errorMessage.match(/\b(4\d{2}|5\d{2})\b/);
    if (httpMatch) {
      return `HTTP_${httpMatch[0]}`;
    }

    // Default to first word of error message
    return errorMessage.split(' ')[0] || 'UNKNOWN';
  }

  /**
   * Generate error patterns from grouped errors
   */
  private async generateErrorPatterns(
    errorGroups: Map<string, any[]>,
    startTime: Date,
    endTime: Date
  ): Promise<ErrorPattern[]> {
    const patterns: ErrorPattern[] = [];

    for (const [errorCode, errors] of errorGroups.entries()) {
      const frequency = errors.length;
      const firstOccurrence = new Date(Math.min(...errors.map(e => e.created_at.getTime())));
      const lastOccurrence = new Date(Math.max(...errors.map(e => e.created_at.getTime())));
      
      const affectedEndpoints = [...new Set(errors.map(e => e.endpoint))];
      
      // Calculate trend (simplified - compare first half vs second half)
      const midPoint = new Date((startTime.getTime() + endTime.getTime()) / 2);
      const firstHalf = errors.filter(e => e.created_at < midPoint).length;
      const secondHalf = errors.filter(e => e.created_at >= midPoint).length;
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (secondHalf > firstHalf * 1.2) trend = 'increasing';
      else if (secondHalf < firstHalf * 0.8) trend = 'decreasing';

      // Determine severity based on frequency and error type
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (frequency > 100) severity = 'critical';
      else if (frequency > 50) severity = 'high';
      else if (frequency > 10) severity = 'medium';

      // Check if it's a database connection error
      if (errorCode.includes('P1001') || errorCode.includes('ECONNREFUSED')) {
        severity = 'critical';
      }

      patterns.push({
        id: `pattern_${errorCode}_${Date.now()}`,
        errorCode,
        errorType: this.categorizeErrorType(errorCode),
        frequency,
        firstOccurrence,
        lastOccurrence,
        affectedEndpoints,
        severity,
        trend,
        resolution: {
          status: 'unresolved',
        },
      });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Categorize error type based on error code
   */
  private categorizeErrorType(errorCode: string): string {
    if (errorCode.startsWith('P1')) return 'Database Connection';
    if (errorCode.startsWith('P2')) return 'Database Query';
    if (errorCode.startsWith('ER_')) return 'MySQL Error';
    if (errorCode.startsWith('HTTP_4')) return 'Client Error';
    if (errorCode.startsWith('HTTP_5')) return 'Server Error';
    if (errorCode.includes('Validation')) return 'Validation Error';
    if (errorCode.includes('Authentication')) return 'Authentication Error';
    return 'Unknown';
  }

  /**
   * Get top errors by frequency
   */
  private getTopErrors(errorGroups: Map<string, any[]>, totalErrors: number): Array<{
    errorCode: string;
    count: number;
    percentage: number;
  }> {
    return Array.from(errorGroups.entries())
      .map(([errorCode, errors]) => ({
        errorCode,
        count: errors.length,
        percentage: (errors.length / totalErrors) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get affected endpoints
   */
  private getAffectedEndpoints(errorLogs: any[], totalErrors: number): Array<{
    endpoint: string;
    errorCount: number;
    percentage: number;
  }> {
    const endpointGroups = new Map<string, number>();
    
    errorLogs.forEach(log => {
      const endpoint = log.endpoint;
      endpointGroups.set(endpoint, (endpointGroups.get(endpoint) || 0) + 1);
    });

    return Array.from(endpointGroups.entries())
      .map(([endpoint, errorCount]) => ({
        endpoint,
        errorCount,
        percentage: (errorCount / totalErrors) * 100,
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10);
  }

  /**
   * Get time distribution of errors
   */
  private getTimeDistribution(errorLogs: any[]): Array<{
    hour: number;
    errorCount: number;
  }> {
    const hourlyCounts = new Map<number, number>();
    
    errorLogs.forEach(log => {
      const hour = new Date(log.created_at).getHours();
      hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1);
    });

    // Fill in missing hours with 0
    const distribution = [];
    for (let hour = 0; hour < 24; hour++) {
      distribution.push({
        hour,
        errorCount: hourlyCounts.get(hour) || 0,
      });
    }

    return distribution;
  }

  /**
   * Generate recommendations based on error patterns
   */
  private async generateRecommendations(
    patterns: ErrorPattern[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Check for database connection issues
    const dbConnectionErrors = patterns.filter(p => 
      p.errorCode.includes('P1001') || 
      p.errorCode.includes('ECONNREFUSED') ||
      p.errorCode.includes('ETIMEDOUT')
    );

    if (dbConnectionErrors.length > 0) {
      recommendations.push('Database connection issues detected - check database server status and network connectivity');
      recommendations.push('Consider implementing connection retry logic and circuit breaker pattern');
    }

    // Check for high error rates
    const highFrequencyErrors = patterns.filter(p => p.frequency > 50);
    if (highFrequencyErrors.length > 0) {
      recommendations.push('High frequency errors detected - investigate root causes and implement fixes');
    }

    // Check for increasing trends
    const increasingErrors = patterns.filter(p => p.trend === 'increasing');
    if (increasingErrors.length > 0) {
      recommendations.push('Error trends are increasing - immediate attention required');
    }

    // Check for validation errors
    const validationErrors = patterns.filter(p => p.errorType === 'Validation Error');
    if (validationErrors.length > 0) {
      recommendations.push('Validation errors detected - review input validation and error handling');
    }

    // Check for authentication errors
    const authErrors = patterns.filter(p => p.errorType === 'Authentication Error');
    if (authErrors.length > 0) {
      recommendations.push('Authentication errors detected - review token handling and user management');
    }

    // Check for critical errors
    const criticalErrors = patterns.filter(p => p.severity === 'critical');
    if (criticalErrors.length > 0) {
      recommendations.push('Critical errors detected - immediate investigation and resolution required');
    }

    return recommendations;
  }

  /**
   * Get error statistics for a specific time range
   */
  async getErrorStatistics(startTime: Date, endTime: Date): Promise<{
    totalErrors: number;
    errorRate: number;
    errorDistribution: Array<{ statusCode: number; count: number }>;
    topEndpoints: Array<{ endpoint: string; errorCount: number }>;
  }> {
    const errorLogs = await prisma.transaction_logs.findMany({
      where: {
        status_code: {
          gte: 400,
        },
        created_at: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    const totalErrors = errorLogs.length;
    const timeRangeHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const errorRate = totalErrors / timeRangeHours;

    // Error distribution by status code
    const statusCodeGroups = new Map<number, number>();
    errorLogs.forEach(log => {
      const statusCode = log.status_code;
      statusCodeGroups.set(statusCode, (statusCodeGroups.get(statusCode) || 0) + 1);
    });

    const errorDistribution = Array.from(statusCodeGroups.entries())
      .map(([statusCode, count]) => ({ statusCode, count }))
      .sort((a, b) => b.count - a.count);

    // Top endpoints with errors
    const endpointGroups = new Map<string, number>();
    errorLogs.forEach(log => {
      const endpoint = log.endpoint;
      endpointGroups.set(endpoint, (endpointGroups.get(endpoint) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointGroups.entries())
      .map(([endpoint, errorCount]) => ({ endpoint, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10);

    return {
      totalErrors,
      errorRate,
      errorDistribution,
      topEndpoints,
    };
  }

  /**
   * Create a detailed error report
   */
  async createErrorReport(timeRangeHours: number = 24): Promise<{
    summary: ErrorAnalysis;
    databaseHealth: any;
    recommendations: string[];
    nextSteps: string[];
  }> {
    const summary = await this.analyzeErrors(timeRangeHours);
    const databaseHealth = await this.dbDiagnostics.performHealthCheck();
    
    const recommendations = [
      ...summary.recommendations,
      'Implement comprehensive error monitoring and alerting',
      'Set up automated error reporting and notification system',
      'Create runbooks for common error scenarios',
      'Regular error analysis and pattern recognition',
    ];

    const nextSteps = [
      'Review and prioritize error patterns by severity',
      'Implement fixes for high-priority errors',
      'Set up monitoring dashboards for error tracking',
      'Schedule regular error analysis reviews',
      'Document error resolution procedures',
    ];

    return {
      summary,
      databaseHealth,
      recommendations,
      nextSteps,
    };
  }
}
