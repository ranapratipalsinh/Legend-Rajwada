/**
 * Single source of truth for "should decorative motion run at all".
 *
 * Two independent signals feed it:
 *  - the visitor's OS-level `prefers-reduced-motion`, which always wins
 *  - the merchant's "Enable decorative motion" theme setting, rendered
 *    server-side by layout/theme.liquid as `data-motion` on <html>
 *
 * Every module that drives JS-based motion (assets/scroll.js,
 * assets/motion.js, assets/carousel.js's autoplay) reads this instead of
 * checking matchMedia directly, so the two signals are only ever combined
 * in one place.
 */
import { prefersReducedMotion } from './utils.js';

export function isMotionEnabled() {
  if (prefersReducedMotion()) return false;
  return document.documentElement.getAttribute('data-motion') !== 'reduced';
}
