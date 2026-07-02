'use client';
import { useState } from 'react';
import { css } from './css';

/**
 * Element wrapper that applies `hover`/`focus` CSS strings on top of the base
 * `style` string — the React equivalent of style-hover / style-focus.
 *
 *   <FX as="button" style="…" hover="color:#C2A56B;" onClick={fn}>Book</FX>
 */
export function FX({ as = 'div', style, hover, focus, children, ...rest }) {
  const [isHover, setHover] = useState(false);
  const [isFocus, setFocus] = useState(false);
  const Tag = as;

  const merged = {
    ...css(style),
    ...(isHover ? css(hover) : null),
    ...(isFocus ? css(focus) : null),
  };

  const handlers = {};
  if (hover) {
    handlers.onMouseEnter = (e) => { setHover(true); rest.onMouseEnter?.(e); };
    handlers.onMouseLeave = (e) => { setHover(false); rest.onMouseLeave?.(e); };
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
