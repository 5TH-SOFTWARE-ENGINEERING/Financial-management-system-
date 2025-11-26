'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FinancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/finance/list');
  }, [router]);

  return null;
}

