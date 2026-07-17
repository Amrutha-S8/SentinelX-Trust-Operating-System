import { Router } from 'express';
import { simulatorController } from '../controllers/simulator.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Attack simulations
router.post('/attacks/sim-swap', authenticate, simulatorController.simulateSIMSwap);
router.post('/attacks/impossible-travel', authenticate, simulatorController.simulateImpossibleTravel);
router.post('/attacks/credential-stuffing', authenticate, simulatorController.simulateCredentialStuffing);
router.post('/attacks/mfa-fatigue', authenticate, simulatorController.simulateMFAFatigue);
router.post('/attacks/phishing', authenticate, simulatorController.simulatePhishing);
router.post('/attacks/session-hijack', authenticate, simulatorController.simulateSessionHijack);
router.post('/attacks/brute-force', authenticate, simulatorController.simulateBruteForce);
router.post('/attacks/account-takeover', authenticate, simulatorController.simulateAccountTakeover);

// Simulation management
router.get('/simulations', authenticate, simulatorController.getSimulations);
router.get('/simulations/:simulationId', authenticate, simulatorController.getSimulationDetails);
router.delete('/simulations/:simulationId', authenticate, simulatorController.deleteSimulation);

// Scenario testing
router.post('/scenarios/run', authenticate, simulatorController.runScenario);
router.get('/scenarios/templates', authenticate, simulatorController.getScenarioTemplates);
router.post('/scenarios/custom', authenticate, simulatorController.createCustomScenario);

// Reports and analysis
router.get('/reports', authenticate, simulatorController.getSimulationReports);
router.get('/reports/:reportId', authenticate, simulatorController.getReportDetails);
router.post('/reports/generate', authenticate, simulatorController.generateReport);

// Detection metrics
router.get('/metrics/detection-rate', authenticate, simulatorController.getDetectionRate);
router.get('/metrics/response-time', authenticate, simulatorController.getResponseTime);
router.get('/metrics/false-positives', authenticate, simulatorController.getFalsePositives);

export default router;
