'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccountantsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/accountants/list');
  }, [router]);

  return null;
}