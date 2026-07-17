import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { trustAPI } from '@/api/client';

interface BlockReason {
  factor: string;
  impact: string;
  detail: string;
  icon: string;
}

const BLOCK_EXPLANATIONS: Record<string, BlockReason[]> = {
  'impossible-travel': [
    { factor: 'Location anomaly', impact: 'Critical', detail: 'Your account was accessed from two locations that are physically impossible to travel between in the elapsed time.', icon: '📍' },
    { factor: 'Trust score drop', impact: 'High', detail: 'The unusual location caused your trust score to fall below the minimum threshold for this action.', icon: '📉' },
  ],
  'new-device': [
    { factor: 'Unrecognised device', impact: 'High', detail: 'This device has no prior trust history with your account.', icon: '💻' },
    { factor: 'No MFA verification', impact: 'Medium', detail: 'Strong authentication was not completed on this new device.', icon: '🔐' },
  ],
  'credential-stuffing': [
    { factor: 'Rate limit exceeded', impact: 'Critical', detail: 'Too many failed login attempts were detected from this IP address.', icon: '🚫' },
    { factor: 'IP reputation', impact: 'High', detail: 'This IP address has been associated with automated credential-stuffing activity.', icon: '🌐' },
  ],
  default: [
    { factor: 'Low trust score', impact: 'High', detail: 'Your current trust score is below the threshold required for access.', icon: '📊' },
    { factor: 'Policy restriction', impact: 'Medium', detail: 'An active security policy blocked this access attempt.', icon: '📋' },
    { factor: 'Context anomaly', impact: 'Medium', detail: 'One or more contextual signals (device, location, behaviour) were unusual.', icon: '⚠️' },
  ],
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWhyBlocked, setShowWhyBlocked] = useState(false);
  const [blockReasons, setBlockReasons] = useState<BlockReason[]>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg: string = err.response?.data?.error || 'Login failed';
      setError(msg);
      // Surface explainability panel for blocked/denied responses
      if (err.response?.status === 403 || msg.toLowerCase().includes('block') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('trust')) {
        const code = err.response?.data?.blockReason || 'default';
        setBlockReasons(BLOCK_EXPLANATIONS[code] || BLOCK_EXPLANATIONS['default']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SentinelX</h1>
            <p className="text-gray-600 mt-2">Trust Operating System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div>{error}</div>
                {blockReasons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowWhyBlocked(!showWhyBlocked)}
                    className="mt-2 text-sm font-medium text-red-800 underline underline-offset-2 hover:text-red-900"
                  >
                    {showWhyBlocked ? 'Hide details ▲' : 'Why was I blocked? ▼'}
                  </button>
                )}
              </div>
            )}

            {/* Why Was I Blocked — explainability panel */}
            {showWhyBlocked && blockReasons.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div className="text-sm font-semibold text-amber-900">Access blocked — here's why:</div>
                {blockReasons.map((r, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-lg leading-none mt-0.5">{r.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{r.factor}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          r.impact === 'Critical' ? 'bg-red-100 text-red-700' :
                          r.impact === 'High'     ? 'bg-orange-100 text-orange-700' :
                                                   'bg-yellow-100 text-yellow-700'}`}>
                          {r.impact}
                        </span>
                      </div>
                      <div className="text-gray-600 mt-0.5">{r.detail}</div>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-amber-700 pt-1 border-t border-amber-200">
                  Contact your administrator if you believe this is an error.
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="mb-2">Demo Credentials:</p>
            <div className="space-y-1 font-mono text-xs bg-gray-50 p-3 rounded-lg">
              <div><strong>Admin:</strong> admin@sentinelx.io / admin123</div>
              <div><strong>User:</strong> user1@sentinelx.io / user123</div>
              <div><strong>Approver:</strong> approver@sentinelx.io / user123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};