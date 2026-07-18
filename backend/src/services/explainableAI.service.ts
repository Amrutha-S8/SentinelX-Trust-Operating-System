import { ContextData } from '../utils/contextExtractor';
import { TrustFactor } from './trust.service';

export interface ExplanationReason {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  confidence: number; // 0-100
  recommendation: string;
  evidence?: string; // Specific data point that triggered this reason
}

export interface XAIExplanation {
  decision: 'allow' | 'deny' | 'step-up' | 'approval-required';
  trustScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasons: ExplanationReason[];
  summary: string;
  recommendations: string[];
  actionDetails: {
    nextStep: string;
    estimatedWaitTime?: string;
    escalationPath?: string;
  };
}

export class ExplainableAIService {
  /**
   * Generate XAI explanation from trust evaluation components
   */
  static generateExplanation(
    contextData: ContextData,
    trustScore: number,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    decision: 'allow' | 'deny' | 'step-up' | 'approval-required',
    factors: TrustFactor[],
    behavioralScore: number,
    authMethods: string[],
    confidenceScore: number
  ): XAIExplanation {
    const reasons: ExplanationReason[] = [];

    // Analyze each risk signal
    if (contextData.device.trusted === false) {
      reasons.push(this.createDeviceReason(contextData));
    }

    if (contextData.network.torDetected) {
      reasons.push({
        type: 'TOR_DETECTED',
        severity: 'CRITICAL',
        description: 'Connection from Tor network detected. Tor provides anonymity but is flagged for high-risk activities.',
        confidence: 95,
        recommendation: 'Require additional authentication or deny access.',
        evidence: `IP: ${contextData.network.ipAddress}`
      });
    }

    if (contextData.network.vpnDetected) {
      reasons.push({
        type: 'VPN_DETECTED',
        severity: 'HIGH',
        description: 'VPN connection detected. While VPNs can be legitimate, they mask true location.',
        confidence: 80,
        recommendation: 'Request step-up authentication or verify VPN usage.',
        evidence: `ASN: ${contextData.network.asn || 'unknown'}`
      });
    }

    // Location analysis
    if (contextData.environmental.velocity > 800) {
      reasons.push({
        type: 'IMPOSSIBLE_TRAVEL',
        severity: 'CRITICAL',
        description: 'Impossible travel detected. User appears to have moved faster than physically possible.',
        confidence: 98,
        recommendation: 'Block access and require verification.',
        evidence: `Velocity: ${Math.round(contextData.environmental.velocity)} km/h`
      });
    } else if (contextData.environmental.velocity > 150) {
      reasons.push({
        type: 'RAPID_LOCATION_CHANGE',
        severity: 'HIGH',
        description: 'Rapid location change detected. User moved significantly in short time.',
        confidence: 85,
        recommendation: 'Request step-up authentication.',
        evidence: `Velocity: ${Math.round(contextData.environmental.velocity)} km/h (likely flight)`
      });
    }

    if (contextData.environmental.distanceFromLast > 5000) {
      reasons.push({
        type: 'UNUSUAL_LOCATION',
        severity: 'MEDIUM',
        description: 'Very large distance from last known location. Could indicate account compromise or travel.',
        confidence: 75,
        recommendation: 'Require step-up authentication or verify travel.',
        evidence: `Distance: ${Math.round(contextData.environmental.distanceFromLast)} km`
      });
    }

    // Timing analysis
    if (!contextData.timing.isWorkingHours) {
      reasons.push({
        type: 'UNUSUAL_TIME',
        severity: 'LOW',
        description: 'Login attempt outside typical working hours.',
        confidence: 50,
        recommendation: 'Monitor for behavioral anomalies.',
        evidence: `Time: ${contextData.timing.localTime}`
      });
    }

    // Behavioral analysis
    if (behavioralScore < 50) {
      reasons.push({
        type: 'BEHAVIORAL_ANOMALY',
        severity: 'HIGH',
        description: 'Behavior significantly differs from baseline. User patterns are atypical.',
        confidence: 85,
        recommendation: 'Request step-up authentication and consider behavioral re-enrollment.',
        evidence: `Similarity Score: ${Math.round(behavioralScore)}%`
      });
    } else if (behavioralScore < 70) {
      reasons.push({
        type: 'BEHAVIORAL_MISMATCH',
        severity: 'MEDIUM',
        description: 'Behavior partially differs from baseline. Some patterns are unusual.',
        confidence: 70,
        recommendation: 'Monitor session and collect additional behavioral samples.',
        evidence: `Similarity Score: ${Math.round(behavioralScore)}%`
      });
    }

    // Authentication strength analysis
    if (authMethods.length === 0 || authMethods.every(m => m === 'password')) {
      reasons.push({
        type: 'WEAK_AUTH_METHOD',
        severity: 'MEDIUM',
        description: 'Only password authentication used. No multi-factor authentication detected.',
        confidence: 90,
        recommendation: 'Require MFA (TOTP, WebAuthn, or SMS).',
        evidence: `Auth Methods: ${authMethods.join(', ') || 'password only'}`
      });
    }

    // New device
    if (contextData.device.trusted === false && contextData.device.type !== 'unknown') {
      reasons.push({
        type: 'NEW_DEVICE',
        severity: 'MEDIUM',
        description: 'Device is not registered or trusted. First-time access from this device.',
        confidence: 80,
        recommendation: 'Request device registration or step-up authentication.',
        evidence: `Device: ${contextData.device.os} ${contextData.device.browser}`
      });
    }

    // Low authentication history (proxy for new/infrequent user)
    if (authMethods.length === 1) {
      reasons.push({
        type: 'LOW_AUTH_HISTORY',
        severity: 'LOW',
        description: 'Limited authentication history. Limited data for behavioral profiling.',
        confidence: 60,
        recommendation: 'Collect more behavioral data over time.',
        evidence: `Auth Methods Count: ${authMethods.length}`
      });
    }

    // Generate summary
    const summary = this.generateSummary(decision, trustScore, reasons);

    // Generate recommendations
    const recommendations = this.generateRecommendations(decision, reasons, authMethods);

    // Generate action details
    const actionDetails = this.generateActionDetails(decision, reasons);

    // Sort reasons by severity
    reasons.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return {
      decision,
      trustScore,
      riskLevel,
      confidence: confidenceScore,
      reasons,
      summary,
      recommendations,
      actionDetails
    };
  }

  private static createDeviceReason(contextData: ContextData): ExplanationReason {
    return {
      type: 'NEW_DEVICE',
      severity: 'MEDIUM',
      description: `Unregistered device detected. Device fingerprint not in trusted list.`,
      confidence: 85,
      recommendation: 'Register device for future quick access or use step-up authentication.',
      evidence: `Fingerprint: ${contextData.device.fingerprint.substring(0, 16)}...`
    };
  }

  private static generateSummary(
    decision: string,
    trustScore: number,
    reasons: ExplanationReason[]
  ): string {
    const criticalReasons = reasons.filter(r => r.severity === 'CRITICAL');
    const highReasons = reasons.filter(r => r.severity === 'HIGH');

    let summary = '';

    if (decision === 'deny') {
      summary = `Access denied due to ${criticalReasons.length} critical and ${highReasons.length} high-risk factors. `;
      if (criticalReasons.length > 0) {
        summary += `Critical issue: ${criticalReasons[0].description} `;
      }
    } else if (decision === 'step-up') {
      summary = `Additional authentication required. Trust score ${trustScore}/100 is below safety threshold. `;
    } else if (decision === 'approval-required') {
      summary = `Manager approval required. Action complexity and risk level exceed standard thresholds. `;
    } else {
      summary = `Access approved. Trust score ${trustScore}/100 is sufficient. `;
    }

    return summary;
  }

  private static generateRecommendations(
    decision: string,
    reasons: ExplanationReason[],
    authMethods: string[]
  ): string[] {
    const recommendations: Set<string> = new Set();

    // Add reason-specific recommendations
    reasons.forEach(reason => {
      recommendations.add(reason.recommendation);
    });

    // Add decision-specific recommendations
    if (decision === 'deny') {
      recommendations.add('Contact support if this is a legitimate access attempt.');
      recommendations.add('Review account security settings.');
    } else if (decision === 'step-up') {
      recommendations.add('Complete additional authentication to proceed.');
      if (!authMethods.includes('passkey')) {
        recommendations.add('Consider registering a passkey for faster future access.');
      }
    } else if (decision === 'approval-required') {
      recommendations.add('Request has been escalated to manager for approval.');
      recommendations.add('You will be notified when a decision is made.');
    }

    return Array.from(recommendations).slice(0, 5); // Return up to 5 recommendations
  }

  private static generateActionDetails(
    decision: string,
    reasons: ExplanationReason[]
  ): { nextStep: string; estimatedWaitTime?: string; escalationPath?: string } {
    const criticalCount = reasons.filter(r => r.severity === 'CRITICAL').length;

    switch (decision) {
      case 'allow':
        return {
          nextStep: 'Redirecting to your dashboard...',
        };

      case 'step-up':
        return {
          nextStep: 'Complete verification via TOTP, passkey, or SMS.',
          estimatedWaitTime: '2-3 minutes'
        };

      case 'approval-required':
        return {
          nextStep: 'Your request has been sent to management.',
          estimatedWaitTime: '1-4 hours',
          escalationPath: 'Manager Review → Director Review → Access Granted/Denied'
        };

      case 'deny':
      default:
        return {
          nextStep: 'Access denied. Contact support for assistance.',
          escalationPath: 'Support Ticket → Security Investigation → Account Recovery'
        };
    }
  }
}
