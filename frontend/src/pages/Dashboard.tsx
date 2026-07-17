import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrust } from '@/hooks/useTrust';
import { useApprovals } from '@/hooks/useApprovals';
import { TrustGauge } from '@/components/TrustGauge';
import { TrustTimeline } from '@/components/TrustTimeline';
import { ActivityFeed } from '@/components/ActivityFeed';
import { SecurityAlerts } from '@/components/SecurityAlerts';
import { ActionCard } from '@/components/ActionCard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { trustScore, getTrustTrends, loading: trustLoading } = useTrust();
  const { pendingApprovals } = useApprovals();
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await getTrustTrends(7);
        setTrends(data);
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      }
    };

    fetchTrends();
  }, []);

  // Mock data for components
  const mockActivities = [
    {
      id: '1',
      type: 'login' as const,
      description: 'Successful login from trusted device',
      timestamp: new Date().toISOString(),
      severity: 'low' as const,
    },
    {
      id: '2',
      type: 'trust_eval' as const,
      description: 'Trust score evaluated for high-risk transaction',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      severity: 'medium' as const,
    },
  ];

  const mockAlerts = [
    {
      id: '1',
      title: 'Suspicious Login Attempt',
      description: 'Login attempt from new location detected',
      severity: 'medium' as const,
      timestamp: new Date().toISOString(),
      resolved: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="text-sm text-gray-600">
              Welcome back, <span className="font-semibold">{user?.firstName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trust Score</p>
                <p className="text-3xl font-bold text-blue-600">
                  {trustScore?.currentScore || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                🛡️
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-orange-600">{pendingApprovals.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                📋
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-red-600">{mockAlerts.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                🚨
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Status</p>
                <p className="text-3xl font-bold text-green-600">Secure</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                ✅
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Trust Gauge */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Current Trust Level</h2>
              {trustLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : (
                <TrustGauge score={trustScore?.currentScore || 0} size="lg" />
              )}
            </div>
          </div>

          {/* Trust Timeline */}
          <div className="lg:col-span-2">
            {trends.length > 0 && <TrustTimeline data={trends} />}
          </div>
        </div>

        {/* Activity and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ActivityFeed activities={mockActivities} />
          <SecurityAlerts alerts={mockAlerts} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="Approvals"
            description="Review pending approval requests"
            icon={<span className="text-2xl">📋</span>}
            link="/approvals"
            badge={{ text: `${pendingApprovals.length}`, color: 'red' }}
          />

          <ActionCard
            title="Trust History"
            description="View trust score trends"
            icon={<span className="text-2xl">📊</span>}
            link="/trust-history"
          />

          <ActionCard
            title="Audit Logs"
            description="Review security audit trail"
            icon={<span className="text-2xl">📜</span>}
            link="/audit"
          />

          <ActionCard
            title="Attack Simulator"
            description="Test security defenses"
            icon={<span className="text-2xl">🎯</span>}
            link="/simulator"
          />
        </div>
      </main>
    </div>
  );
};