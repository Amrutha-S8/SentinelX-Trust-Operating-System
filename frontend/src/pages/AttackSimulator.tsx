import React, { useState } from 'react';
import { simulatorAPI } from '@/api/client';

export const AttackSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sim-swap');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const simulations = {
    'sim-swap': {
      title: 'SIM Swap Attack',
      description: 'Simulate a SIM swap attack to test phone number verification bypass',
      icon: '📱',
    },
    'impossible-travel': {
      title: 'Impossible Travel',
      description: 'Test geolocation-based security controls with impossible travel scenarios',
      icon: '🌍',
    },
    'credential-stuffing': {
      title: 'Credential Stuffing',
      description: 'Simulate automated login attempts with compromised credentials',
      icon: '🔐',
    },
    'mfa-fatigue': {
      title: 'MFA Fatigue',
      description: 'Test MFA bypass through user fatigue with repeated push notifications',
      icon: '📲',
    },
    'phishing': {
      title: 'Phishing Attack',
      description: 'Test detection of phishing attacks with malicious indicators',
      icon: '🎣',
    },
    'session-hijack': {
      title: 'Session Hijacking',
      description: 'Simulate unauthorized session takeover from unusual IPs',
      icon: '🔓',
    },
  };

  const runSimulation = async (type: string, params: any) => {
    setLoading(true);
    try {
      let response;
      switch (type) {
        case 'sim-swap':
          response = await simulatorAPI.simulateSIMSwap(params.targetAction);
          break;
        case 'impossible-travel':
          response = await simulatorAPI.simulateImpossibleTravel(
            params.fromLocation,
            params.toLocation,
            params.timeDiffMinutes
          );
          break;
        case 'credential-stuffing':
          response = await simulatorAPI.simulateCredentialStuffing(
            params.email,
            params.attempts
          );
          break;
        case 'mfa-fatigue':
          response = await simulatorAPI.simulateMFAFatigue(params.pushNotifications);
          break;
        case 'phishing':
          response = await simulatorAPI.simulatePhishing(params.phishingIndicators);
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

  const SIMSwapForm = () => {
    const [targetAction, setTargetAction] = useState('transfer_funds');

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Action
          </label>
          <select
            value={targetAction}
            onChange={(e) => setTargetAction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="transfer_funds">Transfer Funds</option>
            <option value="change_password">Change Password</option>
            <option value="access_sensitive_data">Access Sensitive Data</option>
          </select>
        </div>
        <button
          onClick={() => runSimulation('sim-swap', { targetAction })}
          disabled={loading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Simulate SIM Swap Attack'}
        </button>
      </div>
    );
  };

  const ImpossibleTravelForm = () => {
    const [fromLocation, setFromLocation] = useState({ city: 'New York', country: 'USA' });
    const [toLocation, setToLocation] = useState({ city: 'Tokyo', country: 'Japan' });
    const [timeDiff, setTimeDiff] = useState(30);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From City</label>
            <input
              type="text"
              value={fromLocation.city}
              onChange={(e) => setFromLocation({ ...fromLocation, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To City</label>
            <input
              type="text"
              value={toLocation.city}
              onChange={(e) => setToLocation({ ...toLocation, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Difference (minutes)
          </label>
          <input
            type="number"
            value={timeDiff}
            onChange={(e) => setTimeDiff(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() =>
            runSimulation('impossible-travel', {
              fromLocation,
              toLocation,
              timeDiffMinutes: timeDiff,
            })
          }
          disabled={loading}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Simulate Impossible Travel'}
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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Attempts
          </label>
          <input
            type="number"
            value={attempts}
            onChange={(e) => setAttempts(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => runSimulation('credential-stuffing', { email, attempts })}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Simulate Credential Stuffing'}
        </button>
      </div>
    );
  };

  const MFAFatigueForm = () => {
    const [pushNotifications, setPushNotifications] = useState(20);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Push Notifications
          </label>
          <input
            type="number"
            value={pushNotifications}
            onChange={(e) => setPushNotifications(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => runSimulation('mfa-fatigue', { pushNotifications })}
          disabled={loading}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Simulate MFA Fatigue Attack'}
        </button>
      </div>
    );
  };

  const PhishingForm = () => {
    const [indicators, setIndicators] = useState<string[]>(['unusual-domain', 'no-https']);

    const indicatorOptions = [
      { value: 'unusual-domain', label: 'Unusual Domain' },
      { value: 'misspelled-url', label: 'Misspelled URL' },
      { value: 'no-https', label: 'No HTTPS' },
      { value: 'different-login-page', label: 'Different Login Page' },
    ];

    const toggleIndicator = (value: string) => {
      setIndicators(prev =>
        prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
      );
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Phishing Indicators
          </label>
          <div className="space-y-2">
            {indicatorOptions.map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicators.includes(option.value)}
                  onChange={() => toggleIndicator(option.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={() => runSimulation('phishing', { phishingIndicators: indicators })}
          disabled={loading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Simulate Phishing Attack'}
        </button>
      </div>
    );
  };

  const SessionHijackForm = () => {
    const [newIpAddress, setNewIpAddress] = useState('203.0.113.45');
    const [newUserAgent, setNewUserAgent] = useState('Mozilla/5.0 (X11; Linux x86_64)');

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attacker IP Address
          </label>
          <input
            type="text"
            value={newIpAddress}
            onChange={(e) => setNewIpAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="203.0.113.45"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attacker User-Agent
          </label>
          <input
            type="text"
            value={newUserAgent}
            onChange={(e) => setNewUserAgent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Mozilla/5.0..."
          />
        </div>
        <button
          onClick={() => runSimulation('session-hijack', { newIpAddress, newUserAgent })}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Simulate Session Hijacking'}
        </button>
      </div>
    );
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'sim-swap':
        return <SIMSwapForm />;
      case 'impossible-travel':
        return <ImpossibleTravelForm />;
      case 'credential-stuffing':
        return <CredentialStuffingForm />;
      case 'mfa-fatigue':
        return <MFAFatigueForm />;
      case 'phishing':
        return <PhishingForm />;
      case 'session-hijack':
        return <SessionHijackForm />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Attack Simulator</h1>
          <p className="text-gray-600 mt-2">
            Test your security defenses with realistic attack scenarios
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simulation Selection */}
          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Attack Scenarios</h2>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(simulations).map(([key, sim]) => (
                  <div
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      activeTab === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{sim.icon}</span>
                      <div>
                        <h3 className="font-semibold">{sim.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{sim.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation Form & Results */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                {simulations[activeTab as keyof typeof simulations]?.title}
              </h2>
              {renderForm()}
            </div>

            {/* Results */}
            {results && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Simulation Results</h3>
                {results.error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {results.error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${
                      results.detected 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="font-semibold">
                        {results.detected ? '✅ Attack Detected' : '❌ Attack Not Detected'}
                      </div>
                      <div className="text-sm mt-1">
                        Detection Confidence: {results.confidence || 0}%
                      </div>
                    </div>

                    {results.triggeredAlerts && (
                      <div>
                        <h4 className="font-medium mb-2">Triggered Alerts:</h4>
                        <ul className="space-y-1">
                          {results.triggeredAlerts.map((alert: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">• {alert}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.recommendations && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <ul className="space-y-1">
                          {results.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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