'use client';
import { useState } from 'react';
import { css } from './css';
import { useReducedMotion } from './useReducedMotion';

/**
 * Element wrapper that applies `hover`/`focus` CSS strings on top of the base
 * `style` string — the React equivalent of style-hover / style-focus.
 *
 *   <FX as="button" style="…" hover="color:#C2A56B;" onClick={fn}>Book</FX>
 *
 * On touch devices the `hover` style is reused as a press state (via touch
 * events) so taps give visual feedback. Respects prefers-reduced-motion by
 * dropping transform-based movement from the applied states.
 */
export function FX({ as = 'div', style, hover, focus, children, ...rest }) {
  const reduced = useReducedMotion();
  const [isHover, setHover] = useState(false);
  const [isFocus, setFocus] = useState(false);
  const Tag = as;

  // When reduced-motion is on, keep color/shadow changes but drop movement.
  const applied = (str) => {
    const obj = css(str);
    if (reduced && obj && 'transform' in obj) {
      const { transform, ...rest } = obj; // eslint-disable-line @typescript-eslint/no-unused-vars
      return rest;
    }
    return obj;
  };

  const merged = {
    ...css(style),
    ...(isHover ? applied(hover) : null),
    ...(isFocus ? applied(focus) : null),
  };

  const handlers = {};
  if (hover) {
    handlers.onMouseEnter = (e) => { setHover(true); rest.onMouseEnter?.(e); };
    handlers.onMouseLeave = (e) => { setHover(false); rest.onMouseLeave?.(e); };
    // Touch: reuse the hover style as a brief pressed state for mobile feedback.
    handlers.onTouchStart = (e) => { setHover(true); rest.onTouchStart?.(e); };
    handlers.onTouchEnd = (e) => { setHover(false); rest.onTouchEnd?.(e); };
    handlers.onTouchCancel = (e) => { setHover(false); rest.onTouchCancel?.(e); };
  }
  if (focus) {
    handlers.onFocus = (e) => { setFocus(true); rest.onFocus?.(e); };
    handlers.onBlur = (e) => { setFocus(false); rest.onBlur?.(e); };
  }

  return (
    <Tag {...rest} {...handlers} style={merged}>
      {children}
    </Tag>
  );
}
