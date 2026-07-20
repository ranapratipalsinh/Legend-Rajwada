/**
 * Smooth-scroll capability, powered by Lenis.
 *
 * Lenis itself is NOT vendored in this repo. Add it by downloading the
 * package build and saving it — unmodified — as assets/vendor-lenis.js
 * (e.g. `node_modules/lenis/dist/lenis.min.js`, which attaches `window.Lenis`).
 * Shopify's assets/ directory does not support subfolders, so the flat name
 * is intentional, not a shortcut.
 *
 * Nothing calls initSmoothScroll() yet — that happens once a real layout
 * exists to test it against. This file only defines the capability.
 */
import { loadScript } from './utils.js';
import { isMotionEnabled } from './motion-preference.js';

let instance = null;

export async function initSmoothScroll() {
  if (instance) return instance;
  if (!isMotionEnabled()) return null;
  if (!window.theme?.assets?.lenis) {
    console.warn('[scroll] window.theme.assets.lenis is not defined — skipping smooth scroll.');
    return null;
  }

  await loadScript(window.theme.assets.lenis);
  if (!window.Lenis) {
    console.warn('[scroll] vendor-lenis.js loaded but window.Lenis was not found.');
    return null;
  }

  instance = new window.Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  function raf(time) {
    instance.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  return instance;
}

export function getSmoothScroll() {
  return instance;
}

/** Temporarily hands scroll control back to the browser — call before
 *  opening a modal/drawer that manages its own scroll lock. */
export function pauseSmoothScroll() {
  instance?.stop();
}

export function resumeSmoothScroll() {
  instance?.start();
}
