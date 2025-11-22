'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateExpenseForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ExpenseSchema),
  });

  return (
    <form onSubmit={handleSubmit((d) => console.log(d))} className="space-y-6">
      <div>
        <Label>Amount</Label>
        <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Description</Label>
        <Input {...register('description')} />
      </div>
      <Button type="submit">Add Expense</Button>
    </form>
  );
}