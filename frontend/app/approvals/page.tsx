'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  FileText,
  DollarSign,
  CreditCard,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

interface ApprovalItem {
  id: number;
  type: 'revenue' | 'expense' | 'workflow';
  title: string;
  description?: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requester?: string;
  requester_id?: number;
  approver?: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  revenue_entry_id?: number;
  expense_entry_id?: number;
  workflow_id?: number;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canApproveTransactions } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch approval workflows
      const workflowsResponse = await apiClient.getApprovals();
      const workflows = (workflowsResponse.data || []).map((w: any) => ({
        id: w.id,
        type: 'workflow' as const,
        title: w.title || `${w.type} Approval`,
        description: w.description,
        status: w.status?.toLowerCase() || 'pending',
        requester_id: w.requester_id,
        created_at: w.created_at,
        updated_at: w.updated_at,
        approved_at: w.approved_at,
        rejection_reason: w.rejection_reason,
        revenue_entry_id: w.revenue_entry_id,
        expense_entry_id: w.expense_entry_id,
        workflow_id: w.id,
      }));

      // Fetch pending revenue entries
      const revenuesResponse = await apiClient.getRevenues({ is_approved: false });
      const pendingRevenues = (revenuesResponse.data || [])
        .filter((r: any) => !r.is_approved)
        .map((r: any) => ({
          id: r.id,
          type: 'revenue' as const,
          title: r.description || `Revenue Entry #${r.id}`,
          description: r.description,
          amount: r.amount,
          status: 'pending' as const,
          requester_id: r.created_by_id,
          created_at: r.created_at || r.date,
          revenue_entry_id: r.id,
        }));

      // Fetch pending expense entries
      const expensesResponse = await apiClient.getExpenses({ is_approved: false });
      const pendingExpenses = (expensesResponse.data || [])
        .filter((e: any) => !e.is_approved)
        .map((e: any) => ({
          id: e.id,
          type: 'expense' as const,
          title: e.title || e.description || `Expense Entry #${e.id}`,
          description: e.description,
          amount: e.amount,
          status: 'pending' as const,
          requester_id: e.created_by_id,
          created_at: e.created_at || e.date,
          expense_entry_id: e.id,
        }));

      // Combine all approvals
      const allApprovals = [...workflows, ...pendingRevenues, ...pendingExpenses];
      
      // Sort by created date (newest first)
      allApprovals.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setApprovals(allApprovals);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    if (!canApproveTransactions()) {
      alert('You do not have permission to approve items');
      return;
    }

    setProcessingId(item.id);
    setError(null);

    try {
      if (item.type === 'workflow' && item.workflow_id) {
        // Approve workflow
        await apiClient.approveWorkflow(item.workflow_id);
      } else if (item.type === 'revenue' && item.revenue_entry_id) {
        // Approve revenue entry directly
        await apiClient.approveItem(item.revenue_entry_id, 'revenue');
      } else if (item.type === 'expense' && item.expense_entry_id) {
        // Approve expense entry directly
        await apiClient.approveItem(item.expense_entry_id, 'expense');
      }
      
      // Reload approvals
      await loadApprovals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve item');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: ApprovalItem, reason: string) => {
    if (!canApproveTransactions()) {
      alert('You do not have permission to reject items');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessingId(item.id);
    setError(null);

    try {
      if (item.type === 'workflow' && item.workflow_id) {
        // Reject workflow
        await apiClient.rejectWorkflow(item.workflow_id, reason);
      } else {
        // For direct revenue/expense entries, we need to create a rejection workflow
        // For now, show a message that these should be rejected through workflows
        // In a full implementation, you would create a rejection workflow here
        alert('To reject this entry, please create a rejection workflow or contact an administrator.');
        return;
      }
      
      setShowRejectModal(null);
      setRejectionReason('');
      
      // Reload approvals
      await loadApprovals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject item');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApprovals = approvals.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'approved':
        return cn(baseClasses, "bg-green-100 text-green-800");
      case 'rejected':
        return cn(baseClasses, "bg-red-100 text-red-800");
      case 'cancelled':
        return cn(baseClasses, "bg-gray-100 text-gray-800");
      case 'pending':
      default:
        return cn(baseClasses, "bg-yellow-100 text-yellow-800");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="h-4 w-4" />;
      case 'expense':
        return <CreditCard className="h-4 w-4" />;
      case 'workflow':
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue':
        return 'text-green-600 bg-green-100';
      case 'expense':
        return 'text-red-600 bg-red-100';
      case 'workflow':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
              <p className="text-muted-foreground mt-1">Manage pending approvals and review history</p>
            </div>
            <Button onClick={loadApprovals} variant="secondary" disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search approvals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="workflow">Workflow</option>
            </select>
          </div>
        </div>

        {/* Approvals List */}
        <div className="bg-card rounded-lg border border-border">
          {filteredApprovals.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No approvals found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredApprovals.map((item) => (
                <div key={`${item.type}-${item.id}`} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("p-2 rounded-md", getTypeColor(item.type))}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                        <span className={getStatusBadge(item.status)}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="capitalize">{item.type}</span>
                        {item.amount !== undefined && (
                          <span className="font-medium text-foreground">
                            ${item.amount.toLocaleString()}
                          </span>
                        )}
                        <span>
                          {new Date(item.created_at).toLocaleDateString()} at{' '}
                          {new Date(item.created_at).toLocaleTimeString()}
                        </span>
                        {item.approved_at && (
                          <span className="text-green-600">
                            Approved: {new Date(item.approved_at).toLocaleDateString()}
                          </span>
                        )}
                        {item.rejection_reason && (
                          <span className="text-red-600">
                            Reason: {item.rejection_reason}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {item.status === 'pending' && canApproveTransactions() && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(item)}
                            disabled={processingId === item.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setShowRejectModal(item.id)}
                            disabled={processingId === item.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (item.type === 'revenue') {
                            router.push(`/revenue/${item.revenue_entry_id}`);
                          } else if (item.type === 'expense') {
                            router.push(`/expenses/${item.expense_entry_id}`);
                          } else {
                            router.push(`/approvals/${item.workflow_id}`);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Reject Approval</h3>
              <div className="mb-4">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={4}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const item = approvals.find(a => a.id === showRejectModal);
                    if (item) {
                      handleReject(item, rejectionReason);
                    }
                  }}
                  disabled={!rejectionReason.trim() || processingId !== null}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

