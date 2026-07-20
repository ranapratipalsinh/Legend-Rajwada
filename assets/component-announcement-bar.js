/**
 * Rotates between announcement bar messages. Only mounted when the
 * section has more than one block (see sections/announcement-bar.liquid —
 * `data-component` is left empty otherwise, so component-loader.js never
 * calls this for a single-message bar).
 */
import { isMotionEnabled } from './motion-preference.js';

export default function announcementBar(el) {
  const items = el.querySelectorAll('.announcement-bar__item');
  const interval = parseInt(el.dataset.interval, 10) || 5000;
  if (items.length < 2) return;

  let index = 0;
  let timer = null;

  function show(nextIndex) {
    items[index].hidden = true;
    index = nextIndex;
    items[index].hidden = false;
  }

  function tick() {
    show((index + 1) % items.length);
  }

  if (isMotionEnabled()) {
    timer = setInterval(tick, interval);
  }

  return () => {
    if (timer) clearInterval(timer);
  };
}
