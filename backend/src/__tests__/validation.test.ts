// Unit tests for validation schemas
import { describe, it, expect } from '@jest/globals';
import { signupSchema, loginSchema } from '../validation/authSchemas';
import { createInvestmentSchema } from '../validation/investmentSchemas';
import { createProductSchema } from '../validation/productSchemas';

describe('Auth Validation Schemas', () => {
  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        risk_appetite: 'moderate'
      };
      
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid-email',
        password: 'Password123!',
        risk_appetite: 'moderate'
      };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: '123',
        risk_appetite: 'moderate'
      };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'john@example.com',
        password: 'Password123!'
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'Password123!'
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Investment Validation Schemas', () => {
  describe('createInvestmentSchema', () => {
    it('should validate correct investment data', () => {
      const validData = {
        product_id: '1',
        amount: 1000
      };
      
      const result = createInvestmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        product_id: '1',
        amount: -100
      };
      
      const result = createInvestmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Product Validation Schemas', () => {
  describe('createProductSchema', () => {
    it('should validate correct product data', () => {
      const validData = {
        name: 'Test Product',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: 5.5,
        risk_level: 'low',
        min_investment: 1000,
        max_investment: 100000,
        description: 'Test Description'
      };
      
      const result = createProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid risk level', () => {
      const invalidData = {
        name: 'Test Product',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: 5.5,
        risk_level: 'invalid',
        min_investment: 1000,
        max_investment: 100000,
        description: 'Test Description'
      };
      
      const result = createProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
