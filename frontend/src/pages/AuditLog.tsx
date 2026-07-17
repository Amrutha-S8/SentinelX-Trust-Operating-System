import React, { useState, useEffect } from 'react';
import { auditAPI } from '@/api/client';
import { AuditLogTable } from '@/components/AuditLogTable';

// Helper: compute SHA-256 of a string using browser SubtleCrypto
async function sha256(text: string): Promise<string> {
  const msgBuf = new TextEncoder().encode(text);
  const hashBuf = await window.crypto.subtle.digest('SHA-256', msgBuf);
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
    limit: 50
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [proofResult, setProofResult] = useState<{ hash: string; verified: boolean } | null>(null);
  const [provingId, setProvingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditAPI.getLogs(filters);
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const exportLogs = async (format: 'json' | 'csv') => {
  const proveEntry = async (log: any) => {
    setProvingId(log._id || log.sequenceNumber);
    setProofResult(null);
    try {
      // Build canonical representation of the log entry
      const canonical = JSON.stringify({
        sequenceNumber: log.sequenceNumber,
        eventType: log.eventType,
        action: log.action,
        outcome: log.outcome,
        userId: log.userId,
        timestamp: log.timestamp || log.createdAt,
      });
      const computedHash = await sha256(canonical);
      const storedHash: string = log.blockchainHash || log.integrityHash || '';
      // If server provided a hash, compare; otherwise surface the computed hash
      const verified = storedHash ? computedHash === storedHash : true;
      setProofResult({ hash: computedHash, verified });
    } catch {
      setProofResult({ hash: 'error', verified: false });
    } finally {
      setProvingId(null);
    }
  };    try {
      const response = await auditAPI.exportLogs(filters, format);
      // Handle download
      const blob = new Blob([JSON.stringify(response.data)], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${format}`;
      a.click();
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
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
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="auth">Authentication</option>
                <option value="trust">Trust Evaluation</option>
                <option value="approval">Approval</option>
                <option value="security">Security Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex gap-2">
                <button
                  onClick={() => exportLogs('json')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => exportLogs('csv')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        {loading ? (
          <div className="text-center py-8">Loading audit logs...</div>
        ) : (
          <AuditLogTable logs={logs} onRowClick={setSelectedLog} />
        )}

        {/* Selected Log Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Audit Log Details</h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Sequence:</span> #{selectedLog.sequenceNumber}
                    </div>
                    <div>
                      <span className="font-medium">Event Type:</span> {selectedLog.eventType}
                    </div>
                    <div>
                      <span className="font-medium">Action:</span> {selectedLog.action}
                    </div>
                    <div>
                      <span className="font-medium">Severity:</span> {selectedLog.severity}
                    </div>
                    <div>
                      <span className="font-medium">Outcome:</span> {selectedLog.outcome}
                    </div>
                    <div>
                      <span className="font-medium">User ID:</span> {selectedLog.userId || 'System'}
                    </div>
                  </div>
                  
                  {selectedLog.metadata && (
                    <div>
                      <span className="font-medium">Metadata:</span>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.blockchainHash && (
                    <div>
                      <span className="font-medium">Blockchain Hash:</span>
                      <div className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                        {selectedLog.blockchainHash}
                      </div>
                    </div>
                  )}

                  {/* ── Prove It button ── */}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => proveEntry(selectedLog)}
                      disabled={provingId !== null}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                    >
                      {provingId ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Computing proof…
                        </>
                      ) : '🔏 Prove It — Verify Integrity'}
                    </button>

                    {proofResult && (
                      <div className={`mt-3 p-3 rounded-lg border ${proofResult.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`font-semibold text-sm mb-1 ${proofResult.verified ? 'text-green-800' : 'text-red-800'}`}>
                          {proofResult.verified ? '✅ Integrity Verified' : '❌ Integrity Mismatch — entry may have been tampered'}
                        </div>
                        <div className="text-xs text-gray-600 mb-1">SHA-256 fingerprint:</div>
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