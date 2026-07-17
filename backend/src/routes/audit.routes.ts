import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Audit log queries
router.get('/logs', authenticate, auditController.getLogs);
router.get('/logs/:logId', authenticate, auditController.getLogDetails);
router.post('/logs/search', authenticate, auditController.searchLogs);

// Hash chain verification
router.post('/verify', authenticate, auditController.verifyChain);
router.post('/verify/range', authenticate, auditController.verifyRange);
router.get('/verify/status', authenticate, auditController.getVerificationStatus);

// Export functionality
router.post('/export', authenticate, auditController.exportLogs);
router.get('/export/:exportId', authenticate, auditController.downloadExport);
router.get('/exports', authenticate, auditController.getExports);

// Analytics and reporting
router.get('/analytics/overview', authenticate, auditController.getAnalyticsOverview);
router.get('/analytics/timeline', authenticate, auditController.getTimeline);
router.get('/analytics/by-category', authenticate, auditController.getByCategory);
router.get('/analytics/by-user', authenticate, auditController.getByUser);
router.get('/analytics/security-events', authenticate, auditController.getSecurityEvents);

// Compliance reports
router.post('/reports/compliance', authenticate, auditController.generateComplianceReport);
router.get('/reports', authenticate, auditController.getReports);

export default router;
