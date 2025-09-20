import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { PerformanceService } from '../services/performanceService';
import { AIService } from '../services/aiService';
import { AuditService } from '../services/auditService';
import { prisma } from '../prisma/client';
// import { RequestWithUser } from '../types';

export const getTransactionLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const pageSize = Math.min(parseInt(req.query['pageSize'] as string) || 50, 100);
  const userId = req.query['userId'] as string;
  const statusCode = req.query['statusCode'] ? parseInt(req.query['statusCode'] as string) : undefined;
  const errorCode = req.query['errorCode'] as string;
  const endpoint = req.query['endpoint'] as string;
  const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
  const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;

  const whereClause: any = {};

  if (userId) whereClause.user_id = userId;
  if (statusCode) whereClause.status_code = statusCode;
  if (errorCode) whereClause.error_code = errorCode;
  if (endpoint) whereClause.endpoint = { contains: endpoint };
  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at.gte = startDate;
    if (endDate) whereClause.created_at.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.transaction_logs.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction_logs.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Convert BigInt values to strings for JSON serialization
  const serializedLogs = logs.map(log => ({
    ...log,
    id: log.id.toString(),
    user_id: log.user_id?.toString() || null,
  }));

  res.json({
    success: true,
    message: 'Transaction logs retrieved successfully',
    data: {
      items: serializedLogs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    },
  });
});

export const getPerformanceMetrics = asyncHandler(async (req: Request, res: Response) => {
  const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
  const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;
  const endpoint = req.query['endpoint'] as string;

  let metrics;
  if (endpoint) {
    metrics = await PerformanceService.getEndpointMetrics(endpoint, startDate, endDate);
  } else {
    metrics = await PerformanceService.getPerformanceMetrics(startDate, endDate);
  }

  res.json({
    success: true,
    message: 'Performance metrics retrieved successfully',
    data: metrics,
  });
});

export const getSlowestEndpoints = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
  
  const endpoints = await PerformanceService.getSlowestEndpoints(limit);

  res.json({
    success: true,
    message: 'Slowest endpoints retrieved successfully',
    data: endpoints,
  });
});

export const getErrorProneEndpoints = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
  
  const endpoints = await PerformanceService.getErrorProneEndpoints(limit);

  res.json({
    success: true,
    message: 'Error-prone endpoints retrieved successfully',
    data: endpoints,
  });
});

export const getPerformanceTrends = asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query['days'] as string) || 7, 30);
  const interval = (req.query['interval'] as 'hour' | 'day') || 'day';

  const trends = await PerformanceService.getPerformanceTrends(days, interval);

  res.json({
    success: true,
    message: 'Performance trends retrieved successfully',
    data: trends,
  });
});

export const getErrorAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query['days'] as string) || 7, 30);
  
  const aiService = new AIService();
  const analysis = await aiService.analyzeErrorPatterns(days);

  res.json({
    success: true,
    message: 'Error analysis retrieved successfully',
    data: analysis,
  });
});

export const getAuditTrail = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const pageSize = Math.min(parseInt(req.query['pageSize'] as string) || 50, 100);
  const userId = req.query['userId'] as string;
  const action = req.query['action'] as string;
  const resourceType = req.query['resourceType'] as string;
  const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
  const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;

  const filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {};
  
  if (userId) filters.userId = userId;
  if (action) filters.action = action;
  if (resourceType) filters.resourceType = resourceType;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const result = await AuditService.getAuditTrail(filters, page, pageSize);

  res.json({
    success: true,
    message: 'Audit trail retrieved successfully',
    data: result,
  });
});

export const getAuditStatistics = asyncHandler(async (req: Request, res: Response) => {
  const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
  const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;

  const statistics = await AuditService.getAuditStatistics(startDate, endDate);

  res.json({
    success: true,
    message: 'Audit statistics retrieved successfully',
    data: statistics,
  });
});

export const getUserAuditTrail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['userId'];
  const page = parseInt(req.query['page'] as string) || 1;
  const pageSize = Math.min(parseInt(req.query['pageSize'] as string) || 50, 100);

  if (!userId) {
    res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
    return;
  }

  const result = await AuditService.getUserAuditTrail(userId, page, pageSize);

  res.json({
    success: true,
    message: 'User audit trail retrieved successfully',
    data: result,
  });
});

export const getResourceAuditTrail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const resourceType = req.params['resourceType'];
  const resourceId = req.params['resourceId'];
  const page = parseInt(req.query['page'] as string) || 1;
  const pageSize = Math.min(parseInt(req.query['pageSize'] as string) || 50, 100);

  if (!resourceType || !resourceId) {
    res.status(400).json({
      success: false,
      message: 'Resource type and ID are required',
    });
    return;
  }

  const result = await AuditService.getResourceAuditTrail(resourceType, resourceId, page, pageSize);

  res.json({
    success: true,
    message: 'Resource audit trail retrieved successfully',
    data: result,
  });
});

export const getDatabaseMetrics = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await PerformanceService.getDatabaseMetrics();

  res.json({
    success: true,
    message: 'Database metrics retrieved successfully',
    data: metrics,
  });
});

export const exportLogs = asyncHandler(async (req: Request, res: Response) => {
  const format = (req.query['format'] as 'json' | 'csv') || 'json';
  const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
  const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;
  const logType = req.query['logType'] as 'transaction' | 'audit';

  const whereClause: any = {};
  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at.gte = startDate;
    if (endDate) whereClause.created_at.lte = endDate;
  }

  let logs;
  if (logType === 'audit') {
    logs = await prisma.audit_trails.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });
  } else {
    logs = await prisma.transaction_logs.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });
  }

  if (format === 'csv') {
    // Convert to CSV format
    const headers = Object.keys(logs[0] || {});
    const csvContent = [
      headers.join(','),
      ...logs.map(log => headers.map(header => {
        const value = (log as any)[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${logType}_logs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${logType}_logs_${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      success: true,
      message: 'Logs exported successfully',
      data: logs,
    });
  }
});
