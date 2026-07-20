/**
 * Drives the header's scroll-reactive states (see sections/header.liquid's
 * schema: header_style, sticky_header). Reads its configuration from data
 * attributes rather than duplicating settings.* logic in JS — Liquid
 * decides what's enabled, this file only reacts to scroll.
 *
 * States, applied as attributes so assets/... CSS (co-located in
 * sections/header.liquid) can react purely with selectors:
 *  - [data-scrolled="true"]  — past the transparent → solid threshold
 *  - [data-hidden="true"]    — scrolled down past the header's own height
 *                               (sticky mode only, desktop/tablet only —
 *                               "always visible on mobile" is enforced here,
 *                               not left to chance in CSS)
 *
 * Also keeps the header's cart count badge in sync with assets/cart.js's
 * `cart:updated` event, since the badge is rendered once, server-side, on
 * page load and never re-rendered by Liquid after that.
 */
import { throttle, onBreakpointChange } from './utils.js';

export default function header(el) {
  const isTransparent = el.dataset.style === 'transparent';
  const isSticky = el.dataset.sticky === 'true';
  let allowHide = false;
  let lastScrollY = window.scrollY;

  function updateScrolled() {
    if (!isTransparent) return;
    const scrolled = window.scrollY > el.offsetHeight;
    el.setAttribute('data-scrolled', scrolled);
  }

  function updateVisibility() {
    if (!isSticky || !allowHide) {
      el.removeAttribute('data-hidden');
      lastScrollY = window.scrollY;
      return;
    }
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY;
    const pastHeader = currentScrollY > el.offsetHeight;
    el.setAttribute('data-hidden', Boolean(scrollingDown && pastHeader));
    lastScrollY = currentScrollY;
  }

  const handleScroll = throttle(() => {
    updateScrolled();
    updateVisibility();
  }, 100);

  window.addEventListener('scroll', handleScroll, { passive: true });
  const stopWatchingBreakpoint = onBreakpointChange('(min-width: 990px)', (matches) => {
    allowHide = matches;
    updateVisibility();
  });
  updateScrolled();

  function handleCartUpdated(event) {
    const badge = el.querySelector('[data-cart-count]');
    if (!badge) return;
    const count = event.detail.cart.item_count;
    badge.textContent = count;
    badge.hidden = count === 0;
  }
  document.addEventListener('cart:updated', handleCartUpdated);

  return () => {
    window.removeEventListener('scroll', handleScroll);
    stopWatchingBreakpoint();
    document.removeEventListener('cart:updated', handleCartUpdated);
  };
}
