import { ProductService } from '../../services/productService';
import { prisma } from '../setup';

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
  });

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      const filters = {
        page: 1,
        pageSize: 10,
      };

      const result = await productService.getProducts(filters);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('pageSize', 10);
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should filter products by investment type', async () => {
      const filters = {
        investment_type: 'bond' as const,
        page: 1,
        pageSize: 10,
      };

      const result = await productService.getProducts(filters);

      expect(result.items.every(product => product.investment_type === 'bond')).toBe(true);
    });

    it('should filter products by risk level', async () => {
      const filters = {
        risk_level: 'low' as const,
        page: 1,
        pageSize: 10,
      };

      const result = await productService.getProducts(filters);

      expect(result.items.every(product => product.risk_level === 'low')).toBe(true);
    });

    it('should filter products by yield range', async () => {
      const filters = {
        min_yield: 5,
        max_yield: 10,
        page: 1,
        pageSize: 10,
      };

      const result = await productService.getProducts(filters);

      expect(result.items.every(product => 
        product.annual_yield >= 5 && product.annual_yield <= 10
      )).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('should return product if exists', async () => {
      // Create a test product
      const testProduct = await prisma.investment_products.create({
        data: {
          name: 'Test Product',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: 8.5,
          risk_level: 'low',
          min_investment: 1000,
          description: 'Test description',
        },
      });

      const result = await productService.getProductById(testProduct.id);

      expect(result).toBeTruthy();
      expect(result?.id).toBe(testProduct.id);
      expect(result?.name).toBe('Test Product');

      // Cleanup
      try {
        await prisma.investment_products.delete({ where: { id: testProduct.id } });
      } catch (error) {
        // Product might already be deleted, ignore error
      }
    });

    it('should return null if product does not exist', async () => {
      const result = await productService.getProductById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Test Product',
        investment_type: 'fd' as const,
        tenure_months: 24,
        annual_yield: 9.0,
        risk_level: 'moderate' as const,
        min_investment: 5000,
        max_investment: 100000,
        description: 'New test product',
      };

      const result = await productService.createProduct(productData);

      expect(result).toBeTruthy();
      expect(result.name).toBe(productData.name);
      expect(result.investment_type).toBe(productData.investment_type);
      expect(result.annual_yield).toBe(productData.annual_yield);

      // Cleanup
      try {
        await prisma.investment_products.delete({ where: { id: result.id } });
      } catch (error) {
        // Product might already be deleted, ignore error
      }
    });

    it('should throw error if max_investment <= min_investment', async () => {
      const productData = {
        name: 'Invalid Product',
        investment_type: 'fd' as const,
        tenure_months: 12,
        annual_yield: 8.0,
        risk_level: 'low' as const,
        min_investment: 10000,
        max_investment: 5000, // Invalid: less than min_investment
      };

      await expect(productService.createProduct(productData)).rejects.toThrow(
        'Maximum investment must be greater than minimum investment'
      );
    });
  });

  describe('updateProduct', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await prisma.investment_products.create({
        data: {
          name: 'Update Test Product',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: 8.0,
          risk_level: 'low',
          min_investment: 1000,
          description: 'Original description',
        },
      });
    });

    afterEach(async () => {
      if (testProduct) {
        try {
          await prisma.investment_products.delete({ where: { id: testProduct.id } });
        } catch (error) {
          // Product might already be deleted, ignore error
        }
      }
    });

    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product Name',
        annual_yield: 9.0,
        description: 'Updated description',
      };

      const result = await productService.updateProduct(testProduct.id, updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.annual_yield).toBe(updateData.annual_yield);
      expect(result.description).toBe(updateData.description);
    });

    it('should throw error if product does not exist', async () => {
      const updateData = { name: 'Updated Name' };

      await expect(productService.updateProduct('non-existent-id', updateData)).rejects.toThrow(
        'Product not found'
      );
    });
  });

  describe('deleteProduct', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await prisma.investment_products.create({
        data: {
          name: 'Delete Test Product',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: 8.0,
          risk_level: 'low',
          min_investment: 1000,
        },
      });
    });

    it('should delete product successfully', async () => {
      await productService.deleteProduct(testProduct.id);

      const deletedProduct = await prisma.investment_products.findUnique({
        where: { id: testProduct.id },
      });

      expect(deletedProduct).toBeNull();
    });

    it('should throw error if product does not exist', async () => {
      await expect(productService.deleteProduct('non-existent-id')).rejects.toThrow(
        'Product not found'
      );
    });
  });

  describe('getProductStats', () => {
    it('should return product statistics', async () => {
      const stats = await productService.getProductStats();

      expect(stats).toHaveProperty('totalProducts');
      expect(stats).toHaveProperty('productsByType');
      expect(stats).toHaveProperty('productsByRisk');
      expect(stats).toHaveProperty('averageYield');
      expect(stats).toHaveProperty('yieldRange');
      expect(typeof stats.totalProducts).toBe('number');
      expect(typeof stats.averageYield).toBe('number');
    });
  });
});
