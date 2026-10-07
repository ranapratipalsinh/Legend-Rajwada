# Legend Rajwada — Shopify theme

Custom Shopify theme for **Legend Rajwada**, a luxury Indian menswear label (sherwanis, achkans, bandhgalas and Indo-Western couture). Built on Shopify's [Skeleton Theme](https://github.com/Shopify/skeleton-theme), with a deep-navy and royal-gold design system.

- **Store:** `legend-rajwada-bkobcf4g.myshopify.com`
- **Repository:** https://github.com/ranapratipalsinh/Legend-Rajwada

## Getting started

### Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli), version 3 or later
- [Node.js](https://nodejs.org/), required by the Shopify CLI
- Recommended: the [Shopify Liquid VS Code extension](https://shopify.dev/docs/storefronts/themes/tools/shopify-liquid-vscode)
- Staff access to the Shopify store

### Clone and preview

```bash
git clone https://github.com/ranapratipalsinh/Legend-Rajwada.git
cd Legend-Rajwada
shopify theme dev --store legend-rajwada-bkobcf4g.myshopify.com
```

The first run asks you to log in to Shopify in the browser. The preview runs at `http://127.0.0.1:9292` and reloads as you save files. It uses a private **development theme** that customers never see.

The store is password-protected until launch. When a shared preview link (`?preview_theme_id=…`) opens the password page, enter the password and then open the link again. Otherwise Shopify shows the live theme instead of the preview.

### Check the code

```bash
shopify theme check
```

Run this before every push. It should report no errors.

## Deploying

Never push straight over the live theme. Upload the theme as a new, unpublished theme, review it, then publish it from the admin:

```bash
shopify theme push --unpublished --store legend-rajwada-bkobcf4g.myshopify.com
```

Then go to **Online Store → Themes**, preview the new theme, and click **Publish** when it's approved.

`templates/*.json` and `config/settings_data.json` are also edited by the theme editor. Before pushing over an existing theme, run `shopify theme pull --only templates/*.json --only config/settings_data.json` so you don't overwrite changes a merchant made in the editor.

## What's in the theme

### Pages

| Page | Section | Notes |
|---|---|---|
| Home | `hero`, `signature-collection`, `brand-story`, `editorial-banner`, `testimonials` | Set up in `templates/index.json`; more sections can be added in the theme editor |
| Product | `product` | Size and other option buttons, sold-out marking, sale price, quantity stepper; adds to cart without a page reload and opens the cart drawer |
| Cart | `cart`, `cart-drawer` | One shared line-item design (`snippets/cart-line-item.liquid`); quantity changes keep the page and the drawer in sync |
| Collection | `collection` | Product cards (`snippets/product-card.liquid`), sorting, column and page-size settings, pagination |
| Search | `search` | Product cards, plus cards for articles and pages |
| Collections list, page, blog, article, 404 | `collections`, `page`, `blog`, `article`, `404` | Shared page header and `.rte` styles for text written in the admin |
| Contact | `page` + `contact-form` | `templates/page.contact.json`. In the admin, set the Contact page's theme template to `contact` |
| Password | `password` | The "store is private" page shown before launch |

The header, the announcement bar, the mega menu (`blocks/mega-menu-*`) and the footer are shared across all pages through the `header-group` and `footer-group` section groups.

### Customer accounts and checkout

The account icon uses Shopify's built-in account button (new customer accounts), so login, registration and order history pages are hosted by Shopify, not this theme. The same goes for checkout. Both are styled under **Settings → Checkout → Customize** in the admin.

## Code structure

```
assets/       Global CSS layers, JavaScript modules, icons and vendor libraries
blocks/       Theme blocks (mega-menu content, text, group)
config/       Theme settings: colours, fonts, layout and header options
layout/       theme.liquid (storefront) and password.liquid
locales/      en.default.json (storefront text), en.default.schema.json (theme editor labels)
sections/     Page sections and section groups
snippets/     Reusable pieces: button, image, icon, product card, pagination, breadcrumb…
templates/    JSON templates listing the sections on each page type
```

### CSS

Design tokens (colours, fonts, page width, spacing scale, corner radius) come from theme settings and are output as CSS variables by `snippets/css-variables.liquid`. Fixed tokens such as spacing, motion and type sizes are in `assets/variables.css`.

`layout/theme.liquid` loads these global files, which block rendering:

| File | Contents |
|---|---|
| `critical.css` | Reset and the page grid every section sits in |
| `reset.css`, `variables.css` | Base reset and fixed design tokens |
| `typography.css` | Type scale, `.text-*` classes, `.rte` for admin-written text |
| `layout.css` | Page shell and header, grid, flex utilities, aspect ratios |
| `buttons.css`, `forms.css`, `utilities.css` | Buttons, form fields, helpers |

`components.css` (badges, dialogs, pagination, quantity stepper) and `animations.css` load without blocking the first paint.

CSS that belongs to one component lives in that file's `{% stylesheet %}` tag.

### JavaScript

There is no build step. `assets/theme.js` is the single ES-module entry point. `assets/component-loader.js` finds every element with `data-component="name"` and imports `assets/component-name.js`, so a new component only needs that attribute and a matching file. Components re-initialise automatically when a section reloads in the theme editor.

| Module | Purpose |
|---|---|
| `cart.js` | Ajax Cart API wrapper; every change fires a `cart:updated` event |
| `component-dialog.js` | Opening and closing for all drawers and modals; other code can open one with a `dialog:request-open` event |
| `component-product-form.js` | Option buttons and add to cart on the product page |
| `component-cart-drawer.js`, `component-cart-page.js` | Quantity changes, re-rendered through the Section Rendering API |
| `motion.js`, `scroll.js`, `carousel.js` | Scroll reveals and GSAP animation, Lenis smooth scrolling, Swiper sliders |

### Vendor libraries

Official, unmodified builds, loaded only when a component needs them:

| File | Package |
|---|---|
| `vendor-gsap.js`, `vendor-gsap-scrolltrigger.js` | gsap 3.15.0 |
| `vendor-lenis.js` | lenis 1.3.26 |
| `vendor-swiper.js`, `vendor-swiper.css` | swiper 14.3.0 |

To upgrade, replace the files with newer builds of the same packages from npm and update the versions noted in `layout/theme.liquid`.

## Conventions

- **All visible text is translated.** Use `{{ 'key' | t }}` and add the key to `locales/en.default.json`; labels in the theme editor go in `locales/en.default.schema.json`.
- **Snippets start with a `{% doc %}` block** describing their parameters.
- **Theme-editor settings:** a setting that controls a single CSS property becomes a CSS variable, and one that controls several becomes a class.
- `AGENTS.md` / `CLAUDE.md` hold the full coding guidelines for this theme.

## Before launch

Work through the production checklist (store details, policies, shipping, Razorpay, domain) before removing the store password. In short:

1. Move the store to a paid Shopify plan.
2. Push this theme as unpublished, review it, and publish it.
3. Connect Razorpay in live mode with the business owner's account, and set payment capture to automatic.
4. Place one small real order, check it in Shopify and Razorpay, then refund it.
5. Remove the store password (**Online Store → Preferences**).

## License

Based on Shopify's Skeleton Theme. See [LICENSE.md](./LICENSE.md) for the terms that apply to the original code.
