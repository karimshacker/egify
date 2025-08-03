import 'express-async-errors';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

import { logger } from '@/utils/logger';
import { connectDatabase, disconnectDatabase } from '@/utils/database';
import { redisClient } from '@/utils/redis';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { securityMiddleware } from '@/middleware/security';

// Import routes
import authRoutes from '@/routes/authRoutes';
import userRoutes from '@/routes/userRoutes';
import storeRoutes from '@/routes/storeRoutes';
import productRoutes from '@/routes/productRoutes';
import orderRoutes from '@/routes/orderRoutes';
import paymentRoutes from '@/routes/paymentRoutes';
import shippingRoutes from '@/routes/shippingRoutes';
import analyticsRoutes from '@/routes/analyticsRoutes';
import marketingRoutes from '@/routes/marketingRoutes';
import webhookRoutes from '@/routes/webhookRoutes';
import adminRoutes from '@/routes/adminRoutes';

// Import types
import { Request, Response } from 'express';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Egify Platform API',
      version: '1.0.0',
      description: 'A comprehensive SaaS e-commerce platform API',
      contact: {
        name: 'Egify Team',
        email: 'support@egify.com',
      },
    },
    servers: [
      {
        url: process.env['API_URL'] || 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Session store
const sessionStore = new RedisStore({
  client: redisClient,
  prefix: 'egify:sess:',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env['FRONTEND_URL'] || 'http://localhost:3000',
    process.env['STOREFRONT_URL'] || 'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  store: sessionStore,
  secret: process.env['SESSION_SECRET'] || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env['NODE_ENV'] === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

// Logging
if (process.env['NODE_ENV'] === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// Custom middleware
app.use(requestLogger);
app.use(securityMiddleware);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealth = await import('@/utils/database').then(m => m.checkDatabaseHealth());
    
    // Check Redis connection
    const redisHealth = redisClient.status === 'ready';
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'],
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        redis: redisHealth ? 'healthy' : 'unhealthy',
      },
    };

    const isHealthy = dbHealth && redisHealth;
    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Service unavailable',
    });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-store', (storeId: string) => {
    socket.join(`store-${storeId}`);
    logger.info(`Client ${socket.id} joined store ${storeId}`);
  });

  socket.on('join-order', (orderId: string) => {
    socket.join(`order-${orderId}`);
    logger.info(`Client ${socket.id} joined order ${orderId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await disconnectDatabase();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await disconnectDatabase();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Initialize application
async function initializeApp() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start server
    const PORT = process.env['PORT'] || 4000;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Export for testing
export { app, server, io };

// Start the application
if (require.main === module) {
  initializeApp();
} 