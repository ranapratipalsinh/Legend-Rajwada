/**
 * Generic, framework-agnostic helpers shared by every other module in the
 * theme. Nothing in this file knows about Shopify, sections, or the DOM
 * structure of any specific component.
 */

export function debounce(fn, wait = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function throttle(fn, wait = 150) {
  let waiting = false;
  return (...args) => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    setTimeout(() => { waiting = false; }, wait);
  };
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Watches a media query and calls `callback(matches)` immediately and on
 * every change. Returns an unsubscribe function.
 */
export function onBreakpointChange(query, callback) {
  const mql = window.matchMedia(query);
  const handler = (event) => callback(event.matches);
  handler(mql);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}

export function dispatch(element, name, detail = {}) {
  element.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

/**
 * Loads a classic (non-module) script exactly once and resolves when it has
 * executed. Used to lazy-load vendor libraries (GSAP, Lenis, Swiper) only
 * when a component actually needs them, keeping them off the critical path.
 */
const loadedScripts = new Map();
export function loadScript(src) {
  if (!src) return Promise.reject(new Error('loadScript: no src provided'));
  if (loadedScripts.has(src)) return loadedScripts.get(src);

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}

const loadedStyles = new Set();
export function loadStyle(href) {
  if (!href || loadedStyles.has(href)) return;
  loadedStyles.add(href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Confines Tab/Shift+Tab focus to `container` (a drawer, modal, or search
 * overlay). Returns a release function that restores normal tab order.
 */
export function trapFocus(container, initialFocus) {
  const focusable = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return () => {};

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKeydown(event) {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', handleKeydown);
  (initialFocus || first).focus();

  return () => container.removeEventListener('keydown', handleKeydown);
}
