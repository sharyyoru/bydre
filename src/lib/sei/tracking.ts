'use client';

export type EventType =
  | 'page_view'
  | 'scroll_depth'
  | 'video_play'
  | 'video_progress'
  | 'video_pause'
  | 'video_complete'
  | 'cta_click'
  | 'form_start'
  | 'form_submit'
  | 'modal_open'
  | 'modal_close'
  | 'section_view';

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

export async function trackEvent(
  eventType: EventType,
  eventData?: EventData
): Promise<void> {
  // Simplified tracking - logs to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('SEI Track:', eventType, eventData);
  }
}

export function trackPageView(): void {
  trackEvent('page_view', {
    title: document.title,
    path: window.location.pathname,
  });
}

export function trackScrollDepth(depth: number): void {
  trackEvent('scroll_depth', { depth });
}

export function trackVideoEvent(
  action: 'play' | 'pause' | 'progress' | 'complete',
  progress?: number
): void {
  const eventType: EventType =
    action === 'play'
      ? 'video_play'
      : action === 'pause'
      ? 'video_pause'
      : action === 'complete'
      ? 'video_complete'
      : 'video_progress';

  trackEvent(eventType, { progress });
}

export function trackCTAClick(ctaName: string, section?: string): void {
  trackEvent('cta_click', { cta_name: ctaName, section });
}

export function trackFormStart(): void {
  trackEvent('form_start');
}

export function trackFormSubmit(success: boolean): void {
  trackEvent('form_submit', { success });
}

export function trackModalOpen(modalName: string): void {
  trackEvent('modal_open', { modal_name: modalName });
}

export function trackSectionView(sectionName: string): void {
  trackEvent('section_view', { section_name: sectionName });
}
