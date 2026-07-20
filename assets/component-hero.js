/**
 * The hero's page-load timeline and scroll parallax. Matched to
 * `data-component="hero"` on sections/hero.liquid's root element.
 *
 * Every animated element starts fully visible in plain CSS (see the
 * section's stylesheet — there is no opacity: 0 baked in). GSAP's
 * `.from()` sets the "before" state itself, at the moment the timeline is
 * built, and only once this file has confirmed animations are actually
 * allowed. A visitor with JavaScript disabled, GSAP failing to load, or
 * reduced motion requested simply sees the finished hero immediately —
 * content is never hidden behind a script that might not run.
 */
import { loadGsap } from './motion.js';
import { isMotionEnabled } from './motion-preference.js';

export default async function hero(el) {
  const scrollButton = el.querySelector('[data-hero-scroll]');

  function scrollToNext() {
    const next = el.nextElementSibling;
    (next || el).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (scrollButton) scrollButton.addEventListener('click', scrollToNext);

  const teardownClick = () => {
    if (scrollButton) scrollButton.removeEventListener('click', scrollToNext);
  };

  const animationsEnabled = el.dataset.animations === 'true' && isMotionEnabled();
  if (!animationsEnabled) return teardownClick;

  const gsap = await loadGsap({ scrollTrigger: true });
  if (!gsap) return teardownClick;

  const media = el.querySelector('[data-hero-media]');
  const words = el.querySelectorAll('.hero__word > span');
  const subheadline = el.querySelector('[data-hero-subheadline]');
  const cta = el.querySelector('[data-hero-cta]');

  const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });

  if (media) timeline.from(media, { scale: 1.08, opacity: 0, duration: 1.2 });
  if (words.length) {
    timeline.from(words, { yPercent: 100, opacity: 0, duration: 0.7, stagger: 0.06 }, media ? '-=0.7' : 0);
  }
  if (subheadline) timeline.from(subheadline, { y: 16, opacity: 0, duration: 0.6 }, '-=0.35');
  if (cta) timeline.from(cta, { y: 16, opacity: 0, duration: 0.6 }, '-=0.4');
  if (scrollButton) {
    timeline.from(scrollButton, { opacity: 0, duration: 0.5 }, '-=0.2');
    timeline.call(() => scrollButton.setAttribute('data-bounce', ''));
  }

  let scrollTrigger = null;
  if (media) {
    const tween = gsap.to(media, {
      yPercent: 10,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
    });
    scrollTrigger = tween.scrollTrigger;
  }

  return () => {
    teardownClick();
    timeline.kill();
    if (scrollTrigger) scrollTrigger.kill();
  };
}
