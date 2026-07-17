import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './config/logger';
import { generalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import trustRoutes from './routes/trust.routes';
import approvalRoutes from './routes/approval.routes';
import auditRoutes from './routes/audit.routes';
import policyRoutes from './routes/policy.routes';
import adminRoutes from './routes/admin.routes';
import simulatorRoutes from './routes/simulator.routes';

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-screen-resolution',
    'x-battery-level', 'x-is-charging', 'x-orientation', 'x-screen-recording',
    'x-accessibility-services', 'x-behavioral-data'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
app.use('/api/', generalRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SentinelX API' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/simulator', simulatorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    httpServer.listen(PORT, () => {
      logger.info(`SentinelX API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
