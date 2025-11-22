'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDepartmentSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateDepartmentForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(CreateDepartmentSchema),
  });

  return (
    <form onSubmit={handleSubmit((d) => console.log(d))} className="space-y-6">
      <div>
        <Label>Name</Label>
        <Input {...register('name')} />
      </div>
      <div>
        <Label>Manager ID</Label>
        <Input {...register('managerId')} />
      </div>
      <Button type="submit">Create Department</Button>
    </form>
  );
}