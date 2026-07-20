/**
 * Signature Collection's one GSAP-dependent behaviour: each panel's image
 * entrance scale and scroll parallax, applied per panel since a section
 * can hold several collection-panel blocks. Everything else — the section
 * intro's and each heading's line reveal, the description/quote/CTA
 * fade-up — runs on the free [data-reveal]/[data-reveal-text] contract
 * already wired globally, and each panel's hover zoom reuses the existing
 * [data-media-zoom] CSS rule. GSAP only loads if the section is actually
 * allowed to animate.
 */
import { loadGsap } from './motion.js';
import { isMotionEnabled } from './motion-preference.js';

export default async function signatureCollection(el) {
  const images = el.querySelectorAll('[data-panel-image]');
  if (!images.length) return;

  const animationsEnabled = el.dataset.animations === 'true' && isMotionEnabled();
  if (!animationsEnabled) return;

  const gsap = await loadGsap({ scrollTrigger: true });
  if (!gsap) return;

  const triggers = [];
  images.forEach((image) => {
    const reveal = gsap.fromTo(
      image,
      { scale: 1.08, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: image, start: 'top 80%' },
      }
    );
    const parallax = gsap.to(image, {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    if (reveal.scrollTrigger) triggers.push(reveal.scrollTrigger);
    if (parallax.scrollTrigger) triggers.push(parallax.scrollTrigger);
  });

  return () => {
    triggers.forEach((trigger) => trigger.kill());
  };
}
