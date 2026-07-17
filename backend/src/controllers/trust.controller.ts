import { Request, Response, NextFunction } from 'express';
import { TrustService } from '../services/trust.service';
import { BehavioralService, BehavioralData } from '../services/behavioral.service';
import { extractContext, calculateDistance, calculateVelocity } from '../utils/contextExtractor';
import User from '../models/User';
import TrustLog from '../models/TrustLog';
import { AuditService } from '../services/audit.service';
import mongoose from 'mongoose';

class TrustController {
  // Evaluate trust for an action
  async evaluateTrust(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { action, behavioralData, actionRisk } = req.body;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Extract context
      const context = extractContext(
        req,
        dbUser.trustedDevices.map((d) => d.fingerprint)
      );

      // Calculate velocity from last location
      if (dbUser.trustHistory.length > 0) {
        const lastEntry = dbUser.trustHistory[dbUser.trustHistory.length - 1];
        if (lastEntry.location) {
          const distance = calculateDistance(
            lastEntry.location.lat,
            lastEntry.location.lon,
            context.environmental.location.lat,
            context.environmental.location.lon
          );
          const timeDiff = (Date.now() - new Date(lastEntry.timestamp).getTime()) / 1000;
          context.environmental.distanceFromLast = distance;
          context.environmental.velocity = calculateVelocity(distance, timeDiff);
        }
      }

      // Prepare behavioral data
      const behavioral: BehavioralData = {
        typingPattern: BehavioralService.vectorizeTypingPattern(
          behavioralData?.keystrokes || []
        ),
        mouseMovements: BehavioralService.vectorizeMouseMovements(
          behavioralData?.mouseMovements || []
        ),
        navigationPattern: BehavioralService.vectorizeNavigationPattern(
          behavioralData?.pages || []
        ),
      };

      // Get auth methods from request
      const authMethods = ['password']; // Would be tracked from actual auth flow

      // Evaluate trust
      const evaluation = TrustService.evaluateTrust(
        context,
        behavioral,
        dbUser.behavioralProfile,
        authMethods,
        dbUser.trustHistory[dbUser.trustHistory.length - 1]?.score || 75,
        actionRisk || 'medium'
      );

      // Create trust log
      const trustLog = await TrustLog.create({
        userId: user._id,
        action,
        trustScore: evaluation.trustScore,
        riskLevel: evaluation.riskLevel,
        contextData: context,
        behavioralScore: evaluation.behavioralScore,
        behavioralSignals: {
          typingPattern: behavioral.typingPattern,
          mouseMovements: behavioral.mouseMovements,
          navigationPattern: behavioral.navigationPattern,
          similarityScore: evaluation.behavioralScore / 100,
          anomalyDetected: evaluation.behavioralScore < 70,
        },
        factors: evaluation.factors,
        authMethodsUsed: authMethods,
        stepUpRequired: evaluation.decision === 'step-up',
        approvalRequired: evaluation.decision === 'approval-required',
        decision: evaluation.decision,
        explanation: evaluation.explanation,
        confidenceScore: evaluation.confidenceScore,
      });

      // Update user trust history
      dbUser.trustHistory.push({
        timestamp: new Date(),
        score: evaluation.trustScore,
        action,
        location: context.environmental.location,
      });

      // Keep last 100 entries
      if (dbUser.trustHistory.length > 100) {
        dbUser.trustHistory = dbUser.trustHistory.slice(-100);
      }

      await dbUser.save();

      // Audit log
      await AuditService.log({
        userId: user._id,
        eventType: 'trust.evaluate',
        eventCategory: 'trust',
        severity: evaluation.riskLevel === 'critical' ? 'critical' : 'info',
        action,
        resource: 'trust-score',
        resourceId: trustLog._id.toString(),
        outcome: evaluation.decision === 'allow' ? 'success' : 'pending',
        metadata: { trustScore: evaluation.trustScore, decision: evaluation.decision },
        contextData: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
        securityContext: {
          trustScore: evaluation.trustScore,
          riskLevel: evaluation.riskLevel,
        },
      });

      res.json({
        trustScore: evaluation.trustScore,
        riskLevel: evaluation.riskLevel,
        decision: evaluation.decision,
        explanation: evaluation.explanation,
        confidenceScore: evaluation.confidenceScore,
        factors: evaluation.factors,
        logId: trustLog._id,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current trust score
  async getCurrentScore(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const latestScore =
        dbUser.trustHistory[dbUser.trustHistory.length - 1]?.score || 75;

      res.json({
        currentScore: latestScore,
        lastUpdated:
          dbUser.trustHistory[dbUser.trustHistory.length - 1]?.timestamp || new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Get trust history
  async getTrustHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { limit = 50, skip = 0 } = req.query;

      const logs = await TrustLog.find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(Number(limit))
        .skip(Number(skip));

      const total = await TrustLog.countDocuments({ userId: user._id });

      res.json({ logs, total });
    } catch (error) {
      next(error);
    }
  }

  // Get trust log details
  async getTrustLogDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { logId } = req.params;

      const log = await TrustLog.findById(logId);
      if (!log) {
        return res.status(404).json({ error: 'Trust log not found' });
      }

      res.json({ log });
    } catch (error) {
      next(error);
    }
  }

  // Capture context data
  async captureContext(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const context = extractContext(
        req,
        dbUser.trustedDevices.map((d) => d.fingerprint)
      );

      res.json({ context });
    } catch (error) {
      next(error);
    }
  }

  // Get current context
  async getCurrentContext(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dbUser = await User.findById(user._id);
      const context = extractContext(
        req,
        dbUser?.trustedDevices.map((d) => d.fingerprint) || []
      );

      res.json({ context });
    } catch (error) {
      next(error);
    }
  }

  // Capture behavioral data
  async captureBehavioralData(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { keystrokes, mouseMovements, pages } = req.body;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Vectorize behavioral data
      const typingVector = BehavioralService.vectorizeTypingPattern(keystrokes || []);
      const mouseVector = BehavioralService.vectorizeMouseMovements(mouseMovements || []);
      const navVector = BehavioralService.vectorizeNavigationPattern(pages || []);

      // Update profile
      dbUser.behavioralProfile.typingPattern.vector = typingVector;
      dbUser.behavioralProfile.typingPattern.lastUpdated = new Date();
      dbUser.behavioralProfile.typingPattern.sampleCount += 1;

      dbUser.behavioralProfile.mouseMovements.vector = mouseVector;
      dbUser.behavioralProfile.mouseMovements.lastUpdated = new Date();
      dbUser.behavioralProfile.mouseMovements.sampleCount += 1;

      dbUser.behavioralProfile.navigationPattern.vector = navVector;
      dbUser.behavioralProfile.navigationPattern.lastUpdated = new Date();
      dbUser.behavioralProfile.navigationPattern.sampleCount += 1;

      await dbUser.save();

      res.json({ message: 'Behavioral data captured successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Get behavioral profile
  async getBehavioralProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ profile: dbUser.behavioralProfile });
    } catch (error) {
      next(error);
    }
  }

  // Analyze behavior
  async analyzeBehavior(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { keystrokes, mouseMovements, pages } = req.body;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const behavioral: BehavioralData = {
        typingPattern: BehavioralService.vectorizeTypingPattern(keystrokes || []),
        mouseMovements: BehavioralService.vectorizeMouseMovements(mouseMovements || []),
        navigationPattern: BehavioralService.vectorizeNavigationPattern(pages || []),
      };

      const analysis = BehavioralService.analyzeBehavior(
        behavioral,
        dbUser.behavioralProfile
      );

      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }

  // Assess risk
  async assessRisk(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { action, actionRisk } = req.body;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const context = extractContext(
        req,
        dbUser.trustedDevices.map((d) => d.fingerprint)
      );

      // Simple risk indicators
      const indicators = {
        newDevice: !context.device.trusted,
        vpnDetected: context.network.vpnDetected,
        torDetected: context.network.torDetected,
        impossibleTravel: context.environmental.velocity > 800,
        unusualTime: !context.timing.isWorkingHours,
      };

      const riskScore = Object.values(indicators).filter(Boolean).length * 20;

      res.json({
        riskScore,
        riskLevel:
          riskScore > 60 ? 'critical' : riskScore > 40 ? 'high' : riskScore > 20 ? 'medium' : 'low',
        indicators,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get risk factors
  async getRiskFactors(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const recentLogs = await TrustLog.find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(10);

      const factors = recentLogs.flatMap((log) => log.factors);

      res.json({ factors });
    } catch (error) {
      next(error);
    }
  }

  // Get security alerts
  async getSecurityAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const alerts = dbUser.securityAlerts.filter((alert) => !alert.resolved);

      res.json({ alerts });
    } catch (error) {
      next(error);
    }
  }

  // Get trust trends
  async getTrustTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { days = 7 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const logs = await TrustLog.find({
        userId: user._id,
        timestamp: { $gte: startDate },
      }).sort({ timestamp: 1 });

      const trends = logs.map((log) => ({
        timestamp: log.timestamp,
        trustScore: log.trustScore,
        riskLevel: log.riskLevel,
      }));

      res.json({ trends });
    } catch (error) {
      next(error);
    }
  }

  // Get behavioral patterns
  async getBehavioralPatterns(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dbUser = await User.findById(user._id);
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        patterns: {
          typingConsistency: dbUser.behavioralProfile.typingPattern.sampleCount > 10,
          mouseConsistency: dbUser.behavioralProfile.mouseMovements.sampleCount > 10,
          navigationConsistency: dbUser.behavioralProfile.navigationPattern.sampleCount > 10,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get anomalies
  async getAnomalies(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const anomalies = await TrustLog.find({
        userId: user._id,
        'behavioralSignals.anomalyDetected': true,
      })
        .sort({ timestamp: -1 })
        .limit(20);

      res.json({ anomalies });
    } catch (error) {
      next(error);
    }
  }
}

export const trustController = new TrustController();
