/**
 * Variant selection and add-to-cart for sections/product.liquid.
 *
 * Every variant is read once from the section's
 * `<script type="application/json" data-product-variants>` block, with
 * prices already formatted by Liquid's `money` filter — so changing an
 * option never needs a network round trip, and money formatting never has
 * to be reimplemented in JavaScript.
 *
 * Adding to cart asks Shopify's Section Rendering API to also return
 * sections/cart-drawer.liquid, swaps that in, then opens the drawer via
 * component-dialog.js's `dialog:request-open` event.
 */
import { addToCart } from './cart.js';
import { dispatch } from './utils.js';

const CART_DRAWER_SECTION = 'cart-drawer';

export default function productForm(el) {
  const variantsEl = el.querySelector('[data-product-variants]');
  const form = el.querySelector('.product__form');
  if (!variantsEl || !form) return undefined;

  const variants = JSON.parse(variantsEl.textContent);
  const fieldsets = Array.from(el.querySelectorAll('[data-option-index]'));
  const idInput = form.querySelector('[data-variant-id]');
  const quantityInput = form.querySelector('[data-quantity-input]');
  const addButton = form.querySelector('[data-add-to-cart]');
  const errorEl = form.querySelector('[data-product-error]');
  const priceCurrent = el.querySelector('[data-price-current]');
  const priceCompare = el.querySelector('[data-price-compare]');
  const saleBadge = el.querySelector('[data-sale-badge]');
  const gallery = el.querySelector('[data-product-gallery]');
  const labels = {
    add: el.dataset.labelAdd,
    soldOut: el.dataset.labelSoldOut,
    unavailable: el.dataset.labelUnavailable,
    error: el.dataset.errorGeneric,
  };

  function getSelectedOptions() {
    return fieldsets.map((fieldset) => {
      const checked = fieldset.querySelector('input:checked');
      return checked ? checked.value : null;
    });
  }

  function findVariant(selected) {
    return variants.find((variant) => variant.options.every((value, index) => value === selected[index]));
  }

  /**
   * A value is available when some in-stock variant has it AND matches
   * every option chosen before it — so picking a colour first greys out
   * only the sizes sold out in that colour.
   */
  function updateAvailability(selected) {
    fieldsets.forEach((fieldset, index) => {
      fieldset.querySelectorAll('input[type="radio"]').forEach((input) => {
        const available = variants.some(
          (variant) =>
            variant.available &&
            variant.options[index] === input.value &&
            selected.slice(0, index).every((value, earlier) => variant.options[earlier] === value)
        );
        const label = input.nextElementSibling;
        if (!label) return;
        label.classList.toggle('is-unavailable', !available);
        const note = label.querySelector('[data-unavailable-note]');
        if (note) note.hidden = available;
      });
    });
  }

  function updatePrice(variant) {
    if (!variant) return;
    priceCurrent.textContent = variant.price;
    const onSale = Boolean(variant.compare_at_price);
    priceCompare.textContent = onSale ? variant.compare_at_price : '';
    priceCompare.hidden = !onSale;
    saleBadge.hidden = !onSale;
  }

  function updateButton(variant) {
    if (!variant) {
      addButton.disabled = true;
      addButton.textContent = labels.unavailable;
    } else if (!variant.available) {
      addButton.disabled = true;
      addButton.textContent = labels.soldOut;
    } else {
      addButton.disabled = false;
      addButton.textContent = labels.add;
    }
  }

  /** Brings the variant's own image into view — only on the mobile strip,
   *  where it would otherwise be hidden off to the side. */
  function showVariantMedia(variant) {
    if (!variant || !variant.featured_media_id || !gallery) return;
    if (gallery.scrollWidth <= gallery.clientWidth) return;
    const item = gallery.querySelector(`[data-media-id="${variant.featured_media_id}"]`);
    if (item) gallery.scrollTo({ left: item.offsetLeft, behavior: 'smooth' });
  }

  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function handleOptionChange(event) {
    const fieldset = event.target.closest('[data-option-index]');
    if (!fieldset) return;

    const selectedEl = fieldset.querySelector('[data-option-selected]');
    if (selectedEl) selectedEl.textContent = event.target.value;

    const selected = getSelectedOptions();
    const variant = findVariant(selected);

    idInput.value = variant ? variant.id : '';
    updateAvailability(selected);
    updatePrice(variant);
    updateButton(variant);
    showVariantMedia(variant);
    hideError();

    if (variant) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    }
  }

  function handleQuantityClick(event) {
    const current = parseInt(quantityInput.value, 10) || 1;
    if (event.target.closest('[data-quantity-increase]')) {
      quantityInput.value = current + 1;
    } else if (event.target.closest('[data-quantity-decrease]')) {
      quantityInput.value = Math.max(current - 1, 1);
    }
  }

  function handleQuantityBlur() {
    const value = parseInt(quantityInput.value, 10);
    quantityInput.value = Number.isNaN(value) || value < 1 ? 1 : value;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!idInput.value || addButton.disabled) return;

    hideError();
    addButton.setAttribute('data-loading', '');
    addButton.setAttribute('aria-busy', 'true');

    try {
      const cart = await addToCart(
        { id: Number(idInput.value), quantity: Math.max(parseInt(quantityInput.value, 10) || 1, 1) },
        [CART_DRAWER_SECTION]
      );
      const drawerSection = document.getElementById(`shopify-section-${CART_DRAWER_SECTION}`);
      if (drawerSection && cart.sections && cart.sections[CART_DRAWER_SECTION]) {
        drawerSection.outerHTML = cart.sections[CART_DRAWER_SECTION];
      }
      dispatch(document, 'dialog:request-open', { id: 'cart-drawer' });
    } catch (error) {
      // Shopify's 422 (e.g. "You can't add more of this item") carries a
      // customer-readable `description`; network failures don't.
      errorEl.textContent = (error && error.description) || labels.error;
      errorEl.hidden = false;
    } finally {
      addButton.removeAttribute('data-loading');
      addButton.removeAttribute('aria-busy');
    }
  }

  form.addEventListener('change', handleOptionChange);
  form.addEventListener('click', handleQuantityClick);
  form.addEventListener('submit', handleSubmit);
  quantityInput.addEventListener('blur', handleQuantityBlur);

  return () => {
    form.removeEventListener('change', handleOptionChange);
    form.removeEventListener('click', handleQuantityClick);
    form.removeEventListener('submit', handleSubmit);
    quantityInput.removeEventListener('blur', handleQuantityBlur);
  };
}
