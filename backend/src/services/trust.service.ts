import { ContextData } from '../utils/contextExtractor';
import { BehavioralData, BehavioralService } from './behavioral.service';
import { IBehavioralProfile } from '../models/User';

export interface TrustFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

export interface TrustEvaluation {
  trustScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: TrustFactor[];
  behavioralScore: number;
  decision: 'allow' | 'deny' | 'step-up' | 'approval-required';
  explanation: string;
  confidenceScore: number;
}

export class TrustService {
  // Base weights for trust factors (can be configured per action/policy)
  private static DEFAULT_WEIGHTS = {
    deviceTrust: 0.15,
    locationConsistency: 0.10,
    networkSafety: 0.10,
    timeConsistency: 0.05,
    behavioralMatch: 0.30,
    authStrength: 0.15,
    sessionValidity: 0.10,
    historicalTrust: 0.05,
  };

  static evaluateTrust(
    contextData: ContextData,
    behavioralData: BehavioralData,
    behavioralProfile: IBehavioralProfile,
    authMethods: string[],
    historicalTrustScore: number = 75,
    actionRisk: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): TrustEvaluation {
    const factors: TrustFactor[] = [];

    // 1. Device Trust Factor
    const deviceTrust = contextData.device.trusted ? 100 : 30;
    factors.push({
      name: 'Device Trust',
      weight: this.DEFAULT_WEIGHTS.deviceTrust,
      value: deviceTrust,
      contribution: deviceTrust * this.DEFAULT_WEIGHTS.deviceTrust,
    });

    // 2. Location Consistency
    const locationScore = this.evaluateLocation(contextData);
    factors.push({
      name: 'Location Consistency',
      weight: this.DEFAULT_WEIGHTS.locationConsistency,
      value: locationScore,
      contribution: locationScore * this.DEFAULT_WEIGHTS.locationConsistency,
    });

    // 3. Network Safety
    const networkScore = this.evaluateNetwork(contextData);
    factors.push({
      name: 'Network Safety',
      weight: this.DEFAULT_WEIGHTS.networkSafety,
      value: networkScore,
      contribution: networkScore * this.DEFAULT_WEIGHTS.networkSafety,
    });

    // 4. Time Consistency
    const timeScore = this.evaluateTimingPattern(contextData);
    factors.push({
      name: 'Time Consistency',
      weight: this.DEFAULT_WEIGHTS.timeConsistency,
      value: timeScore,
      contribution: timeScore * this.DEFAULT_WEIGHTS.timeConsistency,
    });

    // 5. Behavioral Match
    const behavioralAnalysis = BehavioralService.analyzeBehavior(
      behavioralData,
      behavioralProfile
    );
    const behavioralScore = behavioralAnalysis.similarityScore * 100;
    factors.push({
      name: 'Behavioral Match',
      weight: this.DEFAULT_WEIGHTS.behavioralMatch,
      value: behavioralScore,
      contribution: behavioralScore * this.DEFAULT_WEIGHTS.behavioralMatch,
    });

    // 6. Auth Strength
    const authScore = this.evaluateAuthStrength(authMethods);
    factors.push({
      name: 'Authentication Strength',
      weight: this.DEFAULT_WEIGHTS.authStrength,
      value: authScore,
      contribution: authScore * this.DEFAULT_WEIGHTS.authStrength,
    });

    // 7. Session Validity (placeholder - would check session age, activity)
    const sessionScore = 85;
    factors.push({
      name: 'Session Validity',
      weight: this.DEFAULT_WEIGHTS.sessionValidity,
      value: sessionScore,
      contribution: sessionScore * this.DEFAULT_WEIGHTS.sessionValidity,
    });

    // 8. Historical Trust
    factors.push({
      name: 'Historical Trust',
      weight: this.DEFAULT_WEIGHTS.historicalTrust,
      value: historicalTrustScore,
      contribution: historicalTrustScore * this.DEFAULT_WEIGHTS.historicalTrust,
    });

    // Calculate overall trust score
    const trustScore = Math.round(
      factors.reduce((sum, factor) => sum + factor.contribution, 0)
    );

    // Determine risk level
    const riskLevel = this.determineRiskLevel(trustScore, actionRisk);

    // Make decision based on trust score and action risk
    const decision = this.makeDecision(trustScore, riskLevel, actionRisk);

    // Generate explanation
    const explanation = this.generateExplanation(trustScore, factors, riskLevel, decision);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidence(factors, behavioralAnalysis);

    return {
      trustScore,
      riskLevel,
      factors,
      behavioralScore,
      decision,
      explanation,
      confidenceScore,
    };
  }

  private static evaluateLocation(contextData: ContextData): number {
    let score = 100;

    // Penalize impossible travel
    if (contextData.environmental.velocity > 800) {
      // > 800 km/h suggests impossible travel
      score -= 50;
    } else if (contextData.environmental.velocity > 150) {
      // Unusual but possible (e.g., flight)
      score -= 20;
    }

    // Penalize very large distance from last location
    if (contextData.environmental.distanceFromLast > 5000) {
      score -= 30;
    }

    return Math.max(0, score);
  }

  private static evaluateNetwork(contextData: ContextData): number {
    let score = 100;

    if (contextData.network.vpnDetected) {
      score -= 30;
    }

    if (contextData.network.torDetected) {
      score -= 50;
    }

    // Penalize unusual countries (would compare against user's typical countries)
    // Placeholder logic
    if (contextData.network.country === 'unknown') {
      score -= 20;
    }

    return Math.max(0, score);
  }

  private static evaluateTimingPattern(contextData: ContextData): number {
    let score = 100;

    // Penalize unusual timing
    if (!contextData.timing.isWorkingHours) {
      score -= 15;
    }

    // Weekend access
    if (['Saturday', 'Sunday'].includes(contextData.timing.dayOfWeek)) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private static evaluateAuthStrength(authMethods: string[]): number {
    let score = 50; // Base score for being authenticated

    if (authMethods.includes('passkey')) {
      score += 30;
    } else if (authMethods.includes('totp')) {
      score += 25;
    } else if (authMethods.includes('sms')) {
      score += 15;
    }

    if (authMethods.includes('password') && authMethods.length === 1) {
      score = 50; // Password only
    }

    if (authMethods.length >= 2) {
      score += 20; // MFA bonus
    }

    return Math.min(100, score);
  }

  private static determineRiskLevel(
    trustScore: number,
    actionRisk: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Adjust risk based on both trust score and action risk
    if (trustScore >= 80 && actionRisk === 'low') return 'low';
    if (trustScore >= 70 && actionRisk !== 'critical') return 'low';
    if (trustScore >= 60) return 'medium';
    if (trustScore >= 40) return 'high';
    return 'critical';
  }

  private static makeDecision(
    trustScore: number,
    riskLevel: string,
    actionRisk: string
  ): 'allow' | 'deny' | 'step-up' | 'approval-required' {
    // Critical actions require high trust
    if (actionRisk === 'critical') {
      if (trustScore >= 85) return 'allow';
      if (trustScore >= 60) return 'approval-required';
      return 'deny';
    }

    // High risk actions
    if (actionRisk === 'high') {
      if (trustScore >= 75) return 'allow';
      if (trustScore >= 50) return 'step-up';
      return 'deny';
    }

    // Medium risk actions
    if (actionRisk === 'medium') {
      if (trustScore >= 65) return 'allow';
      if (trustScore >= 45) return 'step-up';
      return 'deny';
    }

    // Low risk actions
    if (trustScore >= 50) return 'allow';
    if (trustScore >= 30) return 'step-up';
    return 'deny';
  }

  private static generateExplanation(
    trustScore: number,
    factors: TrustFactor[],
    riskLevel: string,
    decision: string
  ): string {
    const topFactors = [...factors]
      .sort((a, b) => a.value - b.value)
      .slice(0, 3);

    let explanation = `Trust score: ${trustScore}/100 (${riskLevel} risk). `;

    if (decision === 'allow') {
      explanation += 'Access granted. ';
    } else if (decision === 'step-up') {
      explanation += 'Additional authentication required. ';
    } else if (decision === 'approval-required') {
      explanation += 'Manager approval required. ';
    } else {
      explanation += 'Access denied. ';
    }

    if (topFactors.length > 0) {
      explanation += 'Key concerns: ';
      explanation += topFactors.map((f) => `${f.name} (${Math.round(f.value)}%)`).join(', ');
      explanation += '.';
    }

    return explanation;
  }

  private static calculateConfidence(factors: TrustFactor[], behavioralAnalysis: any): number {
    // Confidence based on behavioral sample size and factor consistency
    const factorValues = factors.map((f) => f.value);
    const variance =
      factorValues.reduce((sum, v) => {
        const mean = factorValues.reduce((s, val) => s + val, 0) / factorValues.length;
        return sum + Math.pow(v - mean, 2);
      }, 0) / factorValues.length;

    const consistencyScore = Math.max(0, 100 - variance / 10);
    const behavioralConfidence = behavioralAnalysis.similarityScore * 100;

    return Math.round((consistencyScore + behavioralConfidence) / 2);
  }
}
