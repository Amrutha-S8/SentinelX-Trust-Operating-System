import { Router } from 'express';
import { policyController } from '../controllers/policy.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Policy CRUD
router.post('/', authenticate, policyController.createPolicy);
router.get('/', authenticate, policyController.getPolicies);
router.get('/:policyId', authenticate, policyController.getPolicyDetails);
router.put('/:policyId', authenticate, policyController.updatePolicy);
router.delete('/:policyId', authenticate, policyController.deletePolicy);

// Policy activation/deactivation
router.patch('/:policyId/enable', authenticate, policyController.enablePolicy);
router.patch('/:policyId/disable', authenticate, policyController.disablePolicy);

// Policy evaluation and testing
router.post('/:policyId/test', authenticate, policyController.testPolicy);
router.post('/evaluate', authenticate, policyController.evaluatePolicies);

// Policy exceptions
router.post('/:policyId/exceptions', authenticate, policyController.addException);
router.delete('/:policyId/exceptions/:exceptionId', authenticate, policyController.removeException);
router.get('/:policyId/exceptions', authenticate, policyController.getExceptions);

// Policy templates
router.get('/templates/list', authenticate, policyController.getTemplates);
router.post('/templates/:templateId/apply', authenticate, policyController.applyTemplate);

// Policy statistics
router.get('/:policyId/stats', authenticate, policyController.getPolicyStats);
router.get('/stats/overview', authenticate, policyController.getOverviewStats);

export default router;
