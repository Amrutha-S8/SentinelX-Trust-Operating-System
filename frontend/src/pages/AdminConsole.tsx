import React, { useState, useEffect } from 'react';
import { adminAPI, policyAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type Tab = 'users' | 'policies' | 'health' | 'metrics' | 'alerts';

export const AdminConsole: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userFilter, setUserFilter] = useState({ role: '', status: '' });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard');
  }, [user, navigate]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getUsers(userFilter);
      setUsers(r.data.users || []);
    } catch { showAlert('error', 'Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const r = await policyAPI.getPolicies();
      setPolicies(r.data.policies || []);
    } catch { showAlert('error', 'Failed to load policies'); }
    finally { setLoading(false); }
  };

  const fetchSystem = async () => {
    setLoading(true);
    try {
      const [h, m] = await Promise.all([adminAPI.getSystemHealth(), adminAPI.getMetrics()]);
      setHealth(h.data);
      setMetrics(m.data);
    } catch { showAlert('error', 'Failed to load system data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'policies') fetchPolicies();
    else if (activeTab === 'health' || activeTab === 'metrics') fetchSystem();
  }, [activeTab, userFilter]);

  const togglePolicy = async (p: any) => {
    try {
      if (p.enabled) await policyAPI.disablePolicy(p._id);
      else await policyAPI.enablePolicy(p._id);
      showAlert('success', `Policy ${p.enabled ? 'disabled' : 'enabled'}`);
      fetchPolicies();
    } catch { showAlert('error', 'Failed to update policy'); }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      showAlert('success', 'Role updated');
      setEditingUser(null);
      fetchUsers();
    } catch { showAlert('error', 'Failed to update role'); }
  };

  const toggleStatus = async (u: any) => {
    try {
      const next = u.status === 'active' ? 'suspended' : 'active';
      await adminAPI.updateUserStatus(u._id, next);
      showAlert('success', `User ${next}`);
      fetchUsers();
    } catch { showAlert('error', 'Failed to update status'); }
  };

  const tabs = [
    { id: 'users' as Tab, label: 'Users', icon: '👥' },
    { id: 'policies' as Tab, label: 'Policies', icon: '📋' },
    { id: 'health' as Tab, label: 'Health', icon: '❤️' },
    { id: 'metrics' as Tab, label: 'Metrics', icon: '📊' },
    { id: 'alerts' as Tab, label: 'Security Alerts', icon: '🚨' },
  ];

  const mockAlerts = [
    { id: 1, sev: 'critical', title: 'Brute-force detected', desc: '15 failed logins from 192.168.1.55 in 5 min', time: '2 min ago' },
    { id: 2, sev: 'high', title: 'Impossible travel', desc: 'Login from New York then Tokyo within 30 min', time: '18 min ago' },
    { id: 3, sev: 'medium', title: 'MFA fatigue attempt', desc: '12 push notifications sent in 3 minutes', time: '1 hr ago' },
    { id: 4, sev: 'info', title: 'New device registered', desc: 'Admin added trusted device (Chrome/Windows)', time: '3 hr ago' },
  ];

  const sevColor: Record<string, string> = {
    critical: 'bg-red-50 border-red-200',
    high: 'bg-orange-50 border-orange-200',
    medium: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };
  const sevIcon: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', info: '🔵' };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
            <p className="text-gray-500 mt-1 text-sm">SentinelX Trust Operating System</p>
          </div>
          <span className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-red-700 text-sm font-medium">
            🔐 Admin Access
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {alert && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium border ${
            alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {alert.message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* USERS */}
            {activeTab === 'users' && (
              <div>
                <div className="flex gap-3 mb-5">
                  {['role', 'status'].map(field => (
                    <select key={field} value={(userFilter as any)[field]}
                      onChange={e => setUserFilter(f => ({ ...f, [field]: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 capitalize">
                      <option value="">All {field}s</option>
                      {field === 'role'
                        ? ['admin','approver','user'].map(v => <option key={v} value={v}>{v}</option>)
                        : ['active','suspended','pending'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ))}
                </div>
                {loading ? <div className="py-8 text-center text-gray-400">Loading…</div> : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>{['Name','Email','Role','Status','MFA','Last Login','Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map(u => (
                          <tr key={u._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                            <td className="px-4 py-3 text-gray-600">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                u.role==='admin' ? 'bg-red-100 text-red-700' : u.role==='approver' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                u.status==='active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">{u.totpEnabled ? '✅' : '❌'}</td>
                            <td className="px-4 py-3 text-gray-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => setEditingUser(u)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit Role</button>
                                <button onClick={() => toggleStatus(u)}
                                  className={`px-2 py-1 text-xs rounded ${u.status==='active' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                  {u.status==='active' ? 'Suspend' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* POLICIES */}
            {activeTab === 'policies' && (
              <div>
                {loading ? <div className="py-8 text-center text-gray-400">Loading…</div> : (
                  <div className="space-y-3">
                    {policies.map(p => (
                      <div key={p._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{p.name}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{p.category}</span>
                            <span className="text-xs text-gray-400">Priority {p.priority}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-6 shrink-0">
                          <span className={`text-sm font-medium ${p.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                            {p.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <button onClick={() => togglePolicy(p)} aria-label={`Toggle ${p.name}`}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${p.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {policies.length === 0 && <div className="py-8 text-center text-gray-400">No policies found</div>}
                  </div>
                )}
              </div>
            )}

            {/* HEALTH */}
            {activeTab === 'health' && (
              <div className="space-y-6">
                {loading ? <div className="py-8 text-center text-gray-400">Loading…</div> : health ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${health.status==='ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-lg font-semibold">{health.status==='ok' ? 'All Systems Operational' : 'System Degraded'}</span>
                      <span className="text-sm text-gray-500">Uptime: {Math.floor(health.uptime/3600)}h {Math.floor((health.uptime%3600)/60)}m</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(health.services || {}).map(([name, status]: [string, any]) => (
                        <div key={name} className={`p-4 rounded-lg border-2 ${status==='healthy' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize">{name}</span>
                            <span className={`text-sm font-semibold ${status==='healthy' ? 'text-green-700' : 'text-red-700'}`}>
                              {status==='healthy' ? '✓ Healthy' : '✗ Down'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={fetchSystem} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Refresh</button>
                  </>
                ) : <div className="py-8 text-center text-gray-400">Failed to load health</div>}
              </div>
            )}

            {/* METRICS */}
            {activeTab === 'metrics' && (
              <div>
                {loading ? <div className="py-8 text-center text-gray-400">Loading…</div> : metrics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                      <div className="text-3xl font-bold text-blue-700">{metrics.users?.total ?? '—'}</div>
                      <div className="text-sm text-blue-600 mt-1">Total Users</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                      <div className="text-3xl font-bold text-green-700">{metrics.users?.active ?? '—'}</div>
                      <div className="text-sm text-green-600 mt-1">Active Users</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                      <div className="text-3xl font-bold text-purple-700">{metrics.policies ?? '—'}</div>
                      <div className="text-sm text-purple-600 mt-1">Policies</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                      <div className="text-3xl font-bold text-orange-700">
                        {metrics.memory ? `${(metrics.memory.heapUsed/1024/1024).toFixed(1)} MB` : '—'}
                      </div>
                      <div className="text-sm text-orange-600 mt-1">Heap Used</div>
                    </div>
                    {metrics.memory && (
                      <div className="col-span-full bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Memory Utilisation</div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full"
                            style={{ width: `${Math.min((metrics.memory.heapUsed/metrics.memory.heapTotal)*100,100)}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {((metrics.memory.heapUsed/metrics.memory.heapTotal)*100).toFixed(1)}% of {(metrics.memory.heapTotal/1024/1024).toFixed(0)} MB
                        </div>
                      </div>
                    )}
                  </div>
                ) : <div className="py-8 text-center text-gray-400">Failed to load metrics</div>}
              </div>
            )}

            {/* ALERTS */}
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {mockAlerts.map(a => (
                  <div key={a.id} className={`flex items-start gap-4 p-4 rounded-lg border ${sevColor[a.sev]}`}>
                    <span className="text-xl mt-0.5">{sevIcon[a.sev]}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{a.title}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{a.desc}</div>
                      <div className="text-xs text-gray-400 mt-1">{a.time}</div>
                    </div>
                    <button className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Dismiss</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Edit Role — {editingUser.firstName} {editingUser.lastName}</h3>
            <div className="space-y-3">
              {['user','approver','admin'].map(role => (
                <label key={role} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="role" value={role} defaultChecked={editingUser.role===role}
                    onChange={() => updateRole(editingUser._id, role)} className="w-4 h-4 text-blue-600" />
                  <span className="capitalize font-medium">{role}</span>
                </label>
              ))}
            </div>
            <button onClick={() => setEditingUser(null)}
              className="mt-5 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
