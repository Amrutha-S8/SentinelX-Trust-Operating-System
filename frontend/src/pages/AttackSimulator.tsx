import React, { useState } from 'react';
import { simulatorAPI } from '@/api/client';

type SimKey = 'sim-swap' | 'impossible-travel' | 'credential-stuffing' | 'mfa-fatigue' | 'phishing' | 'session-hijack';

const SIMULATIONS: Record<SimKey, { title: string; description: string; icon: string; color: string }> = {
  'sim-swap': {
    title: 'SIM Swap Attack',
    description: 'Simulate a SIM swap attack to test phone number verification bypass',
    icon: '📱',
    color: 'bg-red-600 hover:bg-red-700',
  },
  'impossible-travel': {
    title: 'Impossible Travel',
    description: 'Test geolocation-based security with physically impossible travel scenarios',
    icon: '🌍',
    color: 'bg-orange-600 hover:bg-orange-700',
  },
  'credential-stuffing': {
    title: 'Credential Stuffing',
    description: 'Simulate automated login attempts with compromised credential lists',
    icon: '🔐',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  'mfa-fatigue': {
    title: 'MFA Fatigue',
    description: 'Test MFA bypass through repeated push notifications to exhaust the user',
    icon: '📲',
    color: 'bg-yellow-600 hover:bg-yellow-700',
  },
  'phishing': {
    title: 'Phishing Attack',
    description: 'Simulate credential theft via a spoofed login page with suspicious indicators',
    icon: '🎣',
    color: 'bg-pink-600 hover:bg-pink-700',
  },
  'session-hijack': {
    title: 'Session Hijacking',
    description: 'Test session integrity by simulating a mid-session IP and user-agent change',
    icon: '🕵️',
    color: 'bg-teal-600 hover:bg-teal-700',
  },
};

export const AttackSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SimKey>('sim-swap');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async (type: SimKey, params: any) => {
    setLoading(true);
    setResults(null);
    try {
      let response;
      switch (type) {
        case 'sim-swap':
          response = await simulatorAPI.simulateSIMSwap(params.targetAction);
          break;
        case 'impossible-travel':
          response = await simulatorAPI.simulateImpossibleTravel(
            params.fromLocation, params.toLocation, params.timeDiffMinutes
          );
          break;
        case 'credential-stuffing':
          response = await simulatorAPI.simulateCredentialStuffing(params.email, params.attempts);
          break;
        case 'mfa-fatigue':
          response = await simulatorAPI.simulateMFAFatigue(params.pushNotifications);
          break;
        case 'phishing':
          response = await simulatorAPI.simulatePhishing(params.indicators);
          break;
        case 'session-hijack':
          response = await simulatorAPI.simulateSessionHijack(params.newIpAddress, params.newUserAgent);
          break;
      }
      setResults(response?.data);
    } catch (error: any) {
      setResults({ error: error.response?.data?.error || 'Simulation failed' });
    } finally {
      setLoading(false);
    }
  };

  // ── Individual forms ──────────────────────────────────────────────────────

  const SIMSwapForm = () => {
    const [targetAction, setTargetAction] = useState('transfer_funds');
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Action</label>
          <select value={targetAction} onChange={(e) => setTargetAction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="transfer_funds">Transfer Funds</option>
            <option value="change_password">Change Password</option>
            <option value="access_sensitive_data">Access Sensitive Data</option>
          </select>
        </div>
        <button onClick={() => runSimulation('sim-swap', { targetAction })} disabled={loading}
          className={`w-full px-4 py-2 text-white rounded-lg disabled:opacity-50 ${SIMULATIONS['sim-swap'].color}`}>
          {loading ? 'Running…' : 'Run Simulation'}
        </button>
      </div>
    );
  };

  const ImpossibleTravelForm = () => {
    const [from, setFrom] = useState({ lat: 40.7128, lon: -74.006, city: 'New York', country: 'US' });
    const [to, setTo] = useState({ lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'JP' });
    const [timeDiff, setTimeDiff] = useState(30);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From City</label>
            <input type="text" value={from.city}
              onChange={(e) => setFrom({ ...from, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To City</label>
            <input type="text" value={to.city}
              onChange={(e) => setTo({ ...to, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Between Logins (minutes)</label>
          <input type="number" value={timeDiff} onChange={(e) => setTimeDiff(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => runSimulation('impossible-travel', { fromLocation: from, toLocation: to, timeDiffMinutes: timeDiff })}
          disabled={loading}
          className={`w-full px-4 py-2 text-white rounded-lg disabled:opacity-50 ${SIMULATIONS['impossible-travel'].color}`}>
          {loading ? 'Running…' : 'Run Simulation'}
        </button>
      </div>
    );
  };

  const CredentialStuffingForm = () => {
    const [email, setEmail] = useState('test@example.com');
    const [attempts, setAttempts] = useState(100);
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Attempts</label>
          <input type="number" value={attempts} onChange={(e) => setAttempts(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => runSimulation('credential-stuffing', { email, attempts })} disabled={loading}
          className={`w-full px-4 py-2 text-white rounded-lg disabled:opacity-50 ${SIMULATIONS['credential-stuffing'].color}`}>
          {loading ? 'Running…' : 'Run Simulation'}
        </button>
      </div>
    );
  };

  const MFAFatigueForm = () => {
    const [pushCount, setPushCount] = useState(20);
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Push Notifications to Send</label>
          <input type="number" value={pushCount} onChange={(e) => setPushCount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => runSimulation('mfa-fatigue', { pushNotifications: pushCount })} disabled={loading}
          className={`w-full px-4 py-2 text-white rounded-lg disabled:opacity-50 ${SIMULATIONS['mfa-fatigue'].color}`}>
          {loading ? 'Running…' : 'Run Simulation'}
        </button>
      </div>
    );
  };

  const PhishingForm = () => {
    const allIndicators = [
      { id: 'unusual-domain', label: 'Unusual / lookalike domain' },
      { id: 'misspelled-url', label: 'Misspelled URL' },
      { id: 'no-https', label: 'No HTTPS / invalid certificate' },
      { id: 'different-login-page', label: 'Different login page layout' },
      { id: 'suspicious-redirect', label: 'Suspicious redirect chain' },
    ];
    const [selected, setSelected] = useState<string[]>(['unusual-domain', 'misspelled-url']);

    const toggle = (id: string) =>
      setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phishing Indicators Present</label>
          <div className="space-y-2">
            {allIndicators.map((ind) => (
              <label key={ind.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input type="checkbox" checked={selected.includes(ind.id)} onChange={() => toggle(ind.id)}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">{ind.label}</span>
              </label>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">Detection triggers when ≥2 indicators are present</div>
        </div>
        <button onClick={() => runSimulation('phishing', { indicators: selected })} disabled={loading}
          className={`w-full px-4 py-2 text-white rounded-lg disabled:opacity-50 ${SIMULATIONS['phishing'].color}`}>
          {loading ? 'Running…' : 'Run Simulation'}
        </button>
      </div>
    );
  };

  const SessionHijackForm = () => {
    const [newIp, setNewIp] = useState('203.0.113.99');
    const [newUA, setNewUA] = useState('Mozilla/5.0 (Linux; Android 10)');
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New IP Address (attacker)</label>
          <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New User-Agent (attacker device)</label>
          <input type="text" value={newUA} onChange={(e) => setNewUA(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs" />
        </div>
        <p className="text-xs text-gray-500">The system detects if IP or User-Agent changes mid-session without re-authentication.</p>
        <button onClick={() => runSimulation('session-hijack', { newIpAddress: newIp, newUserAgent: newUA })}
          disabled={loading}
          className={`w-full px-4 py-2 text-white rounded-lg disabled:opacity-50 ${SIMULATIONS['session-hijack'].color}`}>
          {loading ? 'Running…' : 'Run Simulation'}
        </button>
      </div>
    );
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'sim-swap':           return <SIMSwapForm />;
      case 'impossible-travel':  return <ImpossibleTravelForm />;
      case 'credential-stuffing':return <CredentialStuffingForm />;
      case 'mfa-fatigue':        return <MFAFatigueForm />;
      case 'phishing':           return <PhishingForm />;
      case 'session-hijack':     return <SessionHijackForm />;
    }
  };

  const sim = SIMULATIONS[activeTab];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Attack Simulator</h1>
          <p className="text-gray-600 mt-2">Test security defenses with 6 realistic attack scenarios</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Scenario selector */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Attack Scenarios</h2>
              <p className="text-xs text-gray-500 mt-0.5">6 scenarios — click one to configure and run</p>
            </div>
            <div className="p-6 space-y-3">
              {(Object.entries(SIMULATIONS) as [SimKey, typeof SIMULATIONS[SimKey]][]).map(([key, s]) => (
                <div key={key} onClick={() => { setActiveTab(key); setResults(null); }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    activeTab === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{s.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{s.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form + Results */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{sim.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold">{sim.title}</h2>
                  <p className="text-sm text-gray-500">{sim.description}</p>
                </div>
              </div>
              {renderForm()}
            </div>

            {/* Results panel */}
            {results && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Simulation Results</h3>
                {results.error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {results.error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border ${results.detected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="font-semibold text-lg">
                        {results.detected ? '✅ Attack Detected' : '❌ Attack Not Detected'}
                      </div>
                      <div className="text-sm mt-1 text-gray-600">{results.explanation}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Trust Score</div>
                        <div className={`text-2xl font-bold ${results.trustScore >= 65 ? 'text-green-600' : results.trustScore >= 45 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {results.trustScore}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Risk Level</div>
                        <div className={`text-lg font-bold capitalize ${
                          results.riskLevel === 'critical' ? 'text-red-600' :
                          results.riskLevel === 'high' ? 'text-orange-600' :
                          results.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {results.riskLevel}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Decision</div>
                        <div className="font-semibold capitalize">{results.decision}</div>
                      </div>
                      {results.timeToDetect && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Detection Time</div>
                          <div className="font-semibold">{results.timeToDetect} ms</div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="text-xs text-gray-500 mb-2 font-medium">Detection Metrics</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ['True Positive', results.metrics?.truePositive],
                          ['False Positive', results.metrics?.falsePositive],
                          ['True Negative', results.metrics?.trueNegative],
                          ['False Negative', results.metrics?.falseNegative],
                        ].map(([label, val]) => (
                          <div key={label as string} className="flex justify-between">
                            <span className="text-gray-600">{label}</span>
                            <span className={val ? 'text-green-600 font-medium' : 'text-gray-400'}>
                              {val ? 'Yes' : 'No'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
