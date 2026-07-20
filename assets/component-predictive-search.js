/**
 * Predictive search for the search overlay. Matched to
 * `data-component="predictive-search"` on the overlay's <form> (see
 * snippets/theme-overlays.liquid).
 *
 * Three states share one results area:
 *  - empty input  → the server-rendered "default state" (suggested terms +
 *    trending products, both real Shopify data rendered by Liquid) plus a
 *    client-rendered recent-searches list from localStorage
 *  - typing       → this file fetches Shopify's own predictive search
 *    endpoint and renders matching products/collections/query suggestions
 *  - submit       → the term is saved to recent searches and the browser
 *    navigates to the full search results page as normal
 */
import { debounce } from './utils.js';

const RECENT_KEY = 'theme:recentSearches';
const MAX_RECENT = 5;

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveRecentSearch(term) {
  if (!term) return;
  const existing = getRecentSearches().filter((entry) => entry.toLowerCase() !== term.toLowerCase());
  existing.unshift(term);
  localStorage.setItem(RECENT_KEY, JSON.stringify(existing.slice(0, MAX_RECENT)));
}

function money(cents, format) {
  if (typeof cents !== 'number') return '';
  const amount = (cents / 100).toFixed(2);
  return format ? format.replace('{{amount}}', amount) : amount;
}

export default function predictiveSearch(el) {
  const input = el.querySelector('input[type="search"]');
  const resultsEl = el.querySelector('[data-predictive-search-results]');
  const defaultStateEl = el.querySelector('[data-default-state]');
  const recentEl = el.querySelector('[data-recent-searches]');
  const recentListEl = recentEl ? recentEl.querySelector('[data-recent-searches-list]') : null;
  const clearRecentButton = recentEl ? recentEl.querySelector('[data-clear-recent]') : null;
  if (!input || !resultsEl) return;

  function renderRecent() {
    const recent = getRecentSearches();
    if (!recentEl || !recentListEl) return;
    recentEl.hidden = recent.length === 0;
    recentListEl.innerHTML = '';
    recent.forEach((term) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'predictive-search__pill';
      button.textContent = term;
      button.addEventListener('click', () => {
        input.value = term;
        input.dispatchEvent(new Event('input'));
        input.focus();
      });
      const item = document.createElement('li');
      item.appendChild(button);
      recentListEl.appendChild(item);
    });
  }

  function showDefaultState() {
    resultsEl.hidden = true;
    resultsEl.innerHTML = '';
    if (defaultStateEl) defaultStateEl.hidden = false;
    renderRecent();
  }

  function renderResults(data, term) {
    resultsEl.innerHTML = '';
    const { resources } = data;
    const products = (resources.results.products || []).slice(0, 6);
    const collections = (resources.results.collections || []).slice(0, 3);
    const queries = (resources.results.queries || []).slice(0, 5);

    if (!products.length && !collections.length) {
      const empty = document.createElement('p');
      empty.className = 'predictive-search__empty text-caption';
      empty.textContent = term;
      resultsEl.appendChild(empty);
      resultsEl.hidden = false;
      return;
    }

    if (queries.length) {
      const list = document.createElement('ul');
      list.className = 'predictive-search__suggestions';
      queries.forEach((query) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = query.url;
        link.innerHTML = query.styled_text;
        item.appendChild(link);
        list.appendChild(item);
      });
      resultsEl.appendChild(list);
    }

    if (products.length) {
      const list = document.createElement('ul');
      list.className = 'predictive-search__products';
      products.forEach((product) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = product.url;
        link.className = 'predictive-search__product';

        const image = document.createElement('img');
        image.loading = 'lazy';
        image.width = 80;
        image.height = 80;
        image.alt = product.featured_image ? product.featured_image.alt || '' : '';
        if (product.featured_image) image.src = product.featured_image.url;

        const title = document.createElement('span');
        title.className = 'text-product-title';
        title.textContent = product.title;

        const price = document.createElement('span');
        price.className = 'text-product-price';
        price.textContent = money(product.price, window.theme.moneyFormat);

        link.append(image, title, price);
        item.appendChild(link);
        list.appendChild(item);
      });
      resultsEl.appendChild(list);
    }

    resultsEl.hidden = false;
  }

  const fetchResults = debounce(async (term) => {
    if (!term) {
      showDefaultState();
      return;
    }
    if (defaultStateEl) defaultStateEl.hidden = true;

    try {
      const response = await fetch(
        `${window.theme.routes.predictiveSearchUrl}?q=${encodeURIComponent(term)}&resources[type]=product,collection,query&resources[limit]=6&resources[options][unavailable_products]=last`
      );
      const data = await response.json();
      renderResults(data, term);
    } catch (error) {
      console.error('[predictive-search] request failed', error);
    }
  }, 200);

  function handleInput() {
    fetchResults(input.value.trim());
  }

  function handleSubmit() {
    saveRecentSearch(input.value.trim());
  }

  function handleClearRecent() {
    localStorage.removeItem(RECENT_KEY);
    renderRecent();
  }

  // dialog:open is dispatched on the dialog root (see component-dialog.js)
  // and bubbles upward, away from this form — listen on the ancestor, not `el`.
  const dialogRoot = el.closest('[role="dialog"]');

  input.addEventListener('input', handleInput);
  el.addEventListener('submit', handleSubmit);
  if (clearRecentButton) clearRecentButton.addEventListener('click', handleClearRecent);
  if (dialogRoot) dialogRoot.addEventListener('dialog:open', showDefaultState);

  showDefaultState();

  return () => {
    input.removeEventListener('input', handleInput);
    el.removeEventListener('submit', handleSubmit);
    if (clearRecentButton) clearRecentButton.removeEventListener('click', handleClearRecent);
    if (dialogRoot) dialogRoot.removeEventListener('dialog:open', showDefaultState);
  };
}
