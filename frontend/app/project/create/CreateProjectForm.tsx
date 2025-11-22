'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateProjectForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(CreateProjectSchema),
  });

  return (
    <form onSubmit={handleSubmit((d) => console.log(d))} className="space-y-6">
      <div>
        <Label>Project Name</Label>
        <Input {...register('name')} />
      </div>
      <div>
        <Label>Department ID</Label>
        <Input {...register('departmentId')} />
      </div>
      <Button type="submit">Create Project</Button>
    </form>
  );
}