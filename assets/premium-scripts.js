// ============================================================
// LEGEND RAJWADA — Premium Storefront Scripts
// Royal Ethnic Wear Boutique Experience
// ============================================================

window.premiumTheme = window.premiumTheme || {};

// ============================================================
// CURRENCY FORMATTING
// ============================================================
window.premiumTheme.formatMoney = function(cents, format) {
  if (typeof cents === 'string') { cents = cents.replace('.', ''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || 'Rs. {{amount}}';

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = precision || 2;
    thousands = thousands || ',';
    decimal = decimal || '.';
    if (isNaN(number) || number == null) { return 0; }
    number = (number / 100).toFixed(precision);
    var parts = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents = parts[1] ? (decimal + parts[1]) : '';
    return dollars + cents;
  }

  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

// ============================================================
// VARIANT SELECTOR (Product Page)
// ============================================================
window.premiumTheme.onVariantChange = function(selectElement) {
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  if (!selectedOption) return;

  const price = selectedOption.getAttribute('data-price');
  const image = selectedOption.getAttribute('data-image');
  const available = selectedOption.getAttribute('data-available') === 'true';

  // Update Price Display
  const priceDisplay = document.querySelector('.product-price');
  if (priceDisplay && price) {
    priceDisplay.textContent = price;
  }

  // Update Featured Image Display
  const mainImage = document.getElementById('MainProductImage');
  if (mainImage && image && image !== '') {
    mainImage.src = image;
  }

  // Update Add to Cart Button State
  const addToCartBtn = document.querySelector('.action-btn-add');
  if (addToCartBtn) {
    if (available) {
      addToCartBtn.disabled = false;
      addToCartBtn.textContent = 'Add to Cart';
      addToCartBtn.classList.remove('btn-disabled');
    } else {
      addToCartBtn.disabled = true;
      addToCartBtn.textContent = 'Sold Out';
      addToCartBtn.classList.add('btn-disabled');
    }
  }
};

// ============================================================
// AJAX CART DRAWER
// ============================================================
window.premiumTheme.openCartDrawer = function() {
  const drawer = document.getElementById('CartDrawer');
  const overlay = document.getElementById('CartDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.add('is-active');
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    window.premiumTheme.refreshCartDrawer();
  }
};

window.premiumTheme.closeCartDrawer = function() {
  const drawer = document.getElementById('CartDrawer');
  const overlay = document.getElementById('CartDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('is-active');
    overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  }
};

window.premiumTheme.refreshCartDrawer = function() {
  const contentContainer = document.getElementById('CartDrawerContent');
  const subtotalContainer = document.getElementById('CartDrawerSubtotal');
  const cartBadges = document.querySelectorAll('.cart-badge');

  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      // Update Header Cart Badge(s)
      cartBadges.forEach(badge => {
        if (cart.item_count > 0) {
          badge.textContent = cart.item_count;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      });

      // Update Subtotal
      if (subtotalContainer) {
        subtotalContainer.textContent = window.premiumTheme.formatMoney(cart.total_price);
      }

      // Update Item List HTML
      if (!contentContainer) return;
      if (cart.item_count === 0) {
        contentContainer.innerHTML = `
          <div class="cart-drawer-empty">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" style="width:3rem;height:3rem;color:var(--color-border-gold);margin-bottom:1.5rem;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <p style="color:var(--color-text-muted);font-size:0.95rem;margin-bottom:1.5rem;">Your luxury bag is empty.</p>
            <a href="/collections/all" class="btn-premium" style="font-size:0.72rem;padding:10px 28px;" onclick="window.premiumTheme.closeCartDrawer()">Explore Collection</a>
          </div>`;
        return;
      }

      let itemsHtml = '';
      cart.items.forEach((item, index) => {
        const itemImage = item.image ? item.image : '/assets/product_suit.png';
        const variantLabel = item.variant_options.join(' / ');
        const displayVariant = variantLabel !== 'Default Title' ? `<p class="cart-drawer-item-variant">${variantLabel}</p>` : '';

        itemsHtml += `
          <div class="cart-drawer-item" data-line="${index + 1}">
            <div class="cart-drawer-item-img">
              <img src="${itemImage}" alt="${item.product_title}">
            </div>
            <div class="cart-drawer-item-info">
              <div>
                <h4 class="cart-drawer-item-title">${item.product_title}</h4>
                ${displayVariant}
                <div class="cart-drawer-qty-controls">
                  <button type="button" class="cart-qty-btn" onclick="window.premiumTheme.changeDrawerQuantity(${index + 1}, ${item.quantity - 1})">−</button>
                  <span class="cart-qty-value">${item.quantity}</span>
                  <button type="button" class="cart-qty-btn" onclick="window.premiumTheme.changeDrawerQuantity(${index + 1}, ${item.quantity + 1})">+</button>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                <button type="button" class="cart-drawer-remove" onclick="window.premiumTheme.changeDrawerQuantity(${index + 1}, 0)">Remove</button>
                <p class="cart-drawer-item-price">${window.premiumTheme.formatMoney(item.final_line_price)}</p>
              </div>
            </div>
          </div>
        `;
      });
      contentContainer.innerHTML = itemsHtml;
    })
    .catch(error => {
      console.error('Error fetching cart:', error);
      if (contentContainer) {
        contentContainer.innerHTML = '<div class="cart-drawer-loading">Error loading bag.</div>';
      }
    });
};

window.premiumTheme.changeDrawerQuantity = function(lineIndex, newQuantity) {
  fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ line: lineIndex, quantity: newQuantity })
  })
  .then(response => response.json())
  .then(() => {
    window.premiumTheme.refreshCartDrawer();
  })
  .catch(error => console.error('Error changing cart quantity:', error));
};

// ============================================================
// MOBILE MENU DRAWER
// ============================================================
window.premiumTheme.openMobileMenu = function() {
  const drawer = document.getElementById('MobileMenuDrawer');
  const overlay = document.getElementById('MobileMenuOverlay');
  if (drawer && overlay) {
    drawer.classList.add('is-active');
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }
};

window.premiumTheme.closeMobileMenu = function() {
  const drawer = document.getElementById('MobileMenuDrawer');
  const overlay = document.getElementById('MobileMenuOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('is-active');
    overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  }
};

// ============================================================
// SCROLL REVEAL (IntersectionObserver)
// ============================================================
window.premiumTheme.initScrollReveal = function() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
};

// The theme editor re-renders a single section via AJAX (Section
// Rendering API) whenever you change any setting — e.g. picking a new
// image. That swaps in brand-new .reveal/.reveal-left/.reveal-right
// elements that the observer above never saw, so they stay stuck at
// opacity: 0 forever (the content looks like it "disappeared", but it's
// just invisible). Skip the fade-in for freshly-reloaded sections in the
// editor instead of re-running the whole observer setup.
document.addEventListener('shopify:section:load', function(event) {
  const revealElements = event.target.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  revealElements.forEach(el => el.classList.add('revealed'));
});

// ============================================================
// SLIDESHOW
// ============================================================
// Scoped per-container so it can be (re-)initialized for a single
// freshly-reloaded section without touching any other slideshow on the
// page. data-slideshow-initialized guards against double-binding a
// second interval onto the same slideshow.
window.premiumTheme.initSlideshow = function(root) {
  const scope = root || document;
  const slideshows = scope.querySelectorAll('[data-slideshow]');

  slideshows.forEach(function(slideshow) {
    if (slideshow.dataset.slideshowInitialized) return;
    slideshow.dataset.slideshowInitialized = 'true';

    const slides = slideshow.querySelectorAll('.slideshow__slide');
    const dots = slideshow.querySelectorAll('.slideshow__dot');
    const prevBtn = slideshow.querySelector('[data-slideshow-prev]');
    const nextBtn = slideshow.querySelector('[data-slideshow-next]');
    if (slides.length < 2) return;

    let current = 0;
    let timer = null;

    function goTo(index) {
      slides[current].classList.remove('is-active');
      if (dots[current]) dots[current].classList.remove('is-active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      if (dots[current]) dots[current].classList.add('is-active');
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAutoplay() {
      timer = window.setInterval(next, 6000);
    }

    function stopAutoplay() {
      window.clearInterval(timer);
    }

    nextBtn?.addEventListener('click', function() { stopAutoplay(); next(); startAutoplay(); });
    prevBtn?.addEventListener('click', function() { stopAutoplay(); prev(); startAutoplay(); });
    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() { stopAutoplay(); goTo(i); startAutoplay(); });
    });

    slideshow.addEventListener('mouseenter', stopAutoplay);
    slideshow.addEventListener('mouseleave', startAutoplay);

    startAutoplay();
  });
};

document.addEventListener('shopify:section:load', function(event) {
  window.premiumTheme.initSlideshow(event.target);
});

// ============================================================
// HEADER SHRINK ON SCROLL
// ============================================================
window.premiumTheme.initHeaderShrink = function() {
  const header = document.querySelector('.premium-header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', function() {
    const currentScroll = window.scrollY;

    if (currentScroll > 80) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
};

// ============================================================
// BACK TO TOP BUTTON
// ============================================================
window.premiumTheme.initBackToTop = function() {
  const btn = document.getElementById('BackToTop');
  if (!btn) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // Intercept Add to Cart forms for AJAX submission
  document.body.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.action && form.action.includes('/cart/add')) {
      // Only intercept if the trigger was our Add to Cart button
      // This allows Shopify Dynamic Checkout / Buy Now buttons to proceed natively
      if (e.submitter && !e.submitter.classList.contains('action-btn-add')) {
        return;
      }

      e.preventDefault();

      const submitBtn = form.querySelector('.action-btn-add');
      if (submitBtn) {
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;
      }

      const formData = new FormData(form);

      fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.description || data.message || 'Could not add item to cart.');
        }
        return data;
      })
      .then(item => {
        if (submitBtn) {
          submitBtn.textContent = 'Added ✓';
          setTimeout(() => {
            submitBtn.textContent = 'Add to Cart';
            submitBtn.disabled = false;
          }, 1500);
        }
        window.premiumTheme.openCartDrawer();
      })
      .catch(error => {
        console.error('Error adding item to cart:', error);
        if (submitBtn) {
          submitBtn.textContent = 'Failed';
          setTimeout(() => {
            submitBtn.textContent = 'Add to Cart';
            submitBtn.disabled = false;
          }, 2000);
        }
        alert(error.message);
      });
    }
  });

  // Attach drawer open listener to header cart icon
  const cartLinks = document.querySelectorAll('.cart-link');
  cartLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      window.premiumTheme.openCartDrawer();
    });
  });

  // Attach mobile menu open listener to hamburger icon
  const mobileToggle = document.querySelector('.header__mobile-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      window.premiumTheme.openMobileMenu();
    });
  }

  // Initialize features
  window.premiumTheme.initScrollReveal();
  window.premiumTheme.initHeaderShrink();
  window.premiumTheme.initBackToTop();
  window.premiumTheme.initSlideshow();
});
