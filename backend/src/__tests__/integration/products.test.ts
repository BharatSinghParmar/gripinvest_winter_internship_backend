import request from 'supertest';
import app from '../../app';
import { prisma } from '../setup';
import { hashPassword } from '../../utils/password';
import { cleanDatabase } from '../helpers/database';

describe('Products Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testProduct: any;

  beforeAll(async () => {
    // Clean up first
    await cleanDatabase(prisma);

    // Create admin user
    const adminPassword = await hashPassword('Admin123!');
    await prisma.users.create({
      data: {
        first_name: 'Admin',
        email: 'admin@test.com',
        password_hash: adminPassword,
        risk_appetite: 'moderate',
        role: 'admin',
      },
    });

    // Create regular user
    const userPassword = await hashPassword('User123!');
    await prisma.users.create({
      data: {
        first_name: 'User',
        email: 'user@test.com',
        password_hash: userPassword,
        risk_appetite: 'moderate',
        role: 'user',
      },
    });

    // Login admin
    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
      });
    expect(adminLoginResponse.status).toBe(200);
    expect(adminLoginResponse.body.success).toBe(true);
    adminToken = adminLoginResponse.body.data.accessToken;

    // Login user
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'User123!',
      });
    expect(userLoginResponse.status).toBe(200);
    expect(userLoginResponse.body.success).toBe(true);
    userToken = userLoginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await cleanDatabase(prisma);
  });

  describe('GET /api/v1/products', () => {
    it('should get products without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should filter products by investment type', async () => {
      const response = await request(app)
        .get('/api/v1/products?investment_type=bond')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.every((product: any) => product.investment_type === 'bond')).toBe(true);
    });

    it('should filter products by risk level', async () => {
      const response = await request(app)
        .get('/api/v1/products?risk_level=low')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.every((product: any) => product.risk_level === 'low')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&pageSize=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(5);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    beforeEach(async () => {
      testProduct = await prisma.investment_products.create({
        data: {
          name: 'Test Product for Detail',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: 8.5,
          risk_level: 'low',
          min_investment: 1000,
          description: 'Test product for detail view',
        },
      });
    });

    afterEach(async () => {
      if (testProduct) {
        await prisma.investment_products.delete({ where: { id: testProduct.id } });
      }
    });

    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProduct.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProduct.id);
      expect(response.body.data.name).toBe('Test Product for Detail');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/products/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('POST /api/v1/products (Admin)', () => {
    it('should create product as admin', async () => {
      const productData = {
        name: 'New Admin Product',
        investment_type: 'fd',
        tenure_months: 24,
        annual_yield: 9.0,
        risk_level: 'moderate',
        min_investment: 5000,
        max_investment: 100000,
        description: 'Admin created product',
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.investment_type).toBe(productData.investment_type);

      // Cleanup
      await prisma.investment_products.delete({ where: { id: response.body.data.id } });
    });

    it('should reject product creation without admin role', async () => {
      const productData = {
        name: 'Unauthorized Product',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: 8.0,
        risk_level: 'low',
        min_investment: 1000,
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should validate product data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        investment_type: 'invalid', // Invalid: not in enum
        tenure_months: -1, // Invalid: negative
        annual_yield: 150, // Invalid: > 100%
        risk_level: 'invalid', // Invalid: not in enum
        min_investment: -1000, // Invalid: negative
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/v1/products/:id (Admin)', () => {
    let updateProduct: any;

    beforeEach(async () => {
      updateProduct = await prisma.investment_products.create({
        data: {
          name: 'Product to Update',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: 8.0,
          risk_level: 'low',
          min_investment: 1000,
        },
      });
    });

    afterEach(async () => {
      if (updateProduct) {
        await prisma.investment_products.delete({ where: { id: updateProduct.id } });
      }
    });

    it('should update product as admin', async () => {
      const updateData = {
        name: 'Updated Product Name',
        annual_yield: 9.5,
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/products/${updateProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.annual_yield).toBe(updateData.annual_yield);
    });

    it('should return 404 for non-existent product', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put('/api/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('DELETE /api/v1/products/:id (Admin)', () => {
    let deleteProduct: any;

    beforeEach(async () => {
      deleteProduct = await prisma.investment_products.create({
        data: {
          name: 'Product to Delete',
          investment_type: 'bond',
          tenure_months: 12,
          annual_yield: 8.0,
          risk_level: 'low',
          min_investment: 1000,
        },
      });
    });

    it('should delete product as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${deleteProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');

      // Verify product is deleted
      const deletedProduct = await prisma.investment_products.findUnique({
        where: { id: deleteProduct.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('GET /api/v1/products/recommendations/me', () => {
    it('should get product recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/products/recommendations/me?investment_amount=10000&preferred_tenure=12')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject recommendations without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/products/recommendations/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('GET /api/v1/products/admin/stats', () => {
    it('should get product statistics as admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalProducts');
      expect(response.body.data).toHaveProperty('productsByType');
      expect(response.body.data).toHaveProperty('productsByRisk');
      expect(response.body.data).toHaveProperty('averageYield');
    });

    it('should reject stats access without admin role', async () => {
      const response = await request(app)
        .get('/api/v1/products/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });
});
