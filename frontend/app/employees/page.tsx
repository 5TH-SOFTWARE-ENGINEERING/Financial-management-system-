'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employees/list');
  }, [router]);

  return null;
}

