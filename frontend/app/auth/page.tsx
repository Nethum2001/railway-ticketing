import { Suspense } from 'react';
import { AuthPageClient } from './AuthPageClient';

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f6fb]" />}>
      <AuthPageClient />
    </Suspense>
  );
}