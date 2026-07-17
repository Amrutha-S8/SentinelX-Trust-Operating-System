import React from 'react';

interface TrustGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const TrustGauge: React.FC<TrustGaugeProps> = ({ score, size = 'md' }) => {
  const getColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Low Risk';
    if (score >= 60) return 'Medium Risk';
    if (score >= 40) return 'High Risk';
    return 'Critical Risk';
  };

  const sizes = {
    sm: { width: 120, height: 120, stroke: 8 },
    md: { width: 180, height: 180, stroke: 12 },
    lg: { width: 240, height: 240, stroke: 16 },
  };

  const { width, height, stroke } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold" style={{ color: getColor(score) }}>
            {score}
          </div>
          <div className="text-sm text-gray-500 mt-1">Trust Score</div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-lg font-semibold" style={{ color: getColor(score) }}>
          {getRiskLevel(score)}
        </div>
      </div>
    </div>
  );
};