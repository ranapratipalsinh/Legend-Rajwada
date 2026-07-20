/**
 * Component auto-initialization.
 *
 * Convention over registration: any element with `data-component="name"`
 * is matched to `./component-name.js` and dynamically imported — no future
 * section has to be added to a central list to get initialized. A
 * component module's default export is a function that receives the
 * element and returns an optional teardown function.
 *
 * Also owns the Shopify theme-editor lifecycle: sections can be added,
 * re-rendered, or removed without a page reload while a merchant is
 * customizing, so components must be able to tear down and re-init in
 * place rather than only running once on DOMContentLoaded.
 *
 * No `component-*.js` files exist yet because no sections exist yet — this
 * file is the mechanism, ready for a later phase to add matching modules.
 */

const instances = new WeakMap();

async function mount(el) {
  const name = el.dataset.component;
  if (!name || instances.has(el)) return;

  try {
    const module = await import(`./component-${name}.js`);
    const teardown = await module.default(el);
    instances.set(el, typeof teardown === 'function' ? teardown : null);
  } catch (error) {
    console.error(`[component-loader] failed to load component "${name}"`, error);
  }
}

function unmount(el) {
  const teardown = instances.get(el);
  if (typeof teardown === 'function') teardown();
  instances.delete(el);
}

export function initComponents(root = document) {
  root.querySelectorAll('[data-component]').forEach(mount);
}

/** Shopify theme editor lifecycle — see
 *  https://shopify.dev/docs/storefronts/themes/best-practices/theme-editor */
export function bindThemeEditorEvents() {
  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll('[data-component]').forEach(mount);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    event.target.querySelectorAll('[data-component]').forEach(unmount);
  });

  document.addEventListener('shopify:block:select', (event) => {
    event.target.dispatchEvent(new CustomEvent('theme:block:select', { bubbles: true }));
  });

  document.addEventListener('shopify:block:deselect', (event) => {
    event.target.dispatchEvent(new CustomEvent('theme:block:deselect', { bubbles: true }));
  });
}
