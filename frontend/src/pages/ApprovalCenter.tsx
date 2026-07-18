import React, { useState } from 'react';
import { useApprovals } from '@/hooks/useApprovals';
import { TrustExplanation } from '@/components/TrustExplanation';
import { format } from 'date-fns';

export const ApprovalCenter: React.FC = () => {
  const { pendingApprovals, approveRequest, rejectRequest, loading } = useApprovals();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async (requestId: string) => {
    setActionLoading(true);
    try {
      await approveRequest(requestId, comments);
      setSelectedRequest(null);
      setComments('');
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(true);
    try {
      await rejectRequest(requestId, comments);
      setSelectedRequest(null);
      setComments('');
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Approval Center</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Pending Approvals ({pendingApprovals.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium mb-2">No pending approvals</h3>
              <p>All approval requests have been processed.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingApprovals.map((request) => (
                <div key={request._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{request.action}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            request.policyType === 'break-glass'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {request.policyType}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Requester:</span>{' '}
                          {request.requesterId?.email || 'Unknown'}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span>{' '}
                          {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                        <p>
                          <span className="font-medium">Expires:</span>{' '}
                          {format(new Date(request.expiresAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                        <p>
                          <span className="font-medium">Progress:</span>{' '}
                          {request.currentApprovals}/{request.requiredApprovals} approvals
                        </p>
                      </div>

                      {request.actionDetails && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Request Details:</p>
                          <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                            {JSON.stringify(request.actionDetails, null, 2)}
                          </pre>
                        </div>
                      )}

                      {request.xaiExplanation && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Requester's Trust Explanation:</p>
                          <TrustExplanation xaiExplanation={request.xaiExplanation} />
                        </div>
                      )}

                      {selectedRequest?._id === request._id && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comments (optional)
                          </label>
                          <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add your comments here..."
                            rows={3}
                          />
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {selectedRequest?._id === request._id ? (
                        <>
                          <button
                            onClick={() => handleApprove(request._id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(request._id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                          >
                            ✗ Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(null);
                              setComments('');
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};