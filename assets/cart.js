/**
 * Thin wrapper around Shopify's Ajax Cart API. Every mutation dispatches a
 * `cart:updated` CustomEvent on `document` with the fresh cart JSON as
 * `detail` — assets/component-cart-drawer.js re-renders the drawer from it,
 * and the header's cart count badge listens for the same event, so the two
 * never need to know about each other directly.
 */
import { dispatch } from './utils.js';

async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options && options.headers) },
  });
  const cart = await response.json();
  if (!response.ok) throw cart;
  dispatch(document, 'cart:updated', { cart });
  return cart;
}

export function getCart() {
  return fetch('/cart.js').then((response) => response.json());
}

export function addToCart(items) {
  return request('/cart/add.js', {
    method: 'POST',
    body: JSON.stringify({ items: Array.isArray(items) ? items : [items] }),
  });
}

/**
 * @param {string} lineKey
 * @param {number} quantity - 0 removes the line
 * @param {string[]} [sections] - Section ids to also return freshly
 *   rendered, via Shopify's Section Rendering API, as `cart.sections[id]`
 *   HTML strings — avoids reimplementing sections/cart-drawer.liquid's
 *   markup in JavaScript.
 */
export function changeCartLine(lineKey, quantity, sections = []) {
  return request('/cart/change.js', {
    method: 'POST',
    body: JSON.stringify({
      id: lineKey,
      quantity,
      sections: sections.join(','),
      sections_url: window.location.pathname,
    }),
  });
}
