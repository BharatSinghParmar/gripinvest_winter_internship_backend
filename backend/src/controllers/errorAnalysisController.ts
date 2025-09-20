import { Request, Response } from 'express';
import { ErrorAnalysisService } from '../services/errorAnalysisService';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/asyncHandler';

const errorAnalysisService = new ErrorAnalysisService();

/**
 * Get comprehensive error analysis
 */
export const getErrorAnalysis = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const timeRangeHours = parseInt(req.query['hours'] as string) || 24;
  const analysis = await errorAnalysisService.analyzeErrors(timeRangeHours);
  
  const response: ApiResponse = {
    success: true,
    message: 'Error analysis completed',
    data: {
      ...analysis,
      timeRange: `${timeRangeHours} hours`,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Get error statistics for a specific time range
 */
export const getErrorStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startTime, endTime } = req.query;
  
  if (!startTime || !endTime) {
    const response: ApiResponse = {
      success: false,
      message: 'Start time and end time are required',
    };
    res.status(400).json(response);
    return;
  }

  const start = new Date(startTime as string);
  const end = new Date(endTime as string);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid date format',
    };
    res.status(400).json(response);
    return;
  }

  const statistics = await errorAnalysisService.getErrorStatistics(start, end);
  
  const response: ApiResponse = {
    success: true,
    message: 'Error statistics retrieved',
    data: {
      ...statistics,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Create a detailed error report
 */
export const createErrorReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const timeRangeHours = parseInt(req.query['hours'] as string) || 24;
  const report = await errorAnalysisService.createErrorReport(timeRangeHours);
  
  const response: ApiResponse = {
    success: true,
    message: 'Error report created successfully',
    data: {
      ...report,
      timeRange: `${timeRangeHours} hours`,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Get error patterns
 */
export const getErrorPatterns = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const timeRangeHours = parseInt(req.query['hours'] as string) || 24;
  const analysis = await errorAnalysisService.analyzeErrors(timeRangeHours);
  
  const response: ApiResponse = {
    success: true,
    message: 'Error patterns retrieved',
    data: {
      patterns: analysis.patterns,
      timeRange: `${timeRangeHours} hours`,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Get top errors
 */
export const getTopErrors = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const timeRangeHours = parseInt(req.query['hours'] as string) || 24;
  const analysis = await errorAnalysisService.analyzeErrors(timeRangeHours);
  
  const response: ApiResponse = {
    success: true,
    message: 'Top errors retrieved',
    data: {
      topErrors: analysis.topErrors,
      timeRange: `${timeRangeHours} hours`,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Get affected endpoints
 */
export const getAffectedEndpoints = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const timeRangeHours = parseInt(req.query['hours'] as string) || 24;
  const analysis = await errorAnalysisService.analyzeErrors(timeRangeHours);
  
  const response: ApiResponse = {
    success: true,
    message: 'Affected endpoints retrieved',
    data: {
      affectedEndpoints: analysis.affectedEndpoints,
      timeRange: `${timeRangeHours} hours`,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Get error time distribution
 */
export const getErrorTimeDistribution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const timeRangeHours = parseInt(req.query['hours'] as string) || 24;
  const analysis = await errorAnalysisService.analyzeErrors(timeRangeHours);
  
  const response: ApiResponse = {
    success: true,
    message: 'Error time distribution retrieved',
    data: {
      timeDistribution: analysis.timeDistribution,
      timeRange: `${timeRangeHours} hours`,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});

/**
 * Get error recommendations
 */
export const getErrorRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const timeRangeHours = parseInt(req.query['hours'] as string) || 24;
  const analysis = await errorAnalysisService.analyzeErrors(timeRangeHours);
  
  const response: ApiResponse = {
    success: true,
    message: 'Error recommendations retrieved',
    data: {
      recommendations: analysis.recommendations,
      timeRange: `${timeRangeHours} hours`,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(response);
});
