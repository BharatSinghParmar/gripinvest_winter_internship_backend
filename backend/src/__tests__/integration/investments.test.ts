import request from 'supertest';
import app from '../../app';
import { prisma } from '../setup';
import { hashPassword } from '../../utils/password';
import { cleanDatabase } from '../helpers/database';

describe('Investments Integration Tests', () => {
  let userToken: string;
  let productId: string;

  beforeAll(async () => {
    // Clean baseline
    await cleanDatabase(prisma);

    // Create user
    const password_hash = await hashPassword('User123!');
    await prisma.users.create({
      data: {
        first_name: 'Investor',
        email: 'investor@test.com',
        password_hash,
        risk_appetite: 'moderate',
        role: 'user',
      },
    });
    // User created successfully

    // Login user to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'investor@test.com', password: 'User123!' })
      .expect(200);
    userToken = loginRes.body.data.accessToken;

    // Create product
    const product = await prisma.investment_products.create({
      data: {
        name: 'Integration Test Bond',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: 8.0,
        risk_level: 'low',
        min_investment: 1000,
        max_investment: 100000,
        description: 'Test product',
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
  });

  it('should create an investment', async () => {
    const res = await request(app)
      .post('/api/v1/investments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: productId, amount: 5000 })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.product_id).toBe(productId);
    expect(res.body.data.amount).toBe(5000);
    expect(res.body.data.status).toBe('active');
  });

  it('should list my investments with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/investments/me?page=1&pageSize=10')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pagination.page).toBe(1);
  });

  it('should return portfolio insights', async () => {
    const res = await request(app)
      .get('/api/v1/investments/portfolio/insights')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalInvested');
    expect(res.body.data).toHaveProperty('weightedAverageYield');
  });

  it('should reject investment below min amount', async () => {
    // Lower min investment product for this test
    const product = await prisma.investment_products.create({
      data: {
        name: 'Low Min FD',
        investment_type: 'fd',
        tenure_months: 6,
        annual_yield: 6.5,
        risk_level: 'low',
        min_investment: 2000,
      },
    });

    const res = await request(app)
      .post('/api/v1/investments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: product.id, amount: 1000 })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
