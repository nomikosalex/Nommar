'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ANIMATION } from '@/lib/animation.config';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { css } from '@/lib/css';

/**
 * Fades + slides children in once they scroll into view (cross-browser).
 *
 *   <Reveal><section>…</section></Reveal>
 *   <Reveal delay={0.1} direction="left" style="display:flex;">…</Reveal>
 */
export function Reveal({ children, delay = 0, direction = 'up', style, className }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: ANIMATION.reveal.once, margin: ANIMATION.reveal.margin });

  const offset = {
    up: { y: ANIMATION.reveal.y },
    down: { y: -ANIMATION.reveal.y },
    left: { x: ANIMATION.reveal.y },
    right: { x: -ANIMATION.reveal.y },
  }[direction];

  const styleObj = css(style);

  if (reduced) {
    return (
      <div ref={ref} className={className} style={styleObj}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={styleObj}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: ANIMATION.duration.slow, delay, ease: ANIMATION.ease.default }}
    >
      {children}
    </motion.div>
  );
}
