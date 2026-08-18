'use client';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { CONFIG } from '@/lib/site.config';

// Soft champagne-gold glow that drifts toward the cursor on desktop only.
// Direct DOM style writes (no React state per move) + rAF throttling keep
// this cheap; a low-opacity soft-light blend warms the ivory background
// instead of sitting on top of it like a visible UI element. Off for touch
// pointers, prefers-reduced-motion, and the site-wide CONFIG.enableMotion
// kill switch.
export default function CursorGlow() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [pointerOk, setPointerOk] = useState(false);

  useEffect(() => {
    setPointerOk(window.matchMedia('(pointer: fine)').matches);
  }, []);

  const enabled = CONFIG.enableMotion && !reduced && pointerOk;

  useEffect(() => {
    if (!enabled) return;
    let raf = null;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    const apply = () => {
      raf = null;
      ref.current?.style.setProperty('--x', `${x}px`);
      ref.current?.style.setProperty('--y', `${y}px`);
    };
    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (raf === null) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        pointerEvents: 'none',
        mixBlendMode: 'soft-light',
        background: 'radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(194,165,107,0.55), transparent 70%)',
      }}
    />
  );
}
