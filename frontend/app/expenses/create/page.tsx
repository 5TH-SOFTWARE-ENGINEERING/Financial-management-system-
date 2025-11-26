'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseSchema, type ExpenseInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      isRecurring: false,
    },
  });

  const isRecurring = watch('isRecurring');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Format date for API
      const expenseDate = new Date(data.date).toISOString();
      
      const expenseData = {
        title: data.title,
        description: data.description,
        amount: data.amount,
        category: data.category,
        vendor: data.vendor || null,
        date: expenseDate,
        is_recurring: data.isRecurring || false,
        recurring_frequency: data.isRecurring ? data.recurringFrequency : null,
        attachment_url: data.attachmentUrl || null,
      };

      await apiClient.createExpense(expenseData);
      setSuccess('Expense created successfully!');
      toast.success('Expense created successfully!');
      reset();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/expenses/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Create Expense</h1>
        </div>
        <p className="text-muted-foreground">Add a new expense entry</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Office Supplies"
              disabled={loading}
              className="mt-1"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the expense"
              disabled={loading}
              className="mt-1"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder="e.g., Office, Travel, Utilities"
                disabled={loading}
                className="mt-1"
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
                className="mt-1"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="vendor">Vendor (Optional)</Label>
            <Input
              id="vendor"
              {...register('vendor')}
              placeholder="Vendor name"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              disabled={loading}
              className="mt-1"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message as string}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isRecurring"
              type="checkbox"
              {...register('isRecurring')}
              disabled={loading}
              className="h-4 w-4"
            />
            <Label htmlFor="isRecurring" className="cursor-pointer">
              Recurring expense
            </Label>
          </div>

          {isRecurring && (
            <div>
              <Label htmlFor="recurringFrequency">Recurring Frequency *</Label>
              <select
                id="recurringFrequency"
                {...register('recurringFrequency')}
                disabled={loading}
                className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select frequency</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              {errors.recurringFrequency && (
                <p className="mt-1 text-sm text-red-600">{errors.recurringFrequency.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="attachmentUrl">Attachment URL (Optional)</Label>
            <Input
              id="attachmentUrl"
              type="url"
              {...register('attachmentUrl')}
              placeholder="https://example.com/receipt.pdf"
              disabled={loading}
              className="mt-1"
            />
            {errors.attachmentUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.attachmentUrl.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/expenses/list')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Expense'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
