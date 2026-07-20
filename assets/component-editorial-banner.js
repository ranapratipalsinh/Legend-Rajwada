/**
 * Editorial Banner's one GSAP-dependent behaviour: the media's entrance
 * scale and scroll parallax. The headline's line reveal and the
 * description/CTA fade-up run on the free [data-reveal]/[data-reveal-text]
 * contract already wired globally — this file only adds what that
 * contract can't express, exactly like Brand Story and Signature
 * Collection before it.
 */
import { loadGsap } from './motion.js';
import { isMotionEnabled } from './motion-preference.js';

export default async function editorialBanner(el) {
  const media = el.querySelector('[data-editorial-banner-media]');
  if (!media) return;

  const animationsEnabled = el.dataset.animations === 'true' && isMotionEnabled();
  if (!animationsEnabled) return;

  const gsap = await loadGsap({ scrollTrigger: true });
  if (!gsap) return;

  const reveal = gsap.fromTo(
    media,
    { scale: 1.08, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 80%' },
    }
  );

  const parallax = gsap.to(media, {
    yPercent: 8,
    ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
  });

  return () => {
    reveal.scrollTrigger?.kill();
    parallax.scrollTrigger?.kill();
    reveal.kill();
    parallax.kill();
  };
}
