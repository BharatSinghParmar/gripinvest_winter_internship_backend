import { ProductService } from '../services/productService';
import { AIService } from '../services/aiService';
import { prisma } from '../prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
jest.mock('../prisma/client', () => ({
  prisma: {
    investment_products: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn()
    },
    investments: {
      count: jest.fn()
    }
  }
}));
jest.mock('../services/aiService');

const mockPrisma = prisma as any;
const mockAIService = AIService as jest.MockedClass<typeof AIService>;

describe('ProductService', () => {
  let productService: ProductService;
  let mockAIInstance: jest.Mocked<AIService>;

  beforeEach(() => {
    productService = new ProductService();
    mockAIInstance = {
      generateProductDescription: jest.fn(),
      generateRecommendations: jest.fn()
    } as any;
    (mockAIService as any).mockImplementation(() => mockAIInstance);
    jest.clearAllMocks();
    
    // Reset the AI service instance
    (productService as any).aiService = mockAIInstance;
  });

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Test Bond',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: new Decimal(5.5),
          risk_level: 'low',
          min_investment: new Decimal(1000),
          max_investment: new Decimal(100000),
          description: 'Test Description',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockPrisma.investment_products.count.mockResolvedValue(1);
      mockPrisma.investment_products.findMany.mockResolvedValue(mockProducts as any);

      const filters = { page: 1, pageSize: 20 };
      const result = await productService.getProducts(filters);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply filters correctly', async () => {
      mockPrisma.investment_products.count.mockResolvedValue(0);
      mockPrisma.investment_products.findMany.mockResolvedValue([]);

      const filters = {
        investment_type: 'bond' as const,
        risk_level: 'low' as const,
        min_yield: 5,
        max_yield: 10,
        page: 1,
        pageSize: 10
      };

      await productService.getProducts(filters);

      expect(mockPrisma.investment_products.findMany).toHaveBeenCalledWith({
        where: {
          investment_type: 'bond',
          risk_level: 'low',
          annual_yield: { gte: 5, lte: 10 }
        },
        skip: 0,
        take: 10,
        orderBy: [
          { risk_level: 'asc' },
          { annual_yield: 'desc' },
          { name: 'asc' }
        ]
      });
    });

    it('should handle search filter', async () => {
      mockPrisma.investment_products.count.mockResolvedValue(0);
      mockPrisma.investment_products.findMany.mockResolvedValue([]);

      const filters = { search: 'test', page: 1, pageSize: 20 };

      await productService.getProducts(filters);

      expect(mockPrisma.investment_products.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test' } },
            { description: { contains: 'test' } }
          ]
        },
        skip: 0,
        take: 20,
        orderBy: [
          { risk_level: 'asc' },
          { annual_yield: 'desc' },
          { name: 'asc' }
        ]
      });
    });
  });

  describe('getProductById', () => {
    it('should return product if found', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Bond',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: new Decimal(5.5),
        risk_level: 'low',
        min_investment: new Decimal(1000),
        max_investment: new Decimal(100000),
        description: 'Test Description',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.investment_products.findUnique.mockResolvedValue(mockProduct as any);

      const result = await productService.getProductById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.annual_yield).toBe(5.5);
      expect(result?.min_investment).toBe(1000);
    });

    it('should return null if product not found', async () => {
      mockPrisma.investment_products.findUnique.mockResolvedValue(null);

      const result = await productService.getProductById('999');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    const validProductData = {
      name: 'Test Bond',
      investment_type: 'bond' as const,
      tenure_months: 12,
      annual_yield: 5.5,
      risk_level: 'low' as const,
      min_investment: 1000,
      max_investment: 100000,
      description: 'Test Description'
    };

    it('should create product successfully', async () => {
      const mockCreatedProduct = {
        id: '1',
        ...validProductData,
        annual_yield: new Decimal(5.5),
        min_investment: new Decimal(1000),
        max_investment: new Decimal(100000),
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.investment_products.create.mockResolvedValue(mockCreatedProduct as any);

      const result = await productService.createProduct(validProductData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Bond');
      expect(mockPrisma.investment_products.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Bond',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: 5.5,
          risk_level: 'low',
          min_investment: 1000,
          max_investment: 100000,
          description: 'Test Description'
        }
      });
    });

    it('should throw error if max_investment <= min_investment', async () => {
      const invalidData = {
        ...validProductData,
        min_investment: 1000,
        max_investment: 500
      };

      await expect(productService.createProduct(invalidData))
        .rejects.toThrow('Maximum investment must be greater than minimum investment');
    });
  });

  describe('updateProduct', () => {
    const mockExistingProduct = {
      id: '1',
      name: 'Old Name',
      investment_type: 'bond',
      tenure_months: 12,
      annual_yield: new Decimal(5.5),
      risk_level: 'low',
      min_investment: new Decimal(1000),
      max_investment: new Decimal(100000),
      description: 'Old Description',
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated Description'
      };

      const mockUpdatedProduct = {
        ...mockExistingProduct,
        name: 'Updated Name',
        description: 'Updated Description'
      };

      mockPrisma.investment_products.findUnique.mockResolvedValue(mockExistingProduct as any);
      mockPrisma.investment_products.update.mockResolvedValue(mockUpdatedProduct as any);

      const result = await productService.updateProduct('1', updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
      expect(mockPrisma.investment_products.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Name',
          description: 'Updated Description'
        }
      });
    });

    it('should throw error if product not found', async () => {
      mockPrisma.investment_products.findUnique.mockResolvedValue(null);

      await expect(productService.updateProduct('999', { name: 'New Name' }))
        .rejects.toThrow('Product not found');
    });

    it('should throw error if max_investment <= min_investment', async () => {
      mockPrisma.investment_products.findUnique.mockResolvedValue(mockExistingProduct as any);

      const invalidUpdateData = {
        min_investment: 1000,
        max_investment: 500
      };

      await expect(productService.updateProduct('1', invalidUpdateData))
        .rejects.toThrow('Maximum investment must be greater than minimum investment');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: new Decimal(5.5),
        risk_level: 'low',
        min_investment: new Decimal(1000),
        max_investment: new Decimal(100000),
        description: 'Test Description',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.investment_products.findUnique.mockResolvedValue(mockProduct as any);
      mockPrisma.investments.count.mockResolvedValue(0);
      mockPrisma.investment_products.delete.mockResolvedValue(mockProduct as any);

      await productService.deleteProduct('1');

      expect(mockPrisma.investment_products.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('should throw error if product not found', async () => {
      mockPrisma.investment_products.findUnique.mockResolvedValue(null);

      await expect(productService.deleteProduct('999'))
        .rejects.toThrow('Product not found');
    });

    it('should throw error if product has active investments', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: new Decimal(5.5),
        risk_level: 'low',
        min_investment: new Decimal(1000),
        max_investment: new Decimal(100000),
        description: 'Test Description',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.investment_products.findUnique.mockResolvedValue(mockProduct as any);
      mockPrisma.investments.count.mockResolvedValue(5);

      await expect(productService.deleteProduct('1'))
        .rejects.toThrow('Cannot delete product with active investments');
    });
  });

  describe('generateProductDescription', () => {
    it('should generate product description using AI service', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Bond',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: 5.5,
        risk_level: 'low',
        min_investment: 1000,
        max_investment: 100000,
        description: 'Test Description',
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockDescription = {
        description: 'AI Generated Description',
        keyFeatures: ['Feature 1', 'Feature 2'],
        riskFactors: ['Risk 1', 'Risk 2'],
        suitability: 'Suitable for conservative investors'
      } as any;

      mockPrisma.investment_products.findUnique.mockResolvedValue(mockProduct as any);
      (mockAIInstance.generateProductDescription as any).mockResolvedValue(mockDescription);

      const result = await productService.generateProductDescription('1');

      expect(result).toEqual(mockDescription);
      expect(mockAIInstance.generateProductDescription).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw error if product not found', async () => {
      mockPrisma.investment_products.findUnique.mockResolvedValue(null);

      await expect(productService.generateProductDescription('999'))
        .rejects.toThrow('Product not found');
    });
  });

  describe('getProductRecommendations', () => {
    it('should return AI-generated recommendations', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Test Bond',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: 5.5,
          risk_level: 'low',
          min_investment: 1000,
          max_investment: 100000,
          description: 'Test Description',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const mockRecommendations = [
        {
          product: mockProducts[0],
          score: 0.9,
          reasons: ['Matches risk profile']
        }
      ] as any;

      mockPrisma.investment_products.findMany.mockResolvedValue(mockProducts as any);
      mockAIInstance.generateRecommendations.mockReturnValue(mockRecommendations);

      const result = await productService.getProductRecommendations('moderate', 5000, 12);

      expect(result).toEqual(mockRecommendations);
      expect(mockAIInstance.generateRecommendations).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: '1' })]),
        'moderate',
        5000,
        12
      );
    });
  });

  describe('getProductStats', () => {
    it('should return product statistics', async () => {
      const mockTypeStats = [
        { investment_type: 'bond', _count: { investment_type: 5 } },
        { investment_type: 'equity', _count: { investment_type: 3 } }
      ];

      const mockRiskStats = [
        { risk_level: 'low', _count: { risk_level: 4 } },
        { risk_level: 'moderate', _count: { risk_level: 3 } },
        { risk_level: 'high', _count: { risk_level: 1 } }
      ];

      const mockYieldStats = {
        _avg: { annual_yield: new Decimal(6.5) },
        _min: { annual_yield: new Decimal(3.0) },
        _max: { annual_yield: new Decimal(12.0) }
      };

      mockPrisma.investment_products.count.mockResolvedValue(8);
      mockPrisma.investment_products.groupBy
        .mockResolvedValueOnce(mockTypeStats as any)
        .mockResolvedValueOnce(mockRiskStats as any);
      mockPrisma.investment_products.aggregate.mockResolvedValue(mockYieldStats as any);

      const result = await productService.getProductStats();

      expect(result).toEqual({
        totalProducts: 8,
        productsByType: { bond: 5, equity: 3 },
        productsByRisk: { low: 4, moderate: 3, high: 1 },
        averageYield: 6.5,
        yieldRange: { min: 3.0, max: 12.0 }
      });
    });
  });
});
