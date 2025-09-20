import request from 'supertest';
import app from '../../app';
import { prisma } from '../setup';
import { hashPassword } from '../../utils/password';

describe('Logging Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    // Clean baseline
    await prisma.audit_trails.deleteMany();
    await prisma.transaction_logs.deleteMany();
    await prisma.users.deleteMany();

    // Create admin user
    const adminPassword = await hashPassword('Admin123!');
    const admin = await prisma.users.create({
      data: {
        first_name: 'Admin',
        email: 'admin@test.com',
        password_hash: adminPassword,
        role: 'admin',
      },
    });
    adminId = admin.id;

    // Create regular user
    const userPassword = await hashPassword('User123!');
    const user = await prisma.users.create({
      data: {
        first_name: 'User',
        email: 'user@test.com',
        password_hash: userPassword,
        role: 'user',
      },
    });
    userId = user.id;

    // Login admin
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin123!' })
      .expect(200);
    adminToken = adminLoginRes.body.data.accessToken;

    // Login user
    const userLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@test.com', password: 'User123!' })
      .expect(200);
    userToken = userLoginRes.body.data.accessToken;

    // Generate some transaction logs
    await prisma.transaction_logs.createMany({
      data: [
        {
          user_id: adminId,
          endpoint: '/api/v1/auth/login',
          http_method: 'POST',
          status_code: 200,
          request_duration_ms: 150,
          response_size_bytes: 500,
          user_agent: 'Test Agent',
          ip_address: '127.0.0.1',
          correlation_id: 'test-correlation-1',
        },
        {
          user_id: userId,
          endpoint: '/api/v1/products',
          http_method: 'GET',
          status_code: 200,
          request_duration_ms: 200,
          response_size_bytes: 1000,
          user_agent: 'Test Agent',
          ip_address: '127.0.0.1',
          correlation_id: 'test-correlation-2',
        },
        {
          user_id: null,
          endpoint: '/api/v1/health',
          http_method: 'GET',
          status_code: 200,
          request_duration_ms: 50,
          response_size_bytes: 200,
          user_agent: 'Health Check',
          ip_address: '127.0.0.1',
          correlation_id: 'test-correlation-3',
        },
        {
          user_id: userId,
          endpoint: '/api/v1/investments',
          http_method: 'POST',
          status_code: 400,
          error_message: 'Validation failed',
          error_code: 'VALIDATION_ERROR',
          request_duration_ms: 100,
          response_size_bytes: 300,
          user_agent: 'Test Agent',
          ip_address: '127.0.0.1',
          correlation_id: 'test-correlation-4',
        },
      ],
    });

    // Generate some audit trails
    await prisma.audit_trails.createMany({
      data: [
        {
          id: 'audit-1',
          user_id: adminId,
          action: 'login',
          resource_type: 'authentication',
          resource_id: null,
          details: { ip_address: '127.0.0.1' },
          ip_address: '127.0.0.1',
          user_agent: 'Test Agent',
        },
        {
          id: 'audit-2',
          user_id: userId,
          action: 'view',
          resource_type: 'product',
          resource_id: 'product-1',
          details: { product_name: 'Test Product' },
          ip_address: '127.0.0.1',
          user_agent: 'Test Agent',
        },
        {
          id: 'audit-3',
          user_id: null,
          action: 'startup',
          resource_type: 'system',
          resource_id: null,
          details: { version: '1.0.0' },
          ip_address: null,
          user_agent: null,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.audit_trails.deleteMany();
    await prisma.transaction_logs.deleteMany();
    await prisma.users.deleteMany();
  });

  describe('Transaction Logs', () => {
    it('should get transaction logs (admin only)', async () => {
      const res = await request(app)
        .get('/api/v1/logging/transaction-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(4);
      expect(res.body.data.pagination.total).toBe(4);
    });

    it('should filter transaction logs by user', async () => {
      const res = await request(app)
        .get('/api/v1/logging/transaction-logs?userId=' + userId)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
    });

    it('should filter transaction logs by status code', async () => {
      const res = await request(app)
        .get('/api/v1/logging/transaction-logs?statusCode=400')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].status_code).toBe(400);
    });

    it('should reject non-admin access', async () => {
      await request(app)
        .get('/api/v1/logging/transaction-logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Performance Metrics', () => {
    it('should get performance metrics', async () => {
      const res = await request(app)
        .get('/api/v1/logging/performance/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('average_response_time');
      expect(res.body.data).toHaveProperty('total_requests');
      expect(res.body.data).toHaveProperty('error_rate');
    });

    it('should get slowest endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/logging/performance/slowest-endpoints')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get error-prone endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/logging/performance/error-prone-endpoints')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get performance trends', async () => {
      const res = await request(app)
        .get('/api/v1/logging/performance/trends?days=7')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Error Analysis', () => {
    it('should get error analysis', async () => {
      const res = await request(app)
        .get('/api/v1/logging/error-analysis?days=7')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('error_patterns');
      expect(res.body.data).toHaveProperty('error_hotspots');
      expect(res.body.data).toHaveProperty('insights');
      expect(res.body.data).toHaveProperty('recommendations');
    });
  });

  describe('Audit Trail', () => {
    it('should get audit trail', async () => {
      const res = await request(app)
        .get('/api/v1/logging/audit-trail')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(3);
      expect(res.body.data.pagination.total).toBe(3);
    });

    it('should filter audit trail by user', async () => {
      const res = await request(app)
        .get('/api/v1/logging/audit-trail?userId=' + userId)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
    });

    it('should get audit statistics', async () => {
      const res = await request(app)
        .get('/api/v1/logging/audit-statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_actions');
      expect(res.body.data).toHaveProperty('user_actions');
      expect(res.body.data).toHaveProperty('system_actions');
    });

    it('should get user audit trail', async () => {
      const res = await request(app)
        .get(`/api/v1/logging/audit-trail/user/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
    });

    it('should get resource audit trail', async () => {
      const res = await request(app)
        .get('/api/v1/logging/audit-trail/resource/product/product-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
    });
  });

  describe('Export Logs', () => {
    it('should export transaction logs as JSON', async () => {
      const res = await request(app)
        .get('/api/v1/logging/export?logType=transaction&format=json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/json');
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('should export audit logs as CSV', async () => {
      const res = await request(app)
        .get('/api/v1/logging/export?logType=audit&format=csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('Database Metrics', () => {
    it('should get database metrics', async () => {
      const res = await request(app)
        .get('/api/v1/logging/performance/database')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_queries');
      expect(res.body.data).toHaveProperty('slow_queries');
      expect(res.body.data).toHaveProperty('average_query_time');
    });
  });
});
