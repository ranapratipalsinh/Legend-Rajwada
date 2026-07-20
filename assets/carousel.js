/**
 * Carousel capability, powered by Swiper.
 *
 * Swiper is NOT vendored in this repo. Add the official build, unmodified,
 * as assets/vendor-swiper.js (window.Swiper) and assets/vendor-swiper.css
 * (downloaded from the swiper package's `swiper-bundle.min.js` /
 * `swiper-bundle.min.css`). Loaded on demand — a page with no carousel on
 * it never pays for Swiper's weight.
 *
 * No section calls this yet; it is the capability a future product-gallery
 * or lookbook-slider section will call with `initCarousel(el, options)`.
 */
import { loadScript, loadStyle } from './utils.js';
import { isMotionEnabled } from './motion-preference.js';

let swiperPromise = null;

function ensureSwiper() {
  if (!window.theme?.assets?.swiperJs) {
    console.warn('[carousel] window.theme.assets.swiperJs is not defined.');
    return Promise.resolve(null);
  }
  if (!swiperPromise) {
    if (window.theme.assets.swiperCss) loadStyle(window.theme.assets.swiperCss);
    swiperPromise = loadScript(window.theme.assets.swiperJs).then(() => window.Swiper);
  }
  return swiperPromise;
}

/**
 * @param {HTMLElement} el          the Swiper root (`.swiper` element)
 * @param {object} [options]        Swiper options, merged over the defaults
 * @returns {Promise<object|null>}  the Swiper instance, or null if motion is disabled
 */
export async function initCarousel(el, options = {}) {
  const Swiper = await ensureSwiper();
  if (!Swiper) return null;

  const defaults = {
    speed: 500,
    slidesPerView: 1,
    spaceBetween: 16,
    autoplay: isMotionEnabled() ? { delay: 5000, disableOnInteraction: true } : false,
    a11y: { enabled: true },
  };

  return new Swiper(el, { ...defaults, ...options });
}
