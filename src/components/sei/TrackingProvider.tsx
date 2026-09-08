'use client';

import { usePageTracking, useScrollTracking } from '@/hooks/sei/useTracking';

interface TrackingProviderProps {
  children: React.ReactNode;
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  usePageTracking();
  useScrollTracking();
  return <>{children}</>;
}
