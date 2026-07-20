/**
 * Desktop mega menu open/close. Matched to `data-component="mega-menu"` on
 * the desktop <nav> in sections/header.liquid. Mobile navigation is a
 * separate drawer (assets/component-mobile-nav.js) with its own accordion
 * behaviour, so this file only ever runs against the desktop nav markup.
 *
 * Opens on hover (with a short close delay so moving the mouse from the
 * trigger to the panel doesn't close it) and on keyboard focus; Escape
 * closes and returns focus to the trigger.
 */
export default function megaMenu(el) {
  let openPanel = null;
  let closeTimer = null;

  function open(trigger, panel) {
    clearTimeout(closeTimer);
    if (openPanel && openPanel !== panel) close();
    trigger.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    openPanel = panel;
  }

  function close() {
    if (!openPanel) return;
    const trigger = el.querySelector(`[aria-controls="${openPanel.id}"]`);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    openPanel.hidden = true;
    openPanel = null;
  }

  function scheduleClose() {
    closeTimer = setTimeout(close, 150);
  }

  const triggers = el.querySelectorAll('[data-mega-menu-trigger]');
  triggers.forEach((trigger) => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    const item = trigger.closest('.nav__item');
    if (!panel || !item) return;

    item.addEventListener('mouseenter', () => open(trigger, panel));
    item.addEventListener('mouseleave', scheduleClose);
    trigger.addEventListener('focus', () => open(trigger, panel));
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      if (openPanel === panel) {
        close();
      } else {
        open(trigger, panel);
      }
    });
    panel.addEventListener('mouseenter', () => clearTimeout(closeTimer));
    panel.addEventListener('mouseleave', scheduleClose);
  });

  function handleFocusOut(event) {
    if (!el.contains(event.relatedTarget)) close();
  }

  function handleKeydown(event) {
    if (event.key !== 'Escape' || !openPanel) return;
    const trigger = el.querySelector(`[aria-controls="${openPanel.id}"]`);
    close();
    if (trigger) trigger.focus();
  }

  el.addEventListener('focusout', handleFocusOut);
  el.addEventListener('keydown', handleKeydown);

  return () => {
    el.removeEventListener('focusout', handleFocusOut);
    el.removeEventListener('keydown', handleKeydown);
    clearTimeout(closeTimer);
  };
}
