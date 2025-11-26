'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Expense {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  amount: number;
  vendor?: string | null;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string | null;
  is_approved: boolean;
}

export default function DeleteExpensePage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params?.id ? parseInt(params.id as string, 10) : null;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (expenseId) {
      loadExpense();
    }
  }, [expenseId]);

  const loadExpense = async () => {
    if (!expenseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getExpense(expenseId);
      const foundExpense = response.data;
      
      if (!foundExpense) {
        setError('Expense not found');
        return;
      }

      setExpense(foundExpense);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseId || !expense) return;

    if (!confirm(`Are you sure you want to delete "${expense.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiClient.deleteExpense(expenseId);
      toast.success('Expense deleted successfully!');
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push('/expenses/list');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading expense...</p>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/expenses/list"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Expenses
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2 text-red-700">
          <AlertTriangle size={16} />
          <span>{error || 'Expense not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/expenses/list"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Expenses
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-foreground">Delete Expense</h1>
        </div>
        <p className="text-muted-foreground">Confirm deletion of expense</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-red-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Are you sure you want to delete this expense?
            </h2>
            <p className="text-muted-foreground mb-4">
              This action cannot be undone. All data associated with this expense will be permanently deleted.
            </p>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-md mb-6">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-foreground">Title:</span>{' '}
              <span className="text-muted-foreground">{expense.title}</span>
            </div>
            {expense.description && (
              <div>
                <span className="font-medium text-foreground">Description:</span>{' '}
                <span className="text-muted-foreground">{expense.description}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Category:</span>{' '}
              <span className="text-muted-foreground capitalize">{expense.category}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Amount:</span>{' '}
              <span className="text-muted-foreground font-semibold">{formatCurrency(expense.amount)}</span>
            </div>
            {expense.vendor && (
              <div>
                <span className="font-medium text-foreground">Vendor:</span>{' '}
                <span className="text-muted-foreground">{expense.vendor}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Date:</span>{' '}
              <span className="text-muted-foreground">{formatDate(expense.date)}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Status:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs ${
                expense.is_approved 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {expense.is_approved ? 'Approved' : 'Pending'}
              </span>
              {expense.is_recurring && (
                <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  Recurring ({expense.recurring_frequency})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/expenses/list')}
            disabled={deleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Expense
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

