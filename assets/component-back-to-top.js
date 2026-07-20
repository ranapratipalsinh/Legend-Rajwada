/**
 * Shows the back-to-top button once the visitor has scrolled past one
 * viewport height, and scrolls to top on click. Matched by
 * `data-component="back-to-top"` — see snippets/theme-overlays.liquid.
 */
import { throttle, prefersReducedMotion } from './utils.js';
import { getSmoothScroll } from './scroll.js';

export default function backToTop(el) {
  function handleScroll() {
    el.classList.toggle('is-visible', window.scrollY > window.innerHeight);
  }

  function handleClick() {
    const lenis = getSmoothScroll();
    if (lenis) {
      lenis.scrollTo(0);
      return;
    }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  const throttledScroll = throttle(handleScroll, 150);
  window.addEventListener('scroll', throttledScroll, { passive: true });
  el.addEventListener('click', handleClick);
  handleScroll();

  return () => {
    window.removeEventListener('scroll', throttledScroll);
    el.removeEventListener('click', handleClick);
  };
}
