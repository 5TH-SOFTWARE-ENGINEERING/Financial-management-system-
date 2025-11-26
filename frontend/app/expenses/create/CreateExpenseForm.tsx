'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api';

type ExpenseFormValues = {
  title: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  vendor?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  attachmentUrl?: string;
};

export function CreateExpenseForm() {
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      isRecurring: false,
    },
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    setMessage(null);
    try {
      const parsed = ExpenseSchema.parse(data);
      const expenseDate = new Date(parsed.date).toISOString();
      await apiClient.createExpense({
        title: parsed.title,
        description: parsed.description,
        amount: parsed.amount,
        category: parsed.category,
        vendor: parsed.vendor || undefined,
        date: expenseDate,
        is_recurring: !!parsed.isRecurring,
        recurring_frequency: parsed.recurringFrequency || undefined,
      });
      setMessage('Expense created successfully');
      reset();
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to create expense');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {message && (
        <div className="text-sm text-muted-foreground">{message}</div>
      )}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" {...register('category')} />
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>
      <div>
        <Label htmlFor="vendor">Vendor</Label>
        <Input id="vendor" {...register('vendor')} />
      </div>
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register('date')} />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message as string}</p>}
      </div>
      <div className="flex items-center space-x-2">
        <input id="isRecurring" type="checkbox" {...register('isRecurring')} />
        <Label htmlFor="isRecurring">Recurring expense</Label>
      </div>
      {watch('isRecurring') && (
        <div>
          <Label htmlFor="recurringFrequency">Recurring frequency</Label>
          <Input id="recurringFrequency" list="frequencyOptions" {...register('recurringFrequency')} />
          <datalist id="frequencyOptions">
            <option value="monthly" />
            <option value="quarterly" />
            <option value="yearly" />
          </datalist>
        </div>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Add Expense'}
      </Button>
    </form>
  );
}