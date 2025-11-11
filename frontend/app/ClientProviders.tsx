// app/ClientProviders.tsx (New file - marked as 'use client' to handle hooks and QueryClient safely)

'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function ZustandProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ZustandProvider>
        {children}
        <Toaster position="top-right" />
      </ZustandProvider>
    </QueryClientProvider>
  );
}