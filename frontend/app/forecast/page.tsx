'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForecastPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/forecast/list');
  }, [router]);
  
  return null;
}

