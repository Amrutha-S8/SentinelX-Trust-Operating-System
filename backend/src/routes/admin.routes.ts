import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// User management
router.get('/users', authenticate, adminController.getUsers);
router.get('/users/:userId', authenticate, adminController.getUserDetails);
router.patch('/users/:userId/role', authenticate, adminController.updateUserRole);
router.patch('/users/:userId/status', authenticate, adminController.updateUserStatus);
router.delete('/users/:userId', authenticate, adminController.deleteUser);

// System configuration
router.get('/config', authenticate, adminController.getConfig);
router.patch('/config', authenticate, adminController.updateConfig);

// Security settings
router.get('/security', authenticate, adminController.getSecuritySettings);
router.patch('/security', authenticate, adminController.updateSecuritySettings);

// Trust engine configuration
router.get('/trust-config', authenticate, adminController.getTrustConfig);
router.patch('/trust-config', authenticate, adminController.updateTrustConfig);

// Monitoring and health
router.get('/health', adminController.getSystemHealth);
router.get('/metrics', authenticate, adminController.getMetrics);
router.get('/logs', authenticate, adminController.getSystemLogs);

// Database maintenance
router.post('/maintenance/cleanup', authenticate, adminController.cleanupExpiredData);
router.post('/maintenance/reindex', authenticate, adminController.reindexDatabase);
router.post('/maintenance/backup', authenticate, adminController.createBackup);

export default router;
