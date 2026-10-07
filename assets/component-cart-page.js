/**
 * Quantity/remove interactions for sections/cart.liquid — the same
 * `data-cart-line` row markup as the cart drawer (snippets/cart-line-item.liquid),
 * driven the same way.
 *
 * Every change asks Shopify's Section Rendering API for this section AND
 * the cart drawer, so both stay in sync. Only the `[data-cart-swap]`
 * regions (header, lines, totals) are replaced, never the whole section —
 * the dynamic checkout buttons are initialised once by Shopify's own script
 * and would not come back if their markup were swapped out. When the cart
 * empties (or fills from empty), the whole `body` region swaps instead,
 * since the page switches between its empty and filled layouts.
 *
 * Changes made elsewhere (the cart drawer, opened from this page) arrive as
 * `cart:updated` events; those refetch this section so the page never shows
 * a stale cart.
 */
import { changeCartLine } from './cart.js';

const CART_DRAWER_SECTION = 'cart-drawer';
const REGIONS = ['header', 'lines', 'totals'];

export default function cartPage(el) {
  const sectionId = el.dataset.sectionId;
  let isMutating = false;

  function render(html, itemCount) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const swapWhole = itemCount === 0 || !el.querySelector('[data-cart-swap="lines"]');
    const regions = swapWhole ? ['body'] : REGIONS;

    regions.forEach((name) => {
      const fresh = doc.querySelector(`[data-cart-swap="${name}"]`);
      const current = el.querySelector(`[data-cart-swap="${name}"]`);
      if (fresh && current) current.replaceWith(fresh);
    });
  }

  function showError(message) {
    const errorEl = el.querySelector('[data-cart-error]');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  async function mutate(lineKey, quantity, row) {
    isMutating = true;
    row.setAttribute('aria-busy', 'true');
    try {
      const cart = await changeCartLine(lineKey, quantity, [sectionId, CART_DRAWER_SECTION]);
      if (cart.sections && cart.sections[sectionId]) render(cart.sections[sectionId], cart.item_count);

      const drawerSection = document.getElementById(`shopify-section-${CART_DRAWER_SECTION}`);
      if (drawerSection && cart.sections && cart.sections[CART_DRAWER_SECTION]) {
        drawerSection.outerHTML = cart.sections[CART_DRAWER_SECTION];
      }
    } catch (error) {
      // Shopify's 422 (e.g. more requested than in stock) carries a
      // customer-readable `description`; network failures don't.
      row.removeAttribute('aria-busy');
      showError((error && error.description) || el.dataset.errorGeneric);
    } finally {
      isMutating = false;
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

  async function handleExternalUpdate(event) {
    if (isMutating) return;
    try {
      const response = await fetch(`${window.location.pathname}?section_id=${encodeURIComponent(sectionId)}`);
      render(await response.text(), event.detail.cart.item_count);
    } catch (error) {
      console.error('[cart-page] refresh failed', error);
    }
  }

  el.addEventListener('click', handleClick);
  document.addEventListener('cart:updated', handleExternalUpdate);

  return () => {
    el.removeEventListener('click', handleClick);
    document.removeEventListener('cart:updated', handleExternalUpdate);
  };
}
