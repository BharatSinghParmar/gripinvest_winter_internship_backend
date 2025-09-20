import request from 'supertest';
import app from '../../app';
import { prisma } from '../setup';
import { hashPassword } from '../../utils/password';
import { cleanDatabase } from '../helpers/database';

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    // Clean up before each test
    await cleanDatabase(prisma);
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        risk_appetite: 'moderate',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const userData = {
        first_name: 'John',
        email: 'john@example.com',
        password: 'Password123!',
      };

      // Create first user
      await request(app).post('/api/v1/auth/signup').send(userData);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate input data', async () => {
      const invalidData = {
        first_name: '',
        email: 'invalid-email',
        password: '123', // Too short
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await hashPassword('Password123!');
      await prisma.users.create({
        data: {
          first_name: 'John',
          email: 'john@example.com',
          password_hash: hashedPassword,
          risk_appetite: 'moderate',
          role: 'user',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'WrongPassword123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get refresh token
      const hashedPassword = await hashPassword('Password123!');
      await prisma.users.create({
        data: {
          first_name: 'John',
          email: 'john@example.com',
          password_hash: hashedPassword,
          risk_appetite: 'moderate',
          role: 'user',
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
        });

      const setCookieHeader = loginResponse.headers['set-cookie'];
      const refreshTokenCookie = Array.isArray(setCookieHeader) 
        ? setCookieHeader.find((cookie: string) => cookie.startsWith('refresh_token'))
        : undefined;

      if (!refreshTokenCookie) {
        throw new Error('Refresh token cookie not found');
      }

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject request without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token required');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      // Create user and login first
      const hashedPassword = await hashPassword('Password123!');
      await prisma.users.create({
        data: {
          first_name: 'John',
          email: 'john@example.com',
          password_hash: hashedPassword,
          risk_appetite: 'moderate',
          role: 'user',
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toBeDefined();
      
      const accessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });
  });
});
