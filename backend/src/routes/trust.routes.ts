import { Router } from 'express';
import { trustController } from '../controllers/trust.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Trust score evaluation
router.post('/evaluate', authenticate, trustController.evaluateTrust);
router.get('/score', authenticate, trustController.getCurrentScore);
router.get('/history', authenticate, trustController.getTrustHistory);
router.get('/history/:logId', authenticate, trustController.getTrustLogDetails);

// Context data
router.post('/context/capture', authenticate, trustController.captureContext);
router.get('/context/current', authenticate, trustController.getCurrentContext);

// Behavioral analysis
router.post('/behavioral/capture', authenticate, trustController.captureBehavioralData);
router.get('/behavioral/profile', authenticate, trustController.getBehavioralProfile);
router.post('/behavioral/analyze', authenticate, trustController.analyzeBehavior);

// Risk assessment
router.post('/risk/assess', authenticate, trustController.assessRisk);
router.get('/risk/factors', authenticate, trustController.getRiskFactors);
router.get('/risk/alerts', authenticate, trustController.getSecurityAlerts);

// Trust trends and analytics
router.get('/analytics/trends', authenticate, trustController.getTrustTrends);
router.get('/analytics/patterns', authenticate, trustController.getBehavioralPatterns);
router.get('/analytics/anomalies', authenticate, trustController.getAnomalies);

export default router;
