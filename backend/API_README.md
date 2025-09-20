# GripInvest API Documentation

## Overview

The GripInvest API is a comprehensive investment platform backend that provides user authentication, product management, investment tracking, and transaction logging capabilities. Built with Node.js, Express.js, TypeScript, and Prisma ORM.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Data Models](#data-models)
- [Testing](#testing)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:8080`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication with the following flow:

### 1. User Registration
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "risk_appetite": "moderate"
}
```

### 2. User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

### 3. Using Access Tokens
Include the access token in the Authorization header:
```http
Authorization: Bearer <your-access-token>
```

### 4. Token Refresh
The API automatically sets a refresh token cookie. To refresh your access token:
```http
POST /api/v1/auth/refresh
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | No (cookie) |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/auth/password/otp` | Request password reset OTP | No |
| POST | `/auth/password/reset` | Reset password with OTP | No |
| POST | `/auth/password/strength` | Check password strength | No |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get investment products | No |
| GET | `/products/{id}` | Get product by ID | No |
| GET | `/products/recommendations/me` | Get personalized recommendations | Yes |
| POST | `/products` | Create product (Admin) | Yes (Admin) |
| PUT | `/products/{id}` | Update product (Admin) | Yes (Admin) |
| DELETE | `/products/{id}` | Delete product (Admin) | Yes (Admin) |
| POST | `/products/{id}/description/ai` | Generate AI description (Admin) | Yes (Admin) |
| GET | `/products/admin/stats` | Get product statistics (Admin) | Yes (Admin) |

### Investment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/investments` | Create new investment | Yes |
| GET | `/investments/me` | Get user investments | Yes |
| GET | `/investments/portfolio/insights` | Get portfolio insights | Yes |

### Logging Endpoints (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/logs/transaction-logs` | Get transaction logs | Yes (Admin) |
| GET | `/logs/performance/metrics` | Get performance metrics | Yes (Admin) |
| GET | `/logs/performance/slowest-endpoints` | Get slowest endpoints | Yes (Admin) |
| GET | `/logs/error-analysis` | Get error analysis | Yes (Admin) |
| GET | `/logs/audit-trail` | Get audit trail | Yes (Admin) |
| GET | `/logs/export` | Export logs | Yes (Admin) |

### Health Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Basic health check | No |
| GET | `/health/detailed` | Detailed health check | No |

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "errors": ["Detailed error messages"]
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `AUTHENTICATION_ERROR` | 401 | Authentication required |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND_ERROR` | 404 | Resource not found |
| `CONFLICT_ERROR` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **OTP Requests**: 3 requests per 15 minutes per email/IP
- **Auth Endpoints**: 10 requests per minute per IP
- **General API**: 100 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Data Models

### User
```typescript
interface User {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  risk_appetite: 'low' | 'moderate' | 'high';
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}
```

### Product
```typescript
interface Product {
  id: string;
  name: string;
  investment_type: 'bond' | 'fd' | 'mf' | 'etf' | 'other';
  tenure_months: number;
  annual_yield: number;
  risk_level: 'low' | 'moderate' | 'high';
  min_investment: number;
  max_investment?: number;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Investment
```typescript
interface Investment {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  expected_return?: number;
  status: 'active' | 'completed' | 'cancelled';
  invested_at: Date;
  maturity_date?: Date;
  product: Product;
}
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=authService

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
The project maintains high test coverage with:
- Unit tests for all services and utilities
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Mock tests for external dependencies

## Deployment

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=grip_invest

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Server
PORT=8080
NODE_ENV=production

# CORS
FRONTEND_URL=http://localhost:3000
```

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t gripinvest-api .

# Run with Docker Compose
docker-compose up -d
```

## API Examples

### Complete User Flow

1. **Register a new user:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "risk_appetite": "moderate"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

3. **Get products:**
```bash
curl -X GET "http://localhost:8080/api/v1/products?risk_level=moderate&page=1&pageSize=10" \
  -H "Authorization: Bearer <access-token>"
```

4. **Create investment:**
```bash
curl -X POST http://localhost:8080/api/v1/investments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{
    "product_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 10000
  }'
```

5. **Get portfolio insights:**
```bash
curl -X GET http://localhost:8080/api/v1/investments/portfolio/insights \
  -H "Authorization: Bearer <access-token>"
```

## Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Secure access and refresh tokens
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Zod schema validation
- **CORS Protection**: Configurable CORS policies
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and validation

## Monitoring and Logging

- **Structured Logging**: JSON format with correlation IDs
- **Transaction Logging**: All API calls are logged
- **Performance Monitoring**: Response time tracking
- **Error Tracking**: Comprehensive error logging
- **Health Checks**: System health monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
