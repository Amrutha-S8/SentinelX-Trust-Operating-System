import { useState, useEffect } from 'react';
import { approvalAPI } from '@/api/client';
import { ApprovalRequest } from '@/types';

export const useApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getPending();
      setPendingApprovals(response.data.requests);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string, comments?: string) => {
    await approvalAPI.approve(requestId, comments);
    await fetchPendingApprovals();
  };

  const rejectRequest = async (requestId: string, comments?: string) => {
    await approvalAPI.reject(requestId, comments);
    await fetchPendingApprovals();
  };

  const useBreakGlass = async (requestId: string, reason: string) => {
    await approvalAPI.breakGlass(requestId, reason);
    await fetchPendingApprovals();
  };

  const getAllRequests = async (status?: string) => {
    const response = await approvalAPI.getRequests(status);
    return response.data.requests;
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  return {
    pendingApprovals,
    loading,
    error,
    refetch: fetchPendingApprovals,
    approveRequest,
    rejectRequest,
    useBreakGlass,
    getAllRequests,
  };
};