'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RevenueSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateRevenueForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(RevenueSchema),
  });

  const onSubmit = (data: any) => {
    console.log('Revenue:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label>Amount</Label>
        <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
        {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
      </div>
      <div>
        <Label>Description</Label>
        <Input {...register('description')} />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>
      <Button type="submit">Add Revenue</Button>
    </form>
  );
}