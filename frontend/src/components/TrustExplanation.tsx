import React from 'react';
import { TrustFactor } from '@/types';

interface TrustExplanationProps {
  factors: TrustFactor[];
  explanation: string;
  confidenceScore: number;
}

export const TrustExplanation: React.FC<TrustExplanationProps> = ({
  factors,
  explanation,
  confidenceScore,
}) => {
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
};

function getFactorColor(value: number): string {
  if (value >= 80) return '#10b981';
  if (value >= 60) return '#3b82f6';
  if (value >= 40) return '#f59e0b';
  return '#ef4444';
}