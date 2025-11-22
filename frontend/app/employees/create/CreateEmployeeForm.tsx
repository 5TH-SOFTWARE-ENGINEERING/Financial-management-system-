'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateEmployeeForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: 'EMPLOYEE' },
  });

  const onSubmit = (data: any) => {
    console.log('Creating Employee:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <div>
        <Label>Full Name</Label>
        <Input {...register('full_name')} />
        {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" {...register('email')} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>
      <div>
        <Label>Username</Label>
        <Input {...register('username')} />
        {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" {...register('password')} />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full">Create Employee</Button>
    </form>
  );
}