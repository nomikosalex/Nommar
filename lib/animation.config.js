// All tweakable motion values live here — no magic numbers in components.
export const ANIMATION = {
  ease: {
    default: [0.25, 0.1, 0.25, 1.0],
    enter: [0.0, 0.0, 0.2, 1.0],
    exit: [0.4, 0.0, 1.0, 1.0],
  },
  duration: {
    fast: 0.2,
    normal: 0.6,
    slow: 0.9,
    max: 1.2, // never exceed
  },
  // Scroll-reveal defaults
  reveal: {
    y: 32,
    once: true,
    margin: '-80px',
  },
  // Subtle hero parallax (px the image drifts across its scroll range)
  parallax: {
    drift: 60,
  },
  // Lenis smooth scroll
  scroll: {
    lerp: 0.1,
    duration: 1.1,
    smoothWheel: true,
  },
};
