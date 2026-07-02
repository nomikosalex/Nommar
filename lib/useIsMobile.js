'use client';
import { useEffect, useState } from 'react';

// True below the given breakpoint (default 880px, matching the nav layout).
export function useIsMobile(breakpoint = 880) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}
