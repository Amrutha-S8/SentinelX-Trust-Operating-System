import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { rateLimiters } from '../middleware/rateLimiter';

const router = Router();

// Password-based authentication
router.post('/register', rateLimiters.auth, authController.register);
router.post('/login', rateLimiters.auth, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', rateLimiters.auth, authController.forgotPassword);
router.post('/reset-password', rateLimiters.auth, authController.resetPassword);
router.post('/change-password', authenticate, authController.changePassword);

// Passkey (WebAuthn) authentication
router.post('/passkey/register-options', authenticate, authController.passkeyRegisterOptions);
router.post('/passkey/register-verify', authenticate, authController.passkeyRegisterVerify);
router.post('/passkey/login-options', authController.passkeyLoginOptions);
router.post('/passkey/login-verify', authController.passkeyLoginVerify);
router.delete('/passkey/:credentialId', authenticate, authController.deletePasskey);

// TOTP MFA
router.post('/totp/setup', authenticate, authController.totpSetup);
router.post('/totp/verify-setup', authenticate, authController.totpVerifySetup);
router.post('/totp/verify', authController.totpVerify);
router.post('/totp/disable', authenticate, authController.totpDisable);

// Backup codes
router.post('/backup-codes/generate', authenticate, authController.generateBackupCodes);
router.post('/backup-codes/verify', authController.verifyBackupCode);
router.get('/backup-codes', authenticate, authController.getBackupCodes);

// Magic link authentication
router.post('/magic-link/request', rateLimiters.auth, authController.requestMagicLink);
router.get('/magic-link/verify/:token', authController.verifyMagicLink);

// QR code login
router.post('/qr/generate', authenticate, authController.generateQRCode);
router.post('/qr/verify', authController.verifyQRCode);
router.get('/qr/status/:sessionId', authController.getQRStatus);

// OAuth integrations
router.get('/oauth/:provider', authController.oauthInitiate);
router.get('/oauth/:provider/callback', authController.oauthCallback);
router.delete('/oauth/:provider', authenticate, authController.unlinkOAuth);

// Session management
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.delete('/sessions', authenticate, authController.revokeAllSessions);

// Device management
router.get('/devices', authenticate, authController.getDevices);
router.post('/devices/trust', authenticate, authController.trustDevice);
router.delete('/devices/:deviceId', authenticate, authController.removeDevice);

// Step-up authentication
router.post('/step-up/required', authenticate, authController.checkStepUpRequired);
router.post('/step-up/challenge', authenticate, authController.initiateStepUp);
router.post('/step-up/verify', authenticate, authController.verifyStepUp);

export default router;
