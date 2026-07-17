import React, { useState, useEffect } from 'react';
import { useTrust } from '@/hooks/useTrust';
import { TrustTimeline } from '@/components/TrustTimeline';
import { TrustExplanation } from '@/components/TrustExplanation';
import { format } from 'date-fns';

export const TrustHistory: React.FC = () => {
  const { getTrustHistory, getTrustTrends } = useTrust();
  const [history, setHistory] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [historyData, trendsData] = await Promise.all([
          getTrustHistory(50),
          getTrustTrends(timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)
        ]);
        setHistory(historyData);
        setTrends(trendsData);
      } catch (error) {
        console.error('Failed to fetch trust data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Trust History</h1>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-8">
            {/* Timeline Chart */}
            {trends.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Trust Score Trends</h2>
                <TrustTimeline data={trends} />
              </div>
            )}

            {/* History Table and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* History List */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Trust Evaluations</h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {history.map((log) => (
                    <div
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedLog?._id === log._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">{log.trustScore}</div>
                          <div className="text-sm text-gray-600">{log.riskLevel}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Log Details */}
              <div>
                {selectedLog ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4">Evaluation Details</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Action:</span> {selectedLog.action}
                        </div>
                        <div>
                          <span className="font-medium">Trust Score:</span> {selectedLog.trustScore}
                        </div>
                        <div>
                          <span className="font-medium">Risk Level:</span> {selectedLog.riskLevel}
                        </div>
                        <div>
                          <span className="font-medium">Timestamp:</span>{' '}
                          {format(new Date(selectedLog.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </div>
                      </div>
                    </div>

                    {selectedLog.explanation && (
                      <TrustExplanation
                        factors={selectedLog.factors || []}
                        explanation={selectedLog.explanation}
                        confidenceScore={selectedLog.confidenceScore || 85}
                      />
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    Select a trust evaluation to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};