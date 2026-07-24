'use client';
import { useEffect } from 'react';
import { captureFirstTouch } from '@/lib/attribution';

// Records first-touch marketing attribution once per landing (30-day window).
// Renders nothing; mounted only in the marketing shell (never /admin).
export default function AttributionCapture() {
  useEffect(() => {
    captureFirstTouch();
  }, []);
  return null;
}
