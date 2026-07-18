import React, { useState } from 'react';
import { TrustFactor } from '@/types';

export interface ExplanationReason {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  confidence: number;
  recommendation: string;
  evidence?: string;
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

interface TrustExplanationProps {
  xaiExplanation?: XAIExplanation;
  factors?: TrustFactor[];
  explanation?: string;
  confidenceScore?: number;
}

export const TrustExplanation: React.FC<TrustExplanationProps> = ({
  xaiExplanation,
  factors = [],
  explanation = '',
  confidenceScore = 0,
}) => {
  const [expandedReason, setExpandedReason] = useState<string | null>(null);

  if (!xaiExplanation) {
    // Fallback to legacy format
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Trust Evaluation Explanation</h3>
        <div className="mb-4">
          <p className="text-gray-700">{explanation}</p>
          <div className="mt-2 text-sm text-gray-500">
            Confidence: <span className="font-semibold">{confidenceScore}%</span>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Contributing Factors:</h4>
          {factors.map((factor, index) => (
            <div key={index} className="border-l-4 pl-4" style={{ borderColor: getFactorColor(factor.value) }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{factor.name}</span>
                <span className="text-sm text-gray-600">{Math.round(factor.value)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${factor.value}%`,
                    backgroundColor: getFactorColor(factor.value),
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Weight: {(factor.weight * 100).toFixed(0)}% | Contribution: {factor.contribution.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full XAI explanation
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-lg p-6 space-y-6">
      {/* Decision Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Trust Decision</h3>
          <p className="text-sm text-gray-600 mt-1">{xaiExplanation.summary}</p>
        </div>
        <div className={`px-4 py-3 rounded-full font-bold text-white text-lg ${getDecisionBgColor(xaiExplanation.decision)}`}>
          {formatDecision(xaiExplanation.decision)}
        </div>
      </div>

      {/* Trust Score & Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm font-medium text-gray-600">Trust Score</div>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900">{xaiExplanation.trustScore}</span>
            <span className="text-gray-500 ml-1">/100</span>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getRiskColorBar(xaiExplanation.riskLevel)}`}
              style={{ width: `${xaiExplanation.trustScore}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm font-medium text-gray-600">Risk Level</div>
          <div className={`mt-2 text-2xl font-bold ${getRiskTextColor(xaiExplanation.riskLevel)}`}>
            {xaiExplanation.riskLevel.toUpperCase()}
          </div>
          <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium ${getRiskBgColor(xaiExplanation.riskLevel)}`}>
            {xaiExplanation.riskLevel}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm font-medium text-gray-600">Confidence</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{xaiExplanation.confidence}%</div>
          <div className="mt-3 text-xs text-gray-500">High certainty</div>
        </div>
      </div>

      {/* Severity Cards - Reasons */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Risk Factors</h4>
        <div className="space-y-2">
          {xaiExplanation.reasons.map((reason, index) => (
            <div
              key={index}
              className={`border-l-4 rounded p-4 bg-white cursor-pointer transition-all hover:shadow-md ${getSeverityBorderColor(reason.severity)}`}
              onClick={() => setExpandedReason(expandedReason === reason.type ? null : reason.type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-bold text-white ${getSeverityBgColor(reason.severity)}`}>
                    {reason.severity}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{reason.type.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-600">{reason.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{reason.confidence}%</div>
                  <div className="text-xs text-gray-500">confidence</div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedReason === reason.type && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Recommendation</div>
                    <p className="text-sm text-gray-700">{reason.recommendation}</p>
                  </div>
                  {reason.evidence && (
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">Evidence</div>
                      <div className="text-sm text-gray-600 font-mono bg-gray-100 rounded px-2 py-1">
                        {reason.evidence}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Actions</h4>
        <div className="space-y-2">
          {xaiExplanation.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 bg-white p-3 rounded border border-slate-200">
              <div className="text-blue-500 font-bold text-lg mt-0.5">✓</div>
              <p className="text-sm text-gray-700">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Next Steps</h4>
        <p className="text-sm text-blue-800 mb-2">{xaiExplanation.actionDetails.nextStep}</p>
        {xaiExplanation.actionDetails.estimatedWaitTime && (
          <div className="text-xs text-blue-700 mb-1">
            <strong>Estimated time:</strong> {xaiExplanation.actionDetails.estimatedWaitTime}
          </div>
        )}
        {xaiExplanation.actionDetails.escalationPath && (
          <div className="text-xs text-blue-700">
            <strong>Escalation path:</strong> {xaiExplanation.actionDetails.escalationPath}
          </div>
        )}
      </div>
    </div>
  );
};

function getFactorColor(value: number): string {
  if (value >= 80) return '#10b981';
  if (value >= 60) return '#3b82f6';
  if (value >= 40) return '#f59e0b';
  return '#ef4444';
}

function getDecisionBgColor(decision: string): string {
  switch (decision) {
    case 'allow':
      return 'bg-green-500';
    case 'step-up':
      return 'bg-yellow-500';
    case 'approval-required':
      return 'bg-orange-500';
    case 'deny':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function getRiskTextColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'text-red-600';
    case 'high':
      return 'text-orange-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

function getRiskColorBar(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

function getRiskBgColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getSeverityBgColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-600';
    case 'HIGH':
      return 'bg-orange-600';
    case 'MEDIUM':
      return 'bg-yellow-600';
    case 'LOW':
      return 'bg-blue-600';
    default:
      return 'bg-gray-600';
  }
}

function getSeverityBorderColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'border-red-500';
    case 'HIGH':
      return 'border-orange-500';
    case 'MEDIUM':
      return 'border-yellow-500';
    case 'LOW':
      return 'border-blue-500';
    default:
      return 'border-gray-500';
  }
}

function formatDecision(decision: string): string {
  switch (decision) {
    case 'allow':
      return '✓ ALLOWED';
    case 'deny':
      return '✗ DENIED';
    case 'step-up':
      return '⚠ VERIFY';
    case 'approval-required':
      return '⏳ PENDING';
    default:
      return decision.toUpperCase();
  }
}