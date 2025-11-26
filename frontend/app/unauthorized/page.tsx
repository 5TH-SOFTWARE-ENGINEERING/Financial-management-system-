'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, ArrowLeft, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-6">
            <ShieldOff className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Access Denied
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
            <AlertCircle className="h-5 w-5" />
            <p className="text-lg">
              You do not have permission to access this page.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 mb-8 shadow-sm">
          <div className="space-y-4 text-left">
            <div>
              <h2 className="font-semibold text-foreground mb-2">What happened?</h2>
              <p className="text-muted-foreground">
                You tried to access a page or resource that requires specific permissions. 
                Your current role may not have the necessary access rights.
              </p>
            </div>

            {user && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Current User:</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{user.name || user.email}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-semibold text-foreground mb-2">What can you do?</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                <li>Contact your administrator to request access</li>
                <li>Verify that you're logged in with the correct account</li>
                <li>Return to the dashboard and navigate to accessible pages</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={handleGoHome}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
          {!isAuthenticated && (
            <Link href="/auth/login">
              <Button variant="secondary" className="flex items-center gap-2">
                Go to Login
              </Button>
            </Link>
          )}
        </div>

        {isAuthenticated && (
          <div className="mt-8 text-sm text-muted-foreground">
            <p>
              If you believe this is an error, please contact your system administrator 
              or submit a support request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
