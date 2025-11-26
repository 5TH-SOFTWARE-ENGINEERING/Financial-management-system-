'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RevenueSchema, type RevenueInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateRevenuePage() {
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
  } = useForm<RevenueInput>({
    resolver: zodResolver(RevenueSchema),
    defaultValues: {
      isRecurring: false,
      category: 'other' as const,
    },
  });

  const isRecurring = watch('isRecurring');

  const onSubmit = async (data: RevenueInput) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Format date for API
      const revenueDate = new Date(data.date).toISOString();
      
      const revenueData = {
        title: data.title,
        description: data.description || null,
        amount: data.amount,
        category: data.category,
        source: data.source || null,
        date: revenueDate,
        is_recurring: data.isRecurring || false,
        recurring_frequency: data.isRecurring ? data.recurringFrequency : null,
        attachment_url: data.attachmentUrl || null,
      };

      await apiClient.createRevenue(revenueData);
      setSuccess('Revenue entry created successfully!');
      toast.success('Revenue entry created successfully!');
      reset();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/revenue/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create revenue entry';
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
          href="/revenue/list"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Revenue
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Create Revenue Entry</h1>
        </div>
        <p className="text-muted-foreground">Add a new revenue entry</p>
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
              placeholder="e.g., Product Sales"
              disabled={loading}
              className="mt-1"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the revenue"
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
              <select
                id="category"
                {...register('category')}
                disabled={loading}
                className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="sales">Sales</option>
                <option value="services">Services</option>
                <option value="investment">Investment</option>
                <option value="rental">Rental</option>
                <option value="other">Other</option>
              </select>
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
            <Label htmlFor="source">Source (Optional)</Label>
            <Input
              id="source"
              {...register('source')}
              placeholder="e.g., Customer name or company"
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
              Recurring revenue
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
              placeholder="https://example.com/invoice.pdf"
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
              onClick={() => router.push('/revenue/list')}
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
                'Create Revenue Entry'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
