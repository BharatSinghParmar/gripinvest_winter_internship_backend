import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { ApiResponse, RequestWithUser } from '../types';
import { asyncHandler } from '../middleware/asyncHandler';

const productService = new ProductService();

// User endpoints
export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters: any = {
    investment_type: req.query['investment_type'] as any,
    risk_level: req.query['risk_level'] as any,
    min_yield: req.query['min_yield'] ? Number(req.query['min_yield']) : undefined,
    max_yield: req.query['max_yield'] ? Number(req.query['max_yield']) : undefined,
    min_tenure: req.query['min_tenure'] ? Number(req.query['min_tenure']) : undefined,
    max_tenure: req.query['max_tenure'] ? Number(req.query['max_tenure']) : undefined,
    min_investment: req.query['min_investment'] ? Number(req.query['min_investment']) : undefined,
    max_investment: req.query['max_investment'] ? Number(req.query['max_investment']) : undefined,
    search: req.query['search'] as string,
    page: req.query['page'] ? Number(req.query['page']) : 1,
    pageSize: req.query['pageSize'] ? Number(req.query['pageSize']) : 20,
  };

  const result = await productService.getProducts(filters);

  const response: ApiResponse = {
    success: true,
    message: 'Products retrieved successfully',
    data: result,
  };

  res.status(200).json(response);
});

export const getProductById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    const response: ApiResponse = {
      success: false,
      message: 'Product ID is required',
    };
    res.status(400).json(response);
    return;
  }

  const product = await productService.getProductById(id);

  if (!product) {
    const response: ApiResponse = {
      success: false,
      message: 'Product not found',
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    message: 'Product retrieved successfully',
    data: product,
  };

  res.status(200).json(response);
});

export const getProductRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userReq = req as RequestWithUser;
  const { risk_appetite, investment_amount, preferred_tenure } = req.query;

  if (!userReq.user) {
    const response: ApiResponse = {
      success: false,
      message: 'User not authenticated',
    };
    res.status(401).json(response);
    return;
  }

  const recommendations = await productService.getProductRecommendations(
    (risk_appetite as any) || userReq.user.risk_appetite,
    Number(investment_amount) || 10000,
    preferred_tenure ? Number(preferred_tenure) : undefined
  );

  const response: ApiResponse = {
    success: true,
    message: 'Product recommendations generated successfully',
    data: recommendations,
  };

  res.status(200).json(response);
});

// Admin endpoints
export const createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.createProduct(req.body);

  const response: ApiResponse = {
    success: true,
    message: 'Product created successfully',
    data: product,
  };

  res.status(201).json(response);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    const response: ApiResponse = {
      success: false,
      message: 'Product ID is required',
    };
    res.status(400).json(response);
    return;
  }

  const product = await productService.updateProduct(id, req.body);

  const response: ApiResponse = {
    success: true,
    message: 'Product updated successfully',
    data: product,
  };

  res.status(200).json(response);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    const response: ApiResponse = {
      success: false,
      message: 'Product ID is required',
    };
    res.status(400).json(response);
    return;
  }

  await productService.deleteProduct(id);

  const response: ApiResponse = {
    success: true,
    message: 'Product deleted successfully',
  };

  res.status(200).json(response);
});

export const generateProductDescription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    const response: ApiResponse = {
      success: false,
      message: 'Product ID is required',
    };
    res.status(400).json(response);
    return;
  }

  const description = await productService.generateProductDescription(id);

  const response: ApiResponse = {
    success: true,
    message: 'Product description generated successfully',
    data: description,
  };

  res.status(200).json(response);
});

export const getProductStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stats = await productService.getProductStats();

  const response: ApiResponse = {
    success: true,
    message: 'Product statistics retrieved successfully',
    data: stats,
  };

  res.status(200).json(response);
});
