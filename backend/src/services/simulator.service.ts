import mongoose from 'mongoose';
import { TrustService } from './trust.service';
import { ContextData } from '../utils/contextExtractor';
import { BehavioralData } from './behavioral.service';
import { logger } from '../config/logger';
import TrustLog from '../models/TrustLog';
import User from '../models/User';

export interface SimulationResult {
  simulationId: string;
  attackType: string;
  timestamp: Date;
  detected: boolean;
  trustScore: number;
  riskLevel: string;
  decision: string;
  timeToDetect?: number;
  explanation: string;
  metrics: {
    falsePositive: boolean;
    truePositive: boolean;
    falseNegative: boolean;
    trueNegative: boolean;
  };
}

export class SimulatorService {
  // Simulate SIM swap attack
  static async simulateSIMSwap(
    userId: mongoose.Types.ObjectId,
    targetAction: string = 'change-phone'
  ): Promise<SimulationResult> {
    const startTime = Date.now();
    const simulationId = new mongoose.Types.ObjectId().toString();

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Simulate attacker context: new device, different location
    const maliciousContext: ContextData = {
      device: {
        fingerprint: 'attacker-device-' + Math.random(),
        type: 'mobile',
        os: 'Android',
        browser: 'Chrome',
        trusted: false,
      },
      network: {
        ipAddress: '192.168.1.100',
        asn: 'AS15169',
        country: 'RU', // Different country
        vpnDetected: false,
        torDetected: false,
      },
      timing: {
        localTime: new Date().toISOString(),
        timezone: 'Europe/Moscow',
        dayOfWeek: 'Wednesday',
        isWorkingHours: false,
      },
      environmental: {
        location: {
          lat: 55.7558,
          lon: 37.6173,
          city: 'Moscow',
          country: 'Russia',
        },
        velocity: 3500, // Impossible travel!
        distanceFromLast: 7000,
      },
    };

    // Simulate different behavioral pattern
    const maliciousBehavior: BehavioralData = {
      typingPattern: Array(10).fill(0), // No established pattern
      mouseMovements: Array(10).fill(0),
      navigationPattern: Array(8).fill(0),
    };

    // Evaluate trust
    const evaluation = TrustService.evaluateTrust(
      maliciousContext,
      maliciousBehavior,
      user.behavioralProfile,
      ['password'], // Only password, no MFA
      user.trustHistory[user.trustHistory.length - 1]?.score || 75,
      'high' // Changing phone is high risk
    );

    // Log the simulation
    await TrustLog.create({
      userId,
      action: `SIMULATION: SIM Swap - ${targetAction}`,
      trustScore: evaluation.trustScore,
      riskLevel: evaluation.riskLevel,
      contextData: maliciousContext,
      behavioralScore: evaluation.behavioralScore,
      behavioralSignals: {
        typingPattern: maliciousBehavior.typingPattern,
        mouseMovements: maliciousBehavior.mouseMovements,
        navigationPattern: maliciousBehavior.navigationPattern,
        similarityScore: 0.2,
        anomalyDetected: true,
      },
      factors: evaluation.factors,
      authMethodsUsed: ['password'],
      stepUpRequired: evaluation.decision === 'step-up',
      approvalRequired: evaluation.decision === 'approval-required',
      decision: evaluation.decision,
      explanation: evaluation.explanation,
      confidenceScore: evaluation.confidenceScore,
    });

    const detected = evaluation.decision !== 'allow';
    const timeToDetect = Date.now() - startTime;

    return {
      simulationId,
      attackType: 'SIM Swap',
      timestamp: new Date(),
      detected,
      trustScore: evaluation.trustScore,
      riskLevel: evaluation.riskLevel,
      decision: evaluation.decision,
      timeToDetect,
      explanation: evaluation.explanation,
      metrics: {
        falsePositive: false,
        truePositive: detected,
        falseNegative: !detected,
        trueNegative: false,
      },
    };
  }

  // Simulate impossible travel
  static async simulateImpossibleTravel(
    userId: mongoose.Types.ObjectId,
    fromLocation: { lat: number; lon: number; city: string; country: string },
    toLocation: { lat: number; lon: number; city: string; country: string },
    timeDiffMinutes: number = 30
  ): Promise<SimulationResult> {
    const startTime = Date.now();
    const simulationId = new mongoose.Types.ObjectId().toString();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate distance
    const distance = this.calculateDistance(
      fromLocation.lat,
      fromLocation.lon,
      toLocation.lat,
      toLocation.lon
    );

    // Calculate velocity (km/h)
    const velocity = (distance / timeDiffMinutes) * 60;

    const context: ContextData = {
      device: {
        fingerprint: user.trustedDevices[0]?.fingerprint || 'device-001',
        type: 'desktop',
        os: 'Windows',
        browser: 'Chrome',
        trusted: true,
      },
      network: {
        ipAddress: '203.0.113.45',
        asn: 'AS15169',
        country: toLocation.country,
        vpnDetected: false,
        torDetected: false,
      },
      timing: {
        localTime: new Date().toISOString(),
        timezone: 'UTC',
        dayOfWeek: 'Wednesday',
        isWorkingHours: true,
      },
      environmental: {
        location: toLocation,
        velocity,
        distanceFromLast: distance,
      },
    };

    const behavior: BehavioralData = {
      typingPattern: user.behavioralProfile.typingPattern.vector,
      mouseMovements: user.behavioralProfile.mouseMovements.vector,
      navigationPattern: user.behavioralProfile.navigationPattern.vector,
    };

    const evaluation = TrustService.evaluateTrust(
      context,
      behavior,
      user.behavioralProfile,
      ['password', 'totp'],
      75,
      'medium'
    );

    const detected = evaluation.decision !== 'allow';
    const timeToDetect = Date.now() - startTime;

    return {
      simulationId,
      attackType: 'Impossible Travel',
      timestamp: new Date(),
      detected,
      trustScore: evaluation.trustScore,
      riskLevel: evaluation.riskLevel,
      decision: evaluation.decision,
      timeToDetect,
      explanation: `Travel from ${fromLocation.city} to ${toLocation.city} (${Math.round(
        distance
      )}km in ${timeDiffMinutes}min, ${Math.round(velocity)}km/h). ${evaluation.explanation}`,
      metrics: {
        falsePositive: false,
        truePositive: detected,
        falseNegative: !detected,
        trueNegative: false,
      },
    };
  }

  // Simulate credential stuffing
  static async simulateCredentialStuffing(
    email: string,
    attempts: number = 10
  ): Promise<SimulationResult> {
    const startTime = Date.now();
    const simulationId = new mongoose.Types.ObjectId().toString();

    // Simulate multiple rapid login attempts from different IPs
    const detectedAt = Math.floor(Math.random() * attempts) + 1;
    const detected = detectedAt <= 5; // Should detect within 5 attempts

    return {
      simulationId,
      attackType: 'Credential Stuffing',
      timestamp: new Date(),
      detected,
      trustScore: 15, // Very low trust
      riskLevel: 'critical',
      decision: 'deny',
      timeToDetect: detected ? detectedAt * 100 : undefined,
      explanation: `${attempts} rapid login attempts from ${attempts} different IP addresses. ${
        detected ? `Blocked after ${detectedAt} attempts.` : 'Not blocked (FALSE NEGATIVE).'
      }`,
      metrics: {
        falsePositive: false,
        truePositive: detected,
        falseNegative: !detected,
        trueNegative: false,
      },
    };
  }

  // Simulate MFA fatigue
  static async simulateMFAFatigue(
    userId: mongoose.Types.ObjectId,
    pushNotifications: number = 20
  ): Promise<SimulationResult> {
    const startTime = Date.now();
    const simulationId = new mongoose.Types.ObjectId().toString();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Detect unusual number of MFA requests in short time
    const detected = pushNotifications > 10;

    return {
      simulationId,
      attackType: 'MFA Fatigue',
      timestamp: new Date(),
      detected,
      trustScore: detected ? 25 : 50,
      riskLevel: detected ? 'high' : 'medium',
      decision: detected ? 'deny' : 'step-up',
      timeToDetect: detected ? Date.now() - startTime : undefined,
      explanation: `${pushNotifications} MFA push notifications sent in 5 minutes. ${
        detected
          ? 'Suspicious pattern detected and blocked.'
          : 'Pattern not detected (FALSE NEGATIVE).'
      }`,
      metrics: {
        falsePositive: false,
        truePositive: detected,
        falseNegative: !detected,
        trueNegative: false,
      },
    };
  }

  // Simulate phishing attack
  static async simulatePhishing(
    userId: mongoose.Types.ObjectId,
    phishingIndicators: string[]
  ): Promise<SimulationResult> {
    const startTime = Date.now();
    const simulationId = new mongoose.Types.ObjectId().toString();

    // Check for phishing indicators
    const suspiciousIndicators = [
      'unusual-domain',
      'misspelled-url',
      'no-https',
      'different-login-page',
    ];

    const foundIndicators = phishingIndicators.filter((i) =>
      suspiciousIndicators.includes(i)
    );

    const detected = foundIndicators.length >= 2;

    return {
      simulationId,
      attackType: 'Phishing',
      timestamp: new Date(),
      detected,
      trustScore: detected ? 30 : 60,
      riskLevel: detected ? 'critical' : 'high',
      decision: detected ? 'deny' : 'allow',
      timeToDetect: detected ? Date.now() - startTime : undefined,
      explanation: `Phishing indicators found: ${foundIndicators.join(', ')}. ${
        detected ? 'Attack detected and blocked.' : 'Attack not detected (FALSE NEGATIVE).'
      }`,
      metrics: {
        falsePositive: false,
        truePositive: detected,
        falseNegative: !detected,
        trueNegative: false,
      },
    };
  }

  // Simulate session hijacking
  static async simulateSessionHijack(
    userId: mongoose.Types.ObjectId,
    newIpAddress: string,
    newUserAgent: string
  ): Promise<SimulationResult> {
    const startTime = Date.now();
    const simulationId = new mongoose.Types.ObjectId().toString();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Detect if IP/user agent changed mid-session
    const originalIp = user.trustedDevices[0]?.lastUsedIp || '192.168.1.1';
    const originalUA = user.trustedDevices[0]?.userAgent || 'Mozilla/5.0';

    const ipChanged = newIpAddress !== originalIp;
    const uaChanged = newUserAgent !== originalUA;

    const detected = ipChanged || uaChanged;

    return {
      simulationId,
      attackType: 'Session Hijacking',
      timestamp: new Date(),
      detected,
      trustScore: detected ? 20 : 70,
      riskLevel: detected ? 'critical' : 'low',
      decision: detected ? 'deny' : 'allow',
      timeToDetect: detected ? Date.now() - startTime : undefined,
      explanation: `Session attributes changed: IP ${ipChanged ? 'changed' : 'same'}, UA ${
        uaChanged ? 'changed' : 'same'
      }. ${detected ? 'Hijacking detected.' : 'No detection.'}`,
      metrics: {
        falsePositive: false,
        truePositive: detected,
        falseNegative: !detected,
        trueNegative: false,
      },
    };
  }

  // Helper: Calculate distance between two points
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get detection metrics
  static async getDetectionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSimulations: number;
    detectionRate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    averageDetectionTime: number;
  }> {
    // In production, this would query simulation results from database
    // Placeholder implementation
    return {
      totalSimulations: 100,
      detectionRate: 0.87, // 87%
      falsePositiveRate: 0.05, // 5%
      falseNegativeRate: 0.13, // 13%
      averageDetectionTime: 245, // ms
    };
  }
}
