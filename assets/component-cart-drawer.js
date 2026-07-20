/**
 * Quantity/remove interactions for the cart drawer. Matched to
 * `data-component="cart-drawer-content"` on the stable wrapper in
 * snippets/theme-overlays.liquid — deliberately NOT on the
 * `{% section 'cart-drawer' %}` output itself, since that inner markup gets
 * replaced wholesale on every change (see below) and would take a directly
 * attached listener down with it. Event delegation on the stable wrapper
 * means the drawer never needs to re-run initialization after a swap.
 *
 * Every mutation asks Shopify's Section Rendering API to also return
 * sections/cart-drawer.liquid pre-rendered (via the `sections` param on
 * assets/cart.js's changeCartLine), then swaps that HTML in directly —
 * the cart drawer's line-item markup is defined once, in Liquid, and never
 * duplicated in JavaScript.
 */
import { changeCartLine } from './cart.js';

const SECTION_ID = 'cart-drawer';

export default function cartDrawerContent(el) {
  function getSectionEl() {
    return document.getElementById(`shopify-section-${SECTION_ID}`);
  }

  async function mutate(lineKey, quantity, row) {
    row.setAttribute('aria-busy', 'true');
    try {
      const cart = await changeCartLine(lineKey, quantity, [SECTION_ID]);
      const sectionEl = getSectionEl();
      if (sectionEl && cart.sections && cart.sections[SECTION_ID]) {
        sectionEl.outerHTML = cart.sections[SECTION_ID];
      }
    } catch (error) {
      console.error('[cart-drawer] update failed', error);
      row.removeAttribute('aria-busy');
    }
  }

  function handleClick(event) {
    const row = event.target.closest('[data-cart-line]');
    if (!row) return;
    const lineKey = row.dataset.cartLine;
    const valueEl = row.querySelector('[data-cart-quantity-value]');
    const currentQuantity = valueEl ? parseInt(valueEl.textContent, 10) : 0;

    if (event.target.closest('[data-cart-quantity-increase]')) {
      mutate(lineKey, currentQuantity + 1, row);
    } else if (event.target.closest('[data-cart-quantity-decrease]')) {
      mutate(lineKey, Math.max(currentQuantity - 1, 0), row);
    } else if (event.target.closest('[data-cart-remove]')) {
      mutate(lineKey, 0, row);
    }
  }

  el.addEventListener('click', handleClick);
  return () => el.removeEventListener('click', handleClick);
}
