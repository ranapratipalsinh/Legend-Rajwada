/**
 * Brand Story's one GSAP-dependent behaviour: the image's entrance scale
 * and scroll parallax. Everything else in this section — the heading's
 * line reveal, the subheading/story/quote/CTA fade-up — uses the free,
 * dependency-free [data-reveal]/[data-reveal-text] contract from
 * assets/animations.css, already wired up globally by assets/theme.js.
 * GSAP only loads here because scroll-scrubbed parallax is the one effect
 * that contract can't express — every other section reveal on this page
 * stays at zero extra JavaScript cost.
 */
import { loadGsap } from './motion.js';
import { isMotionEnabled } from './motion-preference.js';

export default async function brandStory(el) {
  const image = el.querySelector('[data-brand-story-image]');
  if (!image) return;

  const animationsEnabled = el.dataset.animations === 'true' && isMotionEnabled();
  if (!animationsEnabled) return;

  const gsap = await loadGsap({ scrollTrigger: true });
  if (!gsap) return;

  const reveal = gsap.fromTo(
    image,
    { scale: 1.08, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 75%' },
    }
  );

  const parallax = gsap.to(image, {
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
