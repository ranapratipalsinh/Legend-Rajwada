/**
 * Thin wrapper around Shopify's Ajax Cart API. Every mutation dispatches a
 * `cart:updated` CustomEvent on `document` with the fresh cart JSON as
 * `detail` — assets/component-cart-drawer.js re-renders the drawer from it,
 * and the header's cart count badge listens for the same event, so the two
 * never need to know about each other directly.
 *
 * Both mutations accept an optional list of section ids to also return
 * freshly rendered, via Shopify's Section Rendering API, as
 * `result.sections[id]` HTML strings — avoids reimplementing a section's
 * markup (cart drawer, cart page) in JavaScript.
 */
import { dispatch } from './utils.js';

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw json;
  return json;
}

function withSections(body, sections) {
  if (!sections.length) return body;
  return { ...body, sections: sections.join(','), sections_url: window.location.pathname };
}

export function getCart() {
  return fetch('/cart.js').then((response) => response.json());
}

/**
 * @param {object|object[]} items - `{ id, quantity }` line(s) to add
 * @param {string[]} [sections] - Section ids to return freshly rendered
 * @returns {Promise<object>} The full cart, plus `sections` when requested
 */
export async function addToCart(items, sections = []) {
  const added = await post('/cart/add.js', withSections({ items: Array.isArray(items) ? items : [items] }, sections));
  // /cart/add.js answers with the added line items, not the whole cart —
  // listeners (the header badge) need the cart's item_count, so fetch it
  // before announcing the change.
  const cart = await getCart();
  dispatch(document, 'cart:updated', { cart });
  return { ...cart, sections: added.sections };
}

/**
 * @param {string} lineKey
 * @param {number} quantity - 0 removes the line
 * @param {string[]} [sections] - Section ids to return freshly rendered
 */
export async function changeCartLine(lineKey, quantity, sections = []) {
  const cart = await post('/cart/change.js', withSections({ id: lineKey, quantity }, sections));
  dispatch(document, 'cart:updated', { cart });
  return cart;
}
