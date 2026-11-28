'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { LoadingState } from '../components/ui';
import { LandingPage } from '../components/landing/LandingPage';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const signedIn = isAuthenticated && Boolean(user);

  useEffect(() => {
    if (isLoading || !signedIn || !user) return;
    if (user.role === 'admin') {
      router.replace('/admin');
    } else if (user.role === 'brand') {
      router.replace('/brand/dashboard');
    } else {
      router.replace('/creator/home');
    }
  }, [isLoading, signedIn, user, router]);

  // A visitor who is not logged in sees the public landing page.
  if (!isLoading && !signedIn) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingState />
    </div>
  );
}
