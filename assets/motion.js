/**
 * Scroll and reveal motion.
 *
 * Two tiers, on purpose:
 *  - `initBasicReveals()` — native IntersectionObserver, zero dependencies,
 *    drives the [data-reveal]/[data-reveal-text] contract from
 *    assets/animations.css. Safe to call on every page.
 *  - GSAP-powered primitives (`revealOnScroll`, `staggerChildren`,
 *    `killScrollTriggers`) — for orchestration a CSS transition can't do
 *    (scrubbed timelines, pinning). Only loaded the first time a component
 *    actually calls one of them.
 *
 * GSAP itself is NOT vendored in this repo — add the real, unmodified
 * builds as assets/vendor-gsap.js (window.gsap) and
 * assets/vendor-gsap-scrolltrigger.js (window.ScrollTrigger), downloaded
 * from the official gsap package. Nothing in this file invents that code.
 *
 * No component calls any of this yet — it is a capability layer, ready for
 * the sections built in a later phase to opt into.
 */
import { loadScript } from './utils.js';
import { isMotionEnabled } from './motion-preference.js';

let gsapPromise = null;

/**
 * Loads GSAP (and, optionally, ScrollTrigger) exactly once and returns the
 * `gsap` global — the public entry point for any component that needs a
 * custom timeline beyond what `revealOnScroll`/`staggerChildren` express
 * (e.g. sections/hero.liquid's page-load sequence). Callers still own
 * their own reduced-motion check via isMotionEnabled() before calling
 * this, since "should GSAP load at all" and "build the timeline" are
 * different decisions.
 */
export async function loadGsap(options) {
  return ensureGsap(options);
}

async function ensureGsap({ scrollTrigger = false } = {}) {
  if (!window.theme?.assets?.gsap) {
    console.warn('[motion] window.theme.assets.gsap is not defined.');
    return null;
  }
  if (!gsapPromise) {
    gsapPromise = loadScript(window.theme.assets.gsap).then(() => window.gsap);
  }
  const gsap = await gsapPromise;
  if (scrollTrigger && gsap && !gsap.core?.globals?.().ScrollTrigger) {
    if (window.theme.assets.gsapScrollTrigger) {
      await loadScript(window.theme.assets.gsapScrollTrigger);
      if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    }
  }
  return gsap;
}

/** Native, dependency-free reveal-on-scroll for [data-reveal] and
 *  [data-reveal-text]. Call once on page load. */
export function initBasicReveals(root = document) {
  if (!('IntersectionObserver' in window)) {
    root.querySelectorAll('[data-reveal], [data-reveal-text]').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  root.querySelectorAll('[data-reveal-text]').forEach(splitIntoLines);

  const motionOn = isMotionEnabled();
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!motionOn) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
          return;
        }
        const group = entry.target.querySelectorAll('[data-reveal-child]');
        group.forEach((child, index) => child.style.setProperty('--reveal-index', index));
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  root.querySelectorAll('[data-reveal], [data-reveal-text]').forEach((el) => observer.observe(el));
  return observer;
}

/** Groups the words of an element into per-visual-line <span> wrappers so
 *  assets/animations.css can reveal a heading line by line. Idempotent. */
function splitIntoLines(el) {
  if (el.dataset.splitDone) return;
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  const wordSpans = words.map((word, index) => {
    const span = document.createElement('span');
    span.textContent = word + (index < words.length - 1 ? ' ' : '');
    el.appendChild(span);
    return span;
  });

  const lines = [];
  let currentTop = null;
  let currentLine = null;
  wordSpans.forEach((span) => {
    const top = span.offsetTop;
    if (top !== currentTop) {
      currentLine = document.createElement('span');
      currentLine.className = 'line';
      lines.push(currentLine);
      currentTop = top;
    }
    currentLine.appendChild(span);
  });

  el.textContent = '';
  lines.forEach((line, index) => {
    const wrapped = document.createElement('span');
    wrapped.textContent = line.textContent;
    line.textContent = '';
    line.appendChild(wrapped);
    line.style.setProperty('--reveal-index', index);
    el.appendChild(line);
  });
  el.dataset.splitDone = 'true';
}

/** GSAP-powered scroll reveal for cases the CSS contract can't express
 *  (parallax offsets, scrubbed progress). Example future usage:
 *  `revealOnScroll(el, { y: 40, scrub: true })`. */
export async function revealOnScroll(target, { y = 24, duration, ease, scrub = false } = {}) {
  if (!isMotionEnabled()) return null;
  const gsap = await ensureGsap({ scrollTrigger: true });
  if (!gsap) return null;

  const styles = getComputedStyle(document.documentElement);
  return gsap.from(target, {
    y,
    opacity: 0,
    duration: duration || parseFloat(styles.getPropertyValue('--duration-slow')) / 1000 || 0.7,
    ease: ease || 'power2.out',
    scrollTrigger: { trigger: target, start: 'top 85%', scrub },
  });
}

export async function staggerChildren(parent, { amount = 0.3, y = 16 } = {}) {
  if (!isMotionEnabled()) return null;
  const gsap = await ensureGsap({ scrollTrigger: true });
  if (!gsap) return null;
  return gsap.from(parent.children, {
    y,
    opacity: 0,
    stagger: amount / Math.max(parent.children.length, 1),
    scrollTrigger: { trigger: parent, start: 'top 85%' },
  });
}

export async function killScrollTriggers() {
  if (!window.ScrollTrigger) return;
  window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}
