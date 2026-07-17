import { Application } from 'express';
import authRoutes from './auth.routes';
import trustRoutes from './trust.routes';
import approvalRoutes from './approval.routes';
import auditRoutes from './audit.routes';
import policyRoutes from './policy.routes';
import adminRoutes from './admin.routes';
import simulatorRoutes from './simulator.routes';

export function registerRoutes(app: Application): void {
  app.use('/api/auth', authRoutes);
  app.use('/api/trust', trustRoutes);
  app.use('/api/approvals', approvalRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/policies', policyRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/simulator', simulatorRoutes);
}
