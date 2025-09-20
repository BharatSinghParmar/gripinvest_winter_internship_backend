import { Request, Response } from 'express';
import { DatabaseDiagnostics } from '../services/databaseDiagnostics';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/asyncHandler';

const dbDiagnostics = new DatabaseDiagnostics();

/**
 * Comprehensive database health check endpoint
 */
export const getDatabaseHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const healthCheck = await dbDiagnostics.performHealthCheck();
  
  const isHealthy = healthCheck.connectionPool.ping && healthCheck.errors.length === 0;
  
  const response: ApiResponse = {
    success: true,
    message: isHealthy ? 'Database is healthy' : 'Database health issues detected',
    data: {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: healthCheck.timestamp,
      details: healthCheck,
    },
  };

  res.status(isHealthy ? 200 : 503).json(response);
});

/**
 * Database connectivity test endpoint
 */
export const testDatabaseConnectivity = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const connectivityTest = await dbDiagnostics.testConnectivity();
  
  const response: ApiResponse = {
    success: connectivityTest.success,
    message: connectivityTest.success ? 'Database connectivity test passed' : 'Database connectivity test failed',
    data: {
      ...connectivityTest,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(connectivityTest.success ? 200 : 503).json(response);
});

/**
 * Database performance monitoring endpoint
 */
export const getDatabasePerformance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const duration = parseInt(req.query['duration'] as string) || 60;
  const performanceAnalysis = await dbDiagnostics.monitorPerformance(duration);
  
  const response: ApiResponse = {
    success: true,
    message: 'Database performance analysis completed',
    data: {
      ...performanceAnalysis,
      timestamp: new Date().toISOString(),
      duration: `${duration} seconds`,
    },
  };

  res.json(response);
});

/**
 * Database schema information endpoint
 */
export const getDatabaseSchema = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const schemaInfo = await dbDiagnostics.getSchemaInfo();
  
  const response: ApiResponse = {
    success: true,
    message: 'Database schema information retrieved',
    data: {
      ...schemaInfo,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Database error diagnosis endpoint
 */
export const diagnoseDatabaseError = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { errorCode } = req.params;
  
  if (!errorCode) {
    const response: ApiResponse = {
      success: false,
      message: 'Error code is required',
    };
    res.status(400).json(response);
    return;
  }

  // Create a mock error object for diagnosis
  const mockError = { 
    code: errorCode.toUpperCase(),
    message: `Mock error for diagnostic purposes: ${errorCode}`,
  };
  
  const diagnosis = await dbDiagnostics.diagnoseConnectionIssues(mockError);
  
  const response: ApiResponse = {
    success: true,
    message: 'Database error diagnosis completed',
    data: {
      ...diagnosis,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Database performance snapshot endpoint
 */
export const getDatabaseSnapshot = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const snapshot = await dbDiagnostics.capturePerformanceSnapshot();
  
  const response: ApiResponse = {
    success: true,
    message: 'Database performance snapshot captured',
    data: {
      ...snapshot,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Database connection pool status endpoint
 */
export const getConnectionPoolStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    // Test connection acquisition time
    const startTime = Date.now();
    await dbDiagnostics.testConnectivity();
    const acquisitionTime = Date.now() - startTime;

    // Get basic connection statistics
    const healthCheck = await dbDiagnostics.performHealthCheck();
    
    const response: ApiResponse = {
      success: true,
      message: 'Connection pool status retrieved',
      data: {
        acquisitionTime,
        ping: healthCheck.connectionPool.ping,
        connections: healthCheck.serverStatus.connections,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get connection pool status',
      errors: [error.message],
    };
    res.status(500).json(response);
  }
});

/**
 * Database slow queries analysis endpoint
 */
export const getSlowQueries = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get slow query statistics
    const healthCheck = await dbDiagnostics.performHealthCheck();
    
    const response: ApiResponse = {
      success: true,
      message: 'Slow queries analysis completed',
      data: {
        slowQueries: healthCheck.performance.slowQueries,
        totalQueries: healthCheck.performance.questions,
        slowQueryPercentage: healthCheck.performance.questions > 0 
          ? (healthCheck.performance.slowQueries / healthCheck.performance.questions * 100).toFixed(2)
          : 0,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to analyze slow queries',
      errors: [error.message],
    };
    res.status(500).json(response);
  }
});

/**
 * Database buffer pool analysis endpoint
 */
export const getBufferPoolAnalysis = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    const healthCheck = await dbDiagnostics.performHealthCheck();
    const bufferPool = healthCheck.performance.bufferPool;
    
    // Calculate buffer pool efficiency
    const hitRate = bufferPool.poolReadRequests > 0 
      ? ((bufferPool.poolReadRequests - bufferPool.poolReads) / bufferPool.poolReadRequests * 100).toFixed(2)
      : 0;

    const response: ApiResponse = {
      success: true,
      message: 'Buffer pool analysis completed',
      data: {
        ...bufferPool,
        hitRate: `${hitRate}%`,
        efficiency: parseFloat(String(hitRate)) > 95 ? 'excellent' : parseFloat(String(hitRate)) > 90 ? 'good' : 'needs_optimization',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to analyze buffer pool',
      errors: [error.message],
    };
    res.status(500).json(response);
  }
});
