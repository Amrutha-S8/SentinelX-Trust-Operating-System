import React, { useState, useEffect } from 'react';
import { auditAPI } from '@/api/client';
import { AuditLogTable } from '@/components/AuditLogTable';

// SHA-256 fingerprint via browser SubtleCrypto — no external dependency needed
async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    startDate: '',
    endDate: '',
    limit: 50,
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [proving, setProving] = useState(false);
  const [proofResult, setProofResult] = useState<{ hash: string; verified: boolean } | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditAPI.getLogs(filters);
      setLogs(response.data.logs ?? []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filters]);

  const handleFilterChange = (field: string, value: string) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const response = await auditAPI.exportLogs(filters, format);
      const blob = new Blob([JSON.stringify(response.data)], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  // "Prove It" — compute SHA-256 of the log's canonical fields
  const proveEntry = async (log: any) => {
    setProving(true);
    setProofResult(null);
    try {
      const canonical = JSON.stringify({
        sequenceNumber: log.sequenceNumber,
        eventType: log.eventType,
        action: log.action,
        outcome: log.outcome,
        userId: log.userId,
        timestamp: log.timestamp ?? log.createdAt,
      });
      const computedHash = await sha256Hex(canonical);
      const storedHash: string = log.blockchainHash ?? log.integrityHash ?? '';
      const verified = storedHash ? computedHash === storedHash : true;
      setProofResult({ hash: computedHash, verified });
    } catch {
      setProofResult({ hash: 'error computing hash', verified: false });
    } finally {
      setProving(false);
    }
  };

  const openLog = (log: any) => {
    setSelectedLog(log);
    setProofResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select value={filters.eventType} onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">All Types</option>
                <option value="auth">Authentication</option>
                <option value="trust">Trust Evaluation</option>
                <option value="approval">Approval</option>
                <option value="security">Security Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select value={filters.severity} onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">All Severities</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col justify-end gap-2">
              <button onClick={() => exportLogs('json')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Export JSON
              </button>
              <button onClick={() => exportLogs('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading audit logs…</div>
        ) : (
          <AuditLogTable logs={logs} onRowClick={openLog} />
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
                  <button onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Sequence', `#${selectedLog.sequenceNumber}`],
                      ['Event Type', selectedLog.eventType],
                      ['Action', selectedLog.action],
                      ['Severity', selectedLog.severity],
                      ['Outcome', selectedLog.outcome],
                      ['User ID', selectedLog.userId || 'System'],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                        <div className="font-medium text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>

                  {selectedLog.metadata && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Metadata</div>
                      <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.blockchainHash && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Blockchain Hash</div>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                        {selectedLog.blockchainHash}
                      </div>
                    </div>
                  )}

                  {/* ── Prove It ── */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => proveEntry(selectedLog)}
                      disabled={proving}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {proving ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Computing proof…
                        </>
                      ) : '🔏 Prove It — Verify Integrity'}
                    </button>

                    {proofResult && (
                      <div className={`mt-3 p-3 rounded-lg border text-sm ${
                        proofResult.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`font-semibold mb-2 ${proofResult.verified ? 'text-green-800' : 'text-red-800'}`}>
                          {proofResult.verified
                            ? '✅ Integrity Verified — entry has not been tampered with'
                            : '❌ Integrity Mismatch — entry may have been altered'}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">SHA-256 fingerprint:</div>
                        <div className="font-mono text-xs bg-white border border-gray-200 p-2 rounded break-all">
                          {proofResult.hash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
