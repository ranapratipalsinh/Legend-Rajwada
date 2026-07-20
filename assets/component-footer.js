/**
 * Two small jobs, matched to `data-component="footer"`:
 *
 *  1. Mobile accordion toggling for the Navigation/Collections columns
 *     (a plain click delegate + a CSS grid-template-rows transition —
 *     no library needed, same technique as the mobile nav drawer).
 *  2. A single GSAP touch: staggering the social icons in on scroll,
 *     via the existing staggerChildren() primitive from assets/motion.js.
 *
 * Everything else in this footer (brand column fade, contact fade,
 * heading reveal) runs on the free [data-reveal] contract already wired
 * globally — GSAP is reserved for the one moment a handful of small icons
 * benefit from a coordinated entrance, not used as a blanket default.
 */
import { staggerChildren } from './motion.js';
import { isMotionEnabled } from './motion-preference.js';

export default function footer(el) {
  function handleClick(event) {
    const trigger = event.target.closest('[data-accordion-trigger]');
    if (!trigger) return;
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!isOpen));
    panel.classList.toggle('is-open', !isOpen);
  }
  el.addEventListener('click', handleClick);

  const animationsEnabled = el.dataset.animations === 'true' && isMotionEnabled();
  if (animationsEnabled) {
    const social = el.querySelector('[data-footer-social]');
    if (social) staggerChildren(social, { amount: 0.2, y: 8 });
  }

  return () => {
    el.removeEventListener('click', handleClick);
  };
}
