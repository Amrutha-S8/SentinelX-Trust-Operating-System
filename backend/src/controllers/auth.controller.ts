import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateTokenPair, verifyRefreshToken, revokeToken } from '../utils/jwt';
import { generateTOTPSecret, verifyTOTP, generateBackupCodes } from '../utils/totp';
import { generateMagicLink, verifyMagicLink } from '../utils/magicLink';
import { generateQRLoginSession, verifyQRLoginSession, getQRLoginStatus } from '../utils/qrLogin';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
import { AuditService } from '../services/audit.service';
import { logger } from '../config/logger';
import { redisClient } from '../config/redis';
import crypto from 'crypto';

class AuthController {
  // Register new user
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = new User({
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'user',
        status: 'active',
      });

      await user.save();

      // Generate tokens
      const sessionId = crypto.randomBytes(16).toString('hex');
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
      });

      // Store session
      await redisClient.setex(
        `session:${sessionId}`,
        7 * 24 * 60 * 60,
        JSON.stringify({ userId: user._id, createdAt: Date.now() })
      );

      // Audit log
      await AuditService.log({
        userId: user._id,
        eventType: 'user.register',
        eventCategory: 'auth',
        severity: 'info',
        action: 'register',
        resource: 'user',
        resourceId: user._id.toString(),
        outcome: 'success',
        contextData: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  // Login with password
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        await AuditService.log({
          userId: user._id,
          eventType: 'auth.login.failed',
          eventCategory: 'auth',
          severity: 'warning',
          action: 'login',
          resource: 'user',
          outcome: 'failure',
          contextData: {
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
          },
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate session
      const sessionId = crypto.randomBytes(16).toString('hex');
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
      });

      // Store session
      await redisClient.setex(
        `session:${sessionId}`,
        7 * 24 * 60 * 60,
        JSON.stringify({ userId: user._id, createdAt: Date.now() })
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Audit log
      await AuditService.log({
        userId: user._id,
        sessionId,
        eventType: 'auth.login.success',
        eventCategory: 'auth',
        severity: 'info',
        action: 'login',
        resource: 'user',
        outcome: 'success',
        contextData: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
        securityContext: {
          authMethod: 'password',
        },
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens,
        mfaRequired: user.totpEnabled,
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const sessionId = (req as any).sessionId;

      // Revoke token
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await revokeToken(token);
      }

      // Delete session
      if (sessionId) {
        await redisClient.del(`session:${sessionId}`);
      }

      await AuditService.log({
        userId: user._id,
        sessionId,
        eventType: 'auth.logout',
        eventCategory: 'auth',
        severity: 'info',
        action: 'logout',
        resource: 'user',
        outcome: 'success',
        contextData: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      const payload = verifyRefreshToken(refreshToken);
      
      // Check if session still exists
      const session = await redisClient.get(`session:${payload.sessionId}`);
      if (!session) {
        return res.status(401).json({ error: 'Session expired' });
      }

      // Generate new tokens
      const newTokens = generateTokenPair(payload);

      res.json({ tokens: newTokens });
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  // TOTP Setup
  async totpSetup(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const totpSetup = await generateTOTPSecret(user.email);

      // Store secret temporarily (not yet enabled)
      await redisClient.setex(
        `totp:setup:${user._id}`,
        10 * 60,
        JSON.stringify(totpSetup)
      );

      res.json({
        qrCode: totpSetup.qrCode,
        secret: totpSetup.secret,
        backupCodes: totpSetup.backupCodes,
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify TOTP setup
  async totpVerifySetup(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { token } = req.body;

      const setupData = await redisClient.get(`totp:setup:${user._id}`);
      if (!setupData) {
        return res.status(400).json({ error: 'Setup expired, please start again' });
      }

      const { secret, backupCodes } = JSON.parse(setupData);

      if (!verifyTOTP(token, secret)) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      // Enable TOTP
      const dbUser = await User.findById(user._id);
      if (dbUser) {
        dbUser.totpSecret = secret;
        dbUser.totpEnabled = true;
        dbUser.backupCodes = backupCodes.map((code: string) => ({
          code: crypto.createHash('sha256').update(code).digest('hex'),
          used: false,
        }));
        await dbUser.save();
      }

      // Delete setup data
      await redisClient.del(`totp:setup:${user._id}`);

      await AuditService.log({
        userId: user._id,
        eventType: 'auth.totp.enabled',
        eventCategory: 'auth',
        severity: 'info',
        action: 'enable-totp',
        resource: 'user',
        outcome: 'success',
        contextData: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      });

      res.json({ message: 'TOTP enabled successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Verify TOTP during login
  async totpVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, token } = req.body;

      const user = await User.findOne({ email });
      if (!user || !user.totpEnabled) {
        return res.status(400).json({ error: 'TOTP not enabled' });
      }

      if (!verifyTOTP(token, user.totpSecret)) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.json({ message: 'TOTP verified', mfaVerified: true });
    } catch (error) {
      next(error);
    }
  }

  // Disable TOTP
  async totpDisable(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dbUser = await User.findById(user._id);
      if (dbUser) {
        dbUser.totpEnabled = false;
        dbUser.totpSecret = '';
        dbUser.backupCodes = [];
        await dbUser.save();
      }

      await AuditService.log({
        userId: user._id,
        eventType: 'auth.totp.disabled',
        eventCategory: 'auth',
        severity: 'warning',
        action: 'disable-totp',
        resource: 'user',
        outcome: 'success',
        contextData: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      });

      res.json({ message: 'TOTP disabled' });
    } catch (error) {
      next(error);
    }
  }

  // Generate backup codes
  async generateBackupCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const codes = generateBackupCodes(8);
      const hashedCodes = codes.map((code) => ({
        code: crypto.createHash('sha256').update(code).digest('hex'),
        used: false,
      }));

      const dbUser = await User.findById(user._id);
      if (dbUser) {
        dbUser.backupCodes = hashedCodes;
        await dbUser.save();
      }

      res.json({ backupCodes: codes });
    } catch (error) {
      next(error);
    }
  }

  // Verify backup code
  async verifyBackupCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      const backupCode = user.backupCodes.find(
        (bc) => bc.code === hashedCode && !bc.used
      );

      if (!backupCode) {
        return res.status(401).json({ error: 'Invalid or used backup code' });
      }

      // Mark as used
      backupCode.used = true;
      backupCode.usedAt = new Date();
      await user.save();

      res.json({ message: 'Backup code verified', mfaVerified: true });
    } catch (error) {
      next(error);
    }
  }

  // Get backup codes
  async getBackupCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dbUser = await User.findById(user._id);
      const unusedCount = dbUser?.backupCodes.filter((bc) => !bc.used).length || 0;

      res.json({
        totalCodes: dbUser?.backupCodes.length || 0,
        unusedCodes: unusedCount,
      });
    } catch (error) {
      next(error);
    }
  }

  // Request magic link
  async requestMagicLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: 'If account exists, magic link sent' });
      }

      const magicLink = await generateMagicLink(user._id.toString(), email);

      // In production, send email with link
      logger.info(`Magic link for ${email}: /auth/magic-link/verify/${magicLink.token}`);

      res.json({ message: 'Magic link sent to email' });
    } catch (error) {
      next(error);
    }
  }

  // Verify magic link
  async verifyMagicLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      const linkData = await verifyMagicLink(token);
      if (!linkData) {
        return res.status(400).json({ error: 'Invalid or expired magic link' });
      }

      const user = await User.findById(linkData.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate session
      const sessionId = crypto.randomBytes(16).toString('hex');
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
      });

      await redisClient.setex(
        `session:${sessionId}`,
        7 * 24 * 60 * 60,
        JSON.stringify({ userId: user._id, createdAt: Date.now() })
      );

      res.json({ message: 'Authenticated via magic link', tokens });
    } catch (error) {
      next(error);
    }
  }

  // Passkey, QR, OAuth, sessions, devices methods
  // ... (continuing in next chunk)

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      
      // Always return success to prevent user enumeration
      if (!user) {
        return res.json({ message: 'Password reset email sent if account exists' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      await redisClient.setex(`reset:${resetToken}`, 60 * 60, user._id.toString());

      logger.info(`Password reset token for ${email}: ${resetToken}`);

      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;

      const userId = await redisClient.get(`reset:${token}`);
      if (!userId) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await User.findByIdAndUpdate(userId, { passwordHash });
      await redisClient.del(`reset:${token}`);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      dbUser.passwordHash = await bcrypt.hash(newPassword, 12);
      await dbUser.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Placeholder methods for remaining auth features
  async passkeyRegisterOptions(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Passkey registration not yet implemented' });
  }

  async passkeyRegisterVerify(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Passkey verification not yet implemented' });
  }

  async passkeyLoginOptions(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Passkey login not yet implemented' });
  }

  async passkeyLoginVerify(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Passkey login not yet implemented' });
  }

  async deletePasskey(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Delete passkey not yet implemented' });
  }

  async generateQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const qrSession = await generateQRLoginSession(user._id);
      res.json(qrSession);
    } catch (error) {
      next(error);
    }
  }

  async verifyQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, userId } = req.body;
      const verified = await verifyQRLoginSession(sessionId, userId);
      res.json({ verified });
    } catch (error) {
      next(error);
    }
  }

  async getQRStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const status = await getQRLoginStatus(sessionId);
      res.json(status || { status: 'expired' });
    } catch (error) {
      next(error);
    }
  }

  async oauthInitiate(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'OAuth not yet implemented' });
  }

  async oauthCallback(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'OAuth callback not yet implemented' });
  }

  async unlinkOAuth(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Unlink OAuth not yet implemented' });
  }

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      // Get all sessions for user from Redis
      const keys = await redisClient.keys(`session:*`);
      const sessions = [];
      
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const session = JSON.parse(data);
          if (session.userId === user._id.toString()) {
            sessions.push({
              sessionId: key.replace('session:', ''),
              createdAt: session.createdAt,
            });
          }
        }
      }

      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      await redisClient.del(`session:${sessionId}`);
      res.json({ message: 'Session revoked' });
    } catch (error) {
      next(error);
    }
  }

  async revokeAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const keys = await redisClient.keys(`session:*`);
      
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const session = JSON.parse(data);
          if (session.userId === user._id.toString()) {
            await redisClient.del(key);
          }
        }
      }

      res.json({ message: 'All sessions revoked' });
    } catch (error) {
      next(error);
    }
  }

  async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const dbUser = await User.findById(user._id);
      res.json({ devices: dbUser?.trustedDevices || [] });
    } catch (error) {
      next(error);
    }
  }

  async trustDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const deviceInfo = generateDeviceFingerprint(req);

      const dbUser = await User.findById(user._id);
      if (dbUser) {
        dbUser.trustedDevices.push({
          fingerprint: deviceInfo.fingerprint,
          name: `${deviceInfo.os} - ${deviceInfo.browser}`,
          type: deviceInfo.type,
          userAgent: deviceInfo.userAgent,
          lastUsedIp: req.ip || 'unknown',
          lastUsedAt: new Date(),
        });
        await dbUser.save();
      }

      res.json({ message: 'Device trusted' });
    } catch (error) {
      next(error);
    }
  }

  async removeDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { deviceId } = req.params;

      const dbUser = await User.findById(user._id);
      if (dbUser) {
        dbUser.trustedDevices = dbUser.trustedDevices.filter(
          (d) => d._id?.toString() !== deviceId
        );
        await dbUser.save();
      }

      res.json({ message: 'Device removed' });
    } catch (error) {
      next(error);
    }
  }

  async checkStepUpRequired(req: Request, res: Response, next: NextFunction) {
    res.json({ stepUpRequired: false });
  }

  async initiateStepUp(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Step-up not yet implemented' });
  }

  async verifyStepUp(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Step-up verification not yet implemented' });
  }
}

export const authController = new AuthController();
