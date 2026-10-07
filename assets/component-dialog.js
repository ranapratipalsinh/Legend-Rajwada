/**
 * Generic open/close mechanics for every drawer, modal, and overlay in the
 * theme (menu drawer, cart drawer, quick view, search overlay, and any
 * future generic modal — see snippets/theme-overlays.liquid). One
 * controller, matched by `data-component="dialog"`, because opening and
 * closing works identically regardless of what ends up inside — a future
 * phase fills the content, not the mechanics.
 *
 * Contract:
 *  - the dialog root carries `id`, `hidden`, `role="dialog"`, `aria-modal="true"`
 *  - any element anywhere in the document with `data-dialog-open="{id}"` opens it
 *  - any element inside the dialog with `data-dialog-close` closes it
 *    (the backdrop included)
 *  - an element with `data-dialog-focus` receives focus on open instead of
 *    the first focusable element (e.g. the search overlay's input, rather
 *    than its close button which happens to sit first in the DOM)
 *  - Escape closes it; closing returns focus to whatever triggered the open
 *  - scripts open it without a click by dispatching
 *    `dialog:request-open` on `document` with `{ id }` as detail (e.g. the
 *    product form opening the cart drawer after an add)
 */
import { trapFocus, dispatch } from './utils.js';
import { pauseSmoothScroll, resumeSmoothScroll } from './scroll.js';

export default function dialog(el) {
  let releaseFocusTrap = null;
  let lastTrigger = null;

  function open(trigger) {
    if (!el.hasAttribute('hidden')) return;
    lastTrigger = trigger || document.activeElement;
    el.removeAttribute('hidden');
    el.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('is-locked');
    pauseSmoothScroll();
    releaseFocusTrap = trapFocus(el, el.querySelector('[data-dialog-focus]'));
    document.addEventListener('keydown', handleKeydown);
    dispatch(el, 'dialog:open');
  }

  function close() {
    if (el.hasAttribute('hidden')) return;
    el.setAttribute('hidden', '');
    el.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('is-locked');
    resumeSmoothScroll();
    if (releaseFocusTrap) releaseFocusTrap();
    document.removeEventListener('keydown', handleKeydown);
    dispatch(el, 'dialog:close');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') close();
  }

  function handleTriggerClick(event) {
    const trigger = event.target.closest(`[data-dialog-open="${el.id}"]`);
    if (trigger) {
      event.preventDefault();
      open(trigger);
    }
  }

  function handleCloseClick(event) {
    if (event.target.closest('[data-dialog-close]')) close();
  }

  function handleOpenRequest(event) {
    if (event.detail && event.detail.id === el.id) open();
  }

  document.addEventListener('click', handleTriggerClick);
  document.addEventListener('dialog:request-open', handleOpenRequest);
  el.addEventListener('click', handleCloseClick);

  return () => {
    document.removeEventListener('click', handleTriggerClick);
    document.removeEventListener('dialog:request-open', handleOpenRequest);
    document.removeEventListener('keydown', handleKeydown);
    el.removeEventListener('click', handleCloseClick);
    if (releaseFocusTrap) releaseFocusTrap();
  };
}
