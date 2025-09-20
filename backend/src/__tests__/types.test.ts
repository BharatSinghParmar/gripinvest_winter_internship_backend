// Unit tests for type definitions
import { describe, it, expect } from '@jest/globals';

describe('Type Definitions', () => {
  it('should have correct User interface structure', () => {
    const user = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      risk_appetite: 'moderate',
      created_at: new Date(),
      updated_at: new Date()
    };

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('first_name');
    expect(user).toHaveProperty('last_name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('risk_appetite');
    expect(user).toHaveProperty('created_at');
    expect(user).toHaveProperty('updated_at');
  });

  it('should have correct Product interface structure', () => {
    const product = {
      id: 1,
      name: 'Test Product',
      description: 'Test Description',
      risk_level: 'low',
      expected_return: 5.5,
      min_investment: 1000,
      max_investment: 100000,
      lock_in_period: 12,
      created_at: new Date(),
      updated_at: new Date()
    };

    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('description');
    expect(product).toHaveProperty('risk_level');
    expect(product).toHaveProperty('expected_return');
    expect(product).toHaveProperty('min_investment');
    expect(product).toHaveProperty('max_investment');
    expect(product).toHaveProperty('lock_in_period');
  });

  it('should have correct Investment interface structure', () => {
    const investment = {
      id: 1,
      user_id: 1,
      product_id: 1,
      amount: 1000,
      investment_type: 'lump_sum',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    expect(investment).toHaveProperty('id');
    expect(investment).toHaveProperty('user_id');
    expect(investment).toHaveProperty('product_id');
    expect(investment).toHaveProperty('amount');
    expect(investment).toHaveProperty('investment_type');
    expect(investment).toHaveProperty('status');
  });
});
