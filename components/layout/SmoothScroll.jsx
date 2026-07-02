'use client';
import { useEffect, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { ANIMATION } from '@/lib/animation.config';
import { useReducedMotion } from '@/lib/useReducedMotion';

// App-wide smooth scroll. Disabled for reduced-motion users AND on touch/coarse
// pointers (iOS Safari etc.), where Lenis fights native momentum scrolling.
export function SmoothScroll({ children }) {
  const reduced = useReducedMotion();
  const [pointerOk, setPointerOk] = useState(false);

  useEffect(() => {
    setPointerOk(window.matchMedia('(pointer: fine)').matches);
  }, []);

  if (reduced || !pointerOk) return children;

  return (
    <ReactLenis
      root
      options={{ lerp: ANIMATION.scroll.lerp, duration: ANIMATION.scroll.duration, smoothWheel: ANIMATION.scroll.smoothWheel }}
    >
      {children}
    </ReactLenis>
  );
}
