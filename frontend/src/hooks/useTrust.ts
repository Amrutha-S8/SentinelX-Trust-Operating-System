import { useState, useEffect } from 'react';
import { trustAPI } from '@/api/client';
import { TrustScore, TrustLog } from '@/types';

export const useTrust = () => {
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrustScore = async () => {
    try {
      setLoading(true);
      const response = await trustAPI.getCurrentScore();
      setTrustScore({
        currentScore: response.data.currentScore,
        riskLevel: getRiskLevel(response.data.currentScore),
        lastUpdated: response.data.lastUpdated,
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch trust score');
    } finally {
      setLoading(false);
    }
  };

  const getTrustHistory = async (limit?: number): Promise<TrustLog[]> => {
    const response = await trustAPI.getHistory(limit);
    return response.data.logs;
  };

  const getTrustTrends = async (days?: number) => {
    const response = await trustAPI.getTrends(days);
    return response.data.trends;
  };

  const evaluateTrust = async (action: string, behavioralData?: any, actionRisk?: string) => {
    const response = await trustAPI.evaluate({ action, behavioralData, actionRisk });
    return response.data;
  };

  useEffect(() => {
    fetchTrustScore();
  }, []);

  return {
    trustScore,
    loading,
    error,
    refetch: fetchTrustScore,
    getTrustHistory,
    getTrustTrends,
    evaluateTrust,
  };
};

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}