import { Response } from 'express';
import { checkDatabaseConnection } from '../prisma/client';
import { ApiResponse, HealthStatus } from '../types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { asyncHandler } from '../middleware/asyncHandler';
import { DatabaseDiagnostics } from '../services/databaseDiagnostics';

const startTime = Date.now();
const dbDiagnostics = new DatabaseDiagnostics();

export const health = asyncHandler(async (_req: any, res: Response): Promise<void> => {
  const databaseConnected = await checkDatabaseConnection();
  const databaseStatus: 'connected' | 'disconnected' = databaseConnected ? 'connected' : 'disconnected';

  const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../../package.json'), 'utf8')
  );

  const healthStatus: HealthStatus = {
    service: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
    database: databaseStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: packageJson.version,
    timestamp: new Date().toISOString(),
  };

  const response: ApiResponse<HealthStatus> = {
    success: true,
    message: 'Health check completed',
    data: healthStatus,
  };

  const statusCode = healthStatus.service === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
});

/**
 * Enhanced health check with detailed database diagnostics
 */
export const detailedHealth = asyncHandler(async (_req: any, res: Response): Promise<void> => {
  try {
    const databaseHealth = await dbDiagnostics.performHealthCheck();
    const connectivityTest = await dbDiagnostics.testConnectivity();
    
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf8')
    );

    const isHealthy = databaseHealth.connectionPool.ping && 
                     databaseHealth.errors.length === 0 && 
                     connectivityTest.success;

    const detailedHealthStatus = {
      service: isHealthy ? 'healthy' : 'unhealthy',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      database: {
        status: databaseHealth.connectionPool.ping ? 'connected' : 'disconnected',
        connectivity: connectivityTest,
        health: databaseHealth,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };

    const response: ApiResponse = {
      success: true,
      message: isHealthy ? 'Detailed health check completed - all systems healthy' : 'Detailed health check completed - issues detected',
      data: detailedHealthStatus,
    };

    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: 'Detailed health check failed',
      errors: [error.message],
    };
    res.status(500).json(response);
  }
});
