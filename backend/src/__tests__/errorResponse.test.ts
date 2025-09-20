import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError, 
  RateLimitError, 
  DatabaseError, 
  ExternalServiceError,
  createErrorResponse,
  createSuccessResponse
} from '../utils/errorResponse';

describe('Error Response Utilities', () => {
  describe('AppError', () => {
    it('should create AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_ERROR', false, { field: 'value' });
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('CUSTOM_ERROR');
      expect(error.isOperational).toBe(false);
      expect(error.details).toEqual({ field: 'value' });
    });

    it('should maintain stack trace', () => {
      const error = new AppError('Stack trace test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with default values', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with details', () => {
      const error = new ValidationError('Validation failed', ['Field is required'], { field: 'email' });
      
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('AUTHENTICATION_ERROR');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Invalid token');
      
      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('should create AuthorizationError with default message', () => {
      const error = new AuthorizationError();
      
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('AUTHORIZATION_ERROR');
      expect(error.name).toBe('AuthorizationError');
    });

    it('should create AuthorizationError with custom message', () => {
      const error = new AuthorizationError('Admin access required');
      
      expect(error.message).toBe('Admin access required');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with default resource', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('NOT_FOUND_ERROR');
      expect(error.name).toBe('NotFoundError');
    });

    it('should create NotFoundError with custom resource', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError', () => {
      const error = new ConflictError('Email already exists');
      
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe('CONFLICT_ERROR');
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('RateLimitError', () => {
    it('should create RateLimitError with default message', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.errorCode).toBe('RATE_LIMIT_ERROR');
      expect(error.name).toBe('RateLimitError');
    });

    it('should create RateLimitError with custom message', () => {
      const error = new RateLimitError('Rate limit exceeded for this endpoint');
      
      expect(error.message).toBe('Rate limit exceeded for this endpoint');
      expect(error.statusCode).toBe(429);
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError with default error code', () => {
      const error = new DatabaseError('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('DATABASE_ERROR');
      expect(error.name).toBe('DatabaseError');
    });

    it('should create DatabaseError with custom error code', () => {
      const error = new DatabaseError('Query failed', 'QUERY_ERROR', { query: 'SELECT * FROM users' });
      
      expect(error.message).toBe('Query failed');
      expect(error.errorCode).toBe('QUERY_ERROR');
      expect(error.details).toEqual({ query: 'SELECT * FROM users' });
    });
  });

  describe('ExternalServiceError', () => {
    it('should create ExternalServiceError with default message', () => {
      const error = new ExternalServiceError('PaymentGateway');
      
      expect(error.message).toBe('External service error: PaymentGateway');
      expect(error.statusCode).toBe(502);
      expect(error.errorCode).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.name).toBe('ExternalServiceError');
    });

    it('should create ExternalServiceError with custom message', () => {
      const error = new ExternalServiceError('PaymentGateway', 'Payment processing failed');
      
      expect(error.message).toBe('Payment processing failed');
      expect(error.statusCode).toBe(502);
    });
  });

  describe('Response Utilities', () => {
    describe('createErrorResponse', () => {
      it('should create error response with default values', () => {
        const response = createErrorResponse('Something went wrong');
        
        expect(response).toEqual({
          success: false,
          message: 'Something went wrong',
        });
      });

      it('should create error response with all parameters', () => {
        const response = createErrorResponse('Validation failed', 400, 'VALIDATION_ERROR', ['Email is required']);
        
        expect(response).toEqual({
          success: false,
          message: 'Validation failed',
          errorCode: 'VALIDATION_ERROR',
          errors: ['Email is required'],
        });
      });
    });

    describe('createSuccessResponse', () => {
      it('should create success response with default message', () => {
        const data = { id: 1, name: 'Test' };
        const response = createSuccessResponse(data);
        
        expect(response).toEqual({
          success: true,
          message: 'Success',
          data,
        });
      });

      it('should create success response with custom message', () => {
        const data = { id: 1, name: 'Test' };
        const response = createSuccessResponse(data, 'User created successfully');
        
        expect(response).toEqual({
          success: true,
          message: 'User created successfully',
          data,
        });
      });
    });
  });

  describe('Error Inheritance', () => {
    it('should properly inherit from Error', () => {
      const error = new AppError('Test error');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should properly inherit from AppError', () => {
      const error = new ValidationError('Test validation error');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });
  });

  describe('Error Properties', () => {
    it('should have all required properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR', true, { test: 'data' });
      
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('errorCode');
      expect(error).toHaveProperty('isOperational');
      expect(error).toHaveProperty('details');
      expect(error).toHaveProperty('name');
      expect(error).toHaveProperty('stack');
    });

    it('should be enumerable properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      const properties = Object.getOwnPropertyNames(error);
      
      expect(properties).toContain('message');
      expect(properties).toContain('statusCode');
      expect(properties).toContain('errorCode');
      expect(properties).toContain('isOperational');
    });
  });
});
