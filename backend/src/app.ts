import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { correlationId } from './middleware/correlationId';
import { performanceMonitor } from './middleware/performanceMonitor';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Correlation ID
app.use(correlationId());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env['NODE_ENV'] === 'development' ? 100 : 10, // Higher limit for development
  message: 'Too many authentication attempts, please try again later.',
});

// Apply rate limiting (skip in test environment, relaxed in development)
if (process.env['NODE_ENV'] !== 'test') {
  if (process.env['NODE_ENV'] === 'development') {
    // More lenient rate limiting for development
    const devAuthLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 50, // 50 auth requests per 5 minutes
      message: 'Too many authentication attempts, please try again later.',
    });
    app.use('/api/v2/security', devAuthLimiter);
  } else {
    // Production rate limiting
    app.use('/api/v2', generalLimiter);
    app.use('/api/v2/security', authLimiter);
  }
}

// Request logging
app.use('/api/v2', requestLogger);

// Performance monitoring
app.use('/api/v2', performanceMonitor);

// Routes
app.use('/api/v2', routes);

// Error handling
app.use(errorHandler);

export default app;
