'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ANIMATION } from '@/lib/animation.config';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { css } from '@/lib/css';

/**
 * Scroll-linked parallax drift for hero / banner imagery. The inner layer is
 * taller than the clipping container so the drift never exposes an edge.
 *
 *   <Parallax style="position:relative;overflow:hidden;min-height:46vh;">
 *     <Placeholder … />
 *   </Parallax>
 */
export function Parallax({ children, style }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const drift = ANIMATION.parallax.drift;

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-drift, drift]);

  const containerStyle = { position: 'relative', overflow: 'hidden', ...css(style) };

  if (reduced) {
    return (
      <div ref={ref} style={containerStyle}>
        <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      </div>
    );
  }

  return (
    <div ref={ref} style={containerStyle}>
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: -drift,
          height: `calc(100% + ${drift * 2}px)`,
          y,
          willChange: 'transform',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
