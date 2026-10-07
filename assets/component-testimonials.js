/**
 * Progressive-enhancement carousel for the testimonials section. The
 * markup already works as a native horizontally-scrollable, snapping row
 * with zero JavaScript (see the .swiper-wrapper rules in
 * sections/testimonials.liquid) — this only upgrades it into a Swiper
 * instance with pagination dots and prev/next controls when the vendor
 * library is available and motion is allowed.
 */
import { initCarousel } from './carousel.js';
import { isMotionEnabled } from './motion-preference.js';

export default async function testimonials(el) {
  const track = el.querySelector('.testimonials__track');
  if (!track) return;

  const animationsEnabled = el.dataset.animations === 'true' && isMotionEnabled();

  const swiper = await initCarousel(track, {
    slidesPerView: 1.15,
    spaceBetween: 24,
    autoplay: animationsEnabled ? { delay: 6000, disableOnInteraction: true } : false,
    pagination: {
      el: el.querySelector('.testimonials__pagination'),
      clickable: true,
    },
    navigation: {
      prevEl: el.querySelector('.testimonials__nav--prev'),
      nextEl: el.querySelector('.testimonials__nav--next'),
    },
    breakpoints: {
      750: { slidesPerView: 2, spaceBetween: 32 },
      990: { slidesPerView: 3, spaceBetween: 32 },
    },
  });

  return () => {
    swiper?.destroy?.(true, true);
  };
}
