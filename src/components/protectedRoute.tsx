'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/utils/authProvider';
import { useRouter } from 'next/navigation';
import { Spinner } from "@heroui/react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // for test
  const forceLoading = false;

  useEffect(() => {
    if (!loading && !forceLoading) {
      if (requireAuth && !user) {
        router.push(redirectTo);
      } else if (!requireAuth && user) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  if (loading || forceLoading) {
    return (
      <div className="min-h-screen bg-neutral-800 flex items-center justify-center">
        <Spinner classNames={{label: "text-xl text-white"}} variant="dots" size='lg' color='default' label='載入中...'/>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}
