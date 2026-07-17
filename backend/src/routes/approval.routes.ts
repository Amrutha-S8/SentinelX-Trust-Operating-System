import { Router } from 'express';
import { approvalController } from '../controllers/approval.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Approval requests
router.post('/request', authenticate, approvalController.createRequest);
router.get('/requests', authenticate, approvalController.getRequests);
router.get('/requests/pending', authenticate, approvalController.getPendingRequests);
router.get('/requests/:requestId', authenticate, approvalController.getRequestDetails);

// Approval actions
router.post('/requests/:requestId/approve', authenticate, approvalController.approveRequest);
router.post('/requests/:requestId/reject', authenticate, approvalController.rejectRequest);
router.post('/requests/:requestId/break-glass', authenticate, approvalController.useBreakGlass);

// Escalations
router.post('/requests/:requestId/escalate', authenticate, approvalController.escalateRequest);
router.get('/escalations', authenticate, approvalController.getEscalations);

// Notifications
router.post('/notifications/send', authenticate, approvalController.sendNotifications);
router.get('/notifications', authenticate, approvalController.getNotifications);
router.patch('/notifications/:notificationId/read', authenticate, approvalController.markNotificationRead);

// Statistics
router.get('/stats', authenticate, approvalController.getApprovalStats);
router.get('/stats/user/:userId', authenticate, approvalController.getUserApprovalStats);

export default router;
