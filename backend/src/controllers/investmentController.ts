import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiResponse, RequestWithUser } from '../types';
import { InvestmentService } from '../services/investmentService';

const investmentService = new InvestmentService();

export const createInvestment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userReq = req as RequestWithUser;
  if (!userReq.user) {
    const response: ApiResponse = { success: false, message: 'Authentication required' };
    res.status(401).json(response);
    return;
  }

  const result = await investmentService.create(userReq.user.id, req.body);
  const response: ApiResponse = { success: true, message: 'Investment created', data: result };
  res.status(201).json(response);
});

export const listMyInvestments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userReq = req as RequestWithUser;
  if (!userReq.user) {
    const response: ApiResponse = { success: false, message: 'Authentication required' };
    res.status(401).json(response);
    return;
  }

  const filters: any = {
    page: req.query['page'] ? Number(req.query['page']) : 1,
    pageSize: req.query['pageSize'] ? Number(req.query['pageSize']) : 20,
  };
  if (req.query['status']) filters.status = req.query['status'] as any;
  if (req.query['from']) filters.from = req.query['from'] as string;
  if (req.query['to']) filters.to = req.query['to'] as string;

  const result = await investmentService.listForUser(userReq.user.id, filters);
  const response: ApiResponse = { success: true, message: 'Investments retrieved', data: result };
  res.status(200).json(response);
});

export const portfolioInsights = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userReq = req as RequestWithUser;
  if (!userReq.user) {
    const response: ApiResponse = { success: false, message: 'Authentication required' };
    res.status(401).json(response);
    return;
  }

  const from = req.query['from'] as string | undefined;
  const to = req.query['to'] as string | undefined;

  const summary = await investmentService.portfolioSummary(userReq.user.id, from, to);
  const response: ApiResponse = { success: true, message: 'Portfolio insights', data: summary };
  res.status(200).json(response);
});
