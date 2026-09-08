'use client';

import { useEffect, useRef } from 'react';
import { trackPageView, trackScrollDepth, trackSectionView } from '@/lib/sei/tracking';

export function usePageTracking(): void {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      trackPageView();
      tracked.current = true;
    }
  }, []);
}

export function useScrollTracking(): void {
  const milestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;

      const checkpoints = [25, 50, 75, 100];
      checkpoints.forEach((checkpoint) => {
        if (scrolled >= checkpoint && !milestones.current.has(checkpoint)) {
          milestones.current.add(checkpoint);
          trackScrollDepth(checkpoint);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}

export function useSectionTracking(sectionName: string): (node: HTMLElement | null) => void {
  const tracked = useRef(false);

  return (node: HTMLElement | null) => {
    if (!node || tracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            trackSectionView(sectionName);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
  };
}
