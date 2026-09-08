'use client';

import { useRef, useEffect } from 'react';
import { trackVideoEvent } from '@/lib/sei/tracking';

export function useVideoTracking(videoRef: React.RefObject<HTMLVideoElement | null>): void {
  const milestones = useRef<Set<number>>(new Set());
  const hasStarted = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (!hasStarted.current) {
        trackVideoEvent('play');
        hasStarted.current = true;
      }
    };

    const handlePause = () => {
      if (hasStarted.current) {
        const progress = Math.round((video.currentTime / video.duration) * 100);
        trackVideoEvent('pause', progress);
      }
    };

    const handleTimeUpdate = () => {
      if (!hasStarted.current) return;
      
      const progress = Math.round((video.currentTime / video.duration) * 100);
      const checkpoints = [25, 50, 75];

      checkpoints.forEach((checkpoint) => {
        if (progress >= checkpoint && !milestones.current.has(checkpoint)) {
          milestones.current.add(checkpoint);
          trackVideoEvent('progress', checkpoint);
        }
      });
    };

    const handleEnded = () => {
      trackVideoEvent('complete', 100);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef]);
}
