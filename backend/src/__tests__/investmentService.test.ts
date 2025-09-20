import { InvestmentService } from '../services/investmentService';
import { prisma } from '../prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
jest.mock('../prisma/client', () => ({
  prisma: {
    investment_products: {
      findUnique: jest.fn()
    },
    investments: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn()
    }
  }
}));

const mockPrisma = prisma as any;

describe('InvestmentService', () => {
  let investmentService: InvestmentService;

  beforeEach(() => {
    investmentService = new InvestmentService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validInvestmentInput = {
      product_id: '1',
      amount: 5000
    };

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

    it('should create investment successfully', async () => {
      const mockCreatedInvestment = {
        id: '1',
        user_id: 'user1',
        product_id: '1',
        amount: new Decimal(5000),
        invested_at: new Date(),
        status: 'active',
        expected_return: new Decimal(5275),
        maturity_date: new Date()
      };

      mockPrisma.investment_products.findUnique.mockResolvedValue(mockProduct as any);
      mockPrisma.investments.create.mockResolvedValue(mockCreatedInvestment as any);

      const result = await investmentService.create('user1', validInvestmentInput);

      expect(result).toBeDefined();
      expect(result.user_id).toBe('user1');
      expect(result.product_id).toBe('1');
      expect(result.amount).toBe(5000);
      expect(mockPrisma.investment_products.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('should throw error if product not found', async () => {
      mockPrisma.investment_products.findUnique.mockResolvedValue(null);

      await expect(investmentService.create('user1', validInvestmentInput))
        .rejects.toThrow('Product not found');
    });

    it('should throw error if amount below minimum investment', async () => {
      mockPrisma.investment_products.findUnique.mockResolvedValue(mockProduct as any);

      const invalidInput = {
        product_id: '1',
        amount: 500 // Below minimum of 1000
      };

      await expect(investmentService.create('user1', invalidInput))
        .rejects.toThrow('Amount below minimum investment (1000)');
    });

    it('should throw error if amount exceeds maximum investment', async () => {
      mockPrisma.investment_products.findUnique.mockResolvedValue(mockProduct as any);

      const invalidInput = {
        product_id: '1',
        amount: 150000 // Above maximum of 100000
      };

      await expect(investmentService.create('user1', invalidInput))
        .rejects.toThrow('Amount exceeds maximum investment (100000)');
    });

    it('should calculate expected return correctly', async () => {
      const mockCreatedInvestment = {
        id: '1',
        user_id: 'user1',
        product_id: '1',
        amount: new Decimal(5000),
        invested_at: new Date(),
        status: 'active',
        expected_return: new Decimal(5275), // 5000 + (5000 * 0.055 * 1) = 5275
        maturity_date: new Date()
      };

      mockPrisma.investment_products.findUnique.mockResolvedValue(mockProduct as any);
      mockPrisma.investments.create.mockResolvedValue(mockCreatedInvestment as any);

      const result = await investmentService.create('user1', validInvestmentInput);

      expect(result.expected_return).toBe(5275);
    });
  });

  describe('listForUser', () => {
    it('should return investments with pagination', async () => {
      const mockInvestments = [
        {
          id: '1',
          user_id: 'user1',
          product_id: '1',
          amount: new Decimal(5000),
          invested_at: new Date(),
          status: 'active',
          expected_return: new Decimal(5275),
          maturity_date: new Date()
        }
      ];

      mockPrisma.investments.count.mockResolvedValue(1);
      mockPrisma.investments.findMany.mockResolvedValue(mockInvestments as any);

      const filters = { page: 1, pageSize: 20 };
      const result = await investmentService.listForUser('user1', filters);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply status filter', async () => {
      mockPrisma.investments.count.mockResolvedValue(0);
      mockPrisma.investments.findMany.mockResolvedValue([]);

      const filters = { status: 'active' as const, page: 1, pageSize: 20 };

      await investmentService.listForUser('user1', filters);

      expect(mockPrisma.investments.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user1',
          status: 'active'
        },
        skip: 0,
        take: 20,
        orderBy: [{ invested_at: 'desc' }]
      });
    });

    it('should apply date range filters', async () => {
      mockPrisma.investments.count.mockResolvedValue(0);
      mockPrisma.investments.findMany.mockResolvedValue([]);

      const filters = {
        from: '2023-01-01',
        to: '2023-12-31',
        page: 1,
        pageSize: 20
      };

      await investmentService.listForUser('user1', filters);

      expect(mockPrisma.investments.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user1',
          invested_at: {
            gte: new Date('2023-01-01'),
            lte: new Date('2023-12-31')
          }
        },
        skip: 0,
        take: 20,
        orderBy: [{ invested_at: 'desc' }]
      });
    });
  });

  describe('portfolioSummary', () => {
    const mockInvestments = [
      {
        id: '1',
        user_id: 'user1',
        product_id: '1',
        amount: new Decimal(5000),
        invested_at: new Date(),
        status: 'active',
        expected_return: new Decimal(5275),
        maturity_date: new Date(),
        product: {
          id: '1',
          name: 'Test Bond',
          risk_level: 'low',
          annual_yield: new Decimal(5.5)
        }
      },
      {
        id: '2',
        user_id: 'user1',
        product_id: '2',
        amount: new Decimal(3000),
        invested_at: new Date(),
        status: 'matured',
        expected_return: new Decimal(3300),
        maturity_date: new Date(),
        product: {
          id: '2',
          name: 'Test Equity',
          risk_level: 'high',
          annual_yield: new Decimal(10.0)
        }
      }
    ];

    it('should calculate portfolio summary correctly', async () => {
      mockPrisma.investments.findMany.mockResolvedValue(mockInvestments as any);

      const result = await investmentService.portfolioSummary('user1');

      expect(result).toHaveProperty('totalInvested');
      expect(result).toHaveProperty('totalExpectedReturn');
      expect(result).toHaveProperty('activeInvestments');
      expect(result).toHaveProperty('maturedInvestments');
      expect(result).toHaveProperty('cancelledInvestments');
      expect(result).toHaveProperty('riskDistribution');
      expect(result).toHaveProperty('topHoldings');
      expect(result).toHaveProperty('weightedAverageYield');

      expect(result.totalInvested).toBe(8000);
      expect(result.totalExpectedReturn).toBe(8575);
      expect(result.activeInvestments).toBe(1);
      expect(result.maturedInvestments).toBe(1);
      expect(result.cancelledInvestments).toBe(0);
    });

    it('should calculate risk distribution correctly', async () => {
      mockPrisma.investments.findMany.mockResolvedValue(mockInvestments as any);

      const result = await investmentService.portfolioSummary('user1');

      expect(result.riskDistribution).toHaveLength(2);
      expect(result.riskDistribution).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ risk_level: 'low', amount: 5000 }),
          expect.objectContaining({ risk_level: 'high', amount: 3000 })
        ])
      );
    });

    it('should calculate top holdings correctly', async () => {
      mockPrisma.investments.findMany.mockResolvedValue(mockInvestments as any);

      const result = await investmentService.portfolioSummary('user1');

      expect(result.topHoldings).toHaveLength(2);
      expect(result.topHoldings[0]).toEqual(
        expect.objectContaining({
          product_id: '1',
          name: 'Test Bond',
          amount: 5000
        })
      );
    });

    it('should calculate weighted average yield correctly', async () => {
      mockPrisma.investments.findMany.mockResolvedValue(mockInvestments as any);

      const result = await investmentService.portfolioSummary('user1');

      // Weighted average: (5000 * 5.5 + 3000 * 10.0) / 8000 = 7.1875
      expect(result.weightedAverageYield).toBe(7.19);
    });

    it('should apply date range filters', async () => {
      mockPrisma.investments.findMany.mockResolvedValue([]);

      await investmentService.portfolioSummary('user1', '2023-01-01', '2023-12-31');

      expect(mockPrisma.investments.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user1',
          invested_at: {
            gte: new Date('2023-01-01'),
            lte: new Date('2023-12-31')
          }
        },
        include: { product: true }
      });
    });

    it('should handle empty portfolio', async () => {
      mockPrisma.investments.findMany.mockResolvedValue([]);

      const result = await investmentService.portfolioSummary('user1');

      expect(result.totalInvested).toBe(0);
      expect(result.totalExpectedReturn).toBe(0);
      expect(result.activeInvestments).toBe(0);
      expect(result.maturedInvestments).toBe(0);
      expect(result.cancelledInvestments).toBe(0);
      expect(result.riskDistribution).toEqual([]);
      expect(result.topHoldings).toEqual([]);
      expect(result.weightedAverageYield).toBe(0);
    });
  });
});
