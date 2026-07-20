/**
 * Theme entry point. Loaded once from layout/theme.liquid as
 * `<script type="module" src="{{ 'theme.js' | asset_url }}">`.
 *
 * Keep this file thin — it only wires the capability modules together. Any
 * real behaviour belongs in the module that owns it (utils, motion,
 * scroll, carousel, component-loader).
 */
import { initComponents, bindThemeEditorEvents } from './component-loader.js';
import { initBasicReveals } from './motion.js';
import { initSmoothScroll } from './scroll.js';

function boot() {
  initComponents();
  initBasicReveals();
  bindThemeEditorEvents();
  initSmoothScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
