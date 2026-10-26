var CAT_LABELS = {
  collares: 'Collares',
  pulseras: 'Pulseras',
  aros:     'Aros',
  anillos:  'Anillos',
};

// ── STORE CONFIG ──────────────────────────────────────────────────────────────
var COSMO_CONFIG = {
  whatsapp:        '5493537600803', // número WA para recibir pedidos
  freeShippingMin: 8000,
  shippingCost:    1200,
};

var CAT_STYLES = {
  collares: { bg: '#F9E5EA',   icon: 'fa-link'       },
  pulseras: { bg: '#F5F0E8',   icon: 'fa-gem'        },
  aros:     { bg: '#E8E2F5',   icon: 'fa-circle-dot' },
  anillos:  { bg: '#222222',   icon: 'fa-ring'       },
};

var BADGE_LABELS = { new: 'New', hit: '★ Hit', sale: 'Sale' };

// ── PRODUCT CATALOGUE (default — se sobreescribe con cosmo_products si existe) ─
var PRODUCTS = [
  { id: 1, name: 'Collar Luna',    material: 'Acero bañado en oro', cat: 'collares', price: 4500,  oldPrice: null, badge: 'new',  bg: '#F9E5EA', icon: 'fa-link'       },
  { id: 2, name: 'Aros Viola',     material: 'Resina + metal',       cat: 'aros',     price: 3200,  oldPrice: null, badge: 'hit',  bg: '#E8E2F5', icon: 'fa-circle-dot' },
  { id: 3, name: 'Stack Pack x3',  material: 'Pulseras combinadas',  cat: 'pulseras', price: 5600,  oldPrice: 7000, badge: 'sale', bg: '#F5F0E8', icon: 'fa-gem'        },
  { id: 4, name: 'Anillo Matrix',  material: 'Acero negro',          cat: 'anillos',  price: 2800,  oldPrice: null, badge: 'new',  bg: '#222222', icon: 'fa-ring'       },
  { id: 5, name: 'Layering Set',   material: 'Baño oro 18k',         cat: 'collares', price: 6900,  oldPrice: null, badge: 'hit',  bg: '#FDF5E0', icon: 'fa-star'       },
  { id: 6, name: 'Aros Pétalo',    material: 'Esmalte + plateado',   cat: 'aros',     price: 2500,  oldPrice: 3000, badge: 'sale', bg: '#FBF0F3', icon: 'fa-circle-dot' },
];

// ── STATE ─────────────────────────────────────────────────────────────────────
var cart     = [];   // [{product, qty}]
var wishlist = [];   // [product.id]

// ── PANEL OPEN / CLOSE ────────────────────────────────────────────────────────
function openPanel(id) {
  document.getElementById('panel-overlay').classList.add('open');
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel(id) {
  document.getElementById(id).classList.remove('open');
  // Only remove overlay if no other panel is open
  var anyOpen = document.querySelectorAll('.side-panel.open').length > 0;
  if (!anyOpen) {
    document.getElementById('panel-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }
}

function closeAllPanels() {
  document.querySelectorAll('.side-panel').forEach(function (p) { p.classList.remove('open'); });
  document.getElementById('panel-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── SEARCH ────────────────────────────────────────────────────────────────────
function openSearch() {
  openPanel('panel-search');
  setTimeout(function () { document.getElementById('search-input').focus(); }, 320);
}

function handleSearch(val) {
  var q   = val.trim().toLowerCase();
  var wrap = document.getElementById('search-results');
  if (!q) {
    wrap.innerHTML = '<div class="search-empty"><i class="fa-solid fa-magnifying-glass"></i>Escribí para buscar productos</div>';
    return;
  }
  var results = PRODUCTS.filter(function (p) {
    return p.name.toLowerCase().includes(q) || p.material.toLowerCase().includes(q) || p.cat.includes(q);
  });
  if (!results.length) {
    wrap.innerHTML = '<div class="search-empty"><i class="fa-solid fa-box-open"></i>Sin resultados para "' + val + '"</div>';
    return;
  }
  wrap.innerHTML = results.map(function (p) { return productRow(p, 'search'); }).join('');
}

// ── WISHLIST ──────────────────────────────────────────────────────────────────
function openWishlist() {
  renderWishlist();
  openPanel('panel-wishlist');
}

function toggleWish(productId) {
  var idx = wishlist.indexOf(productId);
  if (idx === -1) { wishlist.push(productId); }
  else            { wishlist.splice(idx, 1);  }
  renderWishlist();
  // Update heart buttons on page
  document.querySelectorAll('.btn-wish[data-id="' + productId + '"]').forEach(function (btn) {
    btn.classList.toggle('active', wishlist.includes(productId));
    btn.querySelector('i').className = wishlist.includes(productId) ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  });
  // Update nav heart badge
  updateWishBadge();
}

function updateWishBadge() {
  var badge = document.getElementById('wish-badge');
  if (!badge) return;
  if (wishlist.length > 0) {
    badge.textContent = wishlist.length;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

function renderWishlist() {
  var wrap = document.getElementById('wishlist-items');
  if (!wrap) return;
  var items = PRODUCTS.filter(function (p) { return wishlist.includes(p.id); });
  if (!items.length) {
    wrap.innerHTML = '<div class="search-empty"><i class="fa-regular fa-heart"></i>Todavía no guardaste ninguna pieza.</div>';
    return;
  }
  wrap.innerHTML = items.map(function (p) { return productRow(p, 'wish'); }).join('');
}

// ── CART ──────────────────────────────────────────────────────────────────────
function openCart() {
  renderCart();
  openPanel('panel-cart');
}

function addToCart(productId) {
  var p   = PRODUCTS.find(function (x) { return x.id === productId; });
  if (!p) return;
  var entry = cart.find(function (e) { return e.product.id === productId; });
  if (entry) { entry.qty++; }
  else       { cart.push({ product: p, qty: 1 }); }
  updateCartBadge();
  renderCart();
  // Visual feedback: briefly open cart panel
  openCart();
}

function changeQty(productId, delta) {
  var entry = cart.find(function (e) { return e.product.id === productId; });
  if (!entry) return;
  entry.qty += delta;
  if (entry.qty <= 0) { cart = cart.filter(function (e) { return e.product.id !== productId; }); }
  updateCartBadge();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(function (e) { return e.product.id !== productId; });
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  var total = cart.reduce(function (acc, e) { return acc + e.qty; }, 0);
  var badge = document.getElementById('cart-badge');
  if (!badge) return;
  badge.textContent = total;
  badge.style.display = total > 0 ? 'inline-flex' : 'none';
}

function renderCart() {
  var wrap   = document.getElementById('cart-items');
  var footer = document.getElementById('cart-footer');
  if (!wrap) return;
  if (!cart.length) {
    wrap.innerHTML = '<div class="search-empty"><i class="fa-solid fa-cart-shopping"></i>Tu carrito está vacío.</div>';
    if (footer) footer.style.display = 'none';
    return;
  }
  wrap.innerHTML = cart.map(function (e) {
    var p = e.product;
    return '<div class="prow" id="cart-row-' + p.id + '">' +
      '<div class="prow-img" style="background:' + p.bg + ';color:#555"><i class="fa-solid ' + p.icon + '"></i></div>' +
      '<div class="prow-info"><div class="prow-name">' + p.name + '</div><div class="prow-sub">' + p.material + '</div></div>' +
      '<div class="qty-ctrl">' +
        '<button class="qty-btn" onclick="changeQty(' + p.id + ',-1)">−</button>' +
        '<span class="qty-val">' + e.qty + '</span>' +
        '<button class="qty-btn" onclick="changeQty(' + p.id + ',1)">+</button>' +
      '</div>' +
      '<span class="prow-price">$' + (p.price * e.qty).toLocaleString('es-AR') + '</span>' +
      '<button class="btn-prow-remove" onclick="removeFromCart(' + p.id + ')"><i class="fa-solid fa-xmark"></i></button>' +
    '</div>';
  }).join('');

  var subtotal = cart.reduce(function (acc, e) { return acc + e.product.price * e.qty; }, 0);
  var shipping = subtotal >= 8000 ? 0 : 1200;
  if (footer) {
    footer.style.display = '';
    document.getElementById('cart-subtotal').textContent = '$' + subtotal.toLocaleString('es-AR');
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'Gratis' : '$' + shipping.toLocaleString('es-AR');
    document.getElementById('cart-total').textContent    = '$' + (subtotal + shipping).toLocaleString('es-AR');
  }
}

// ── SHARED PRODUCT ROW RENDERER ───────────────────────────────────────────────
function productRow(p, context) {
  var inWish = wishlist.includes(p.id);
  var actionBtn = context === 'wish'
    ? '<button class="btn-prow-remove" onclick="toggleWish(' + p.id + ')"><i class="fa-solid fa-xmark"></i></button>'
    : '<button class="btn-prow-add" onclick="addToCart(' + p.id + ')">+</button>';
  return '<div class="prow">' +
    '<div class="prow-img" style="background:' + p.bg + ';color:#555"><i class="fa-solid ' + p.icon + '"></i></div>' +
    '<div class="prow-info"><div class="prow-name">' + p.name + '</div><div class="prow-sub">' + p.material + '</div></div>' +
    '<span class="prow-price">$' + p.price.toLocaleString('es-AR') + '</span>' +
    actionBtn +
  '</div>';
}

// ── goToCategory ─────────────────────────────────────────────────────────────
// Called by category cards, nav links, hero cards, and buttons.
// cat = string key ('collares', 'aros', etc.) or null for "ver todos".

function goToCategory(cat) {
  // Flash the matching cat-card with a pulse animation
  document.querySelectorAll('.cat-card[data-cat]').forEach(function (el) {
    if (cat && el.dataset.cat === cat) {
      el.classList.remove('pulsing');
      // Force reflow so animation restarts if clicked twice
      void el.offsetWidth;
      el.classList.add('pulsing');
      setTimeout(function () { el.classList.remove('pulsing'); }, 320);
    }
  });

  // Smooth-scroll to the catalog section (offset 70px for sticky nav)
  var section = document.getElementById('seccion-catalogo');
  if (section) {
    var top = section.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // Apply the filter slightly after scroll starts so it feels sequential
  setTimeout(function () { applyFilter(cat); }, 320);
}

// ── applyFilter ──────────────────────────────────────────────────────────────

function applyFilter(cat) {
  var cards = document.querySelectorAll('.product-card[data-cat]');
  var bar   = document.getElementById('filter-bar');
  var chip  = document.getElementById('filter-chip-label');
  var count = document.getElementById('filter-count');
  var title = document.getElementById('catalog-title');

  // Phase 1: fade all cards out
  cards.forEach(function (c) {
    c.classList.add('cat-hide');
    c.classList.remove('cat-show');
  });

  setTimeout(function () {
    var matching = 0;
    var delay    = 0;

    cards.forEach(function (c) {
      var match = !cat || c.dataset.cat === cat;
      c.classList.remove('cat-hide');

      if (match) {
        matching++;
        c.style.display = '';
        // Stagger entrance animation
        (function (card, d) {
          setTimeout(function () {
            card.classList.add('cat-show');
            setTimeout(function () { card.classList.remove('cat-show'); }, 420);
          }, d);
        })(c, delay);
        delay += 60;
      } else {
        c.style.display = 'none';
      }
    });

    // Update filter bar
    if (bar) {
      if (cat) {
        bar.classList.add('visible');
        if (chip)  chip.textContent  = CAT_LABELS[cat] || cat;
        if (count) count.textContent = matching + ' ' + (matching === 1 ? 'pieza' : 'piezas');
      } else {
        bar.classList.remove('visible');
      }
    }

    // Update section title
    if (title) {
      title.textContent = cat ? (CAT_LABELS[cat] || cat) : 'Más vendidos';
    }
  }, 210);
}

// ── clearFilter ──────────────────────────────────────────────────────────────

function clearFilter() {
  applyFilter(null);
}

// ── applyStoredImages ─────────────────────────────────────────────────────────
// Reads cosmo_product_imgs and cosmo_cat_imgs from localStorage and applies them
// to the store cards. Runs on DOMContentLoaded.

function applyStoredImages() {
  // ── Products ──────────────────────────────────────────────────────────────
  var productImgs = {};
  try { productImgs = JSON.parse(localStorage.getItem('cosmo_product_imgs') || '{}'); } catch (e) {}

  Object.keys(productImgs).forEach(function (id) {
    var url  = productImgs[id];
    if (!url) return;
    var card = document.querySelector('[data-product-id="' + id + '"]');
    if (!card) return;
    var imgWrap = card.querySelector('.product-img');
    if (!imgWrap) return;
    // Remove existing icon, keep badge
    var badge = imgWrap.querySelector('.product-badge');
    imgWrap.innerHTML = '';
    var img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.className = 'product-real-img';
    img.onerror = function () { this.remove(); };
    imgWrap.appendChild(img);
    if (badge) imgWrap.appendChild(badge);
  });

  // ── Categories ────────────────────────────────────────────────────────────
  var catImgs = {};
  try { catImgs = JSON.parse(localStorage.getItem('cosmo_cat_imgs') || '{}'); } catch (e) {}

  Object.keys(catImgs).forEach(function (catKey) {
    var url  = catImgs[catKey];
    if (!url) return;
    var card = document.querySelector('.cat-card[data-cat="' + catKey + '"]');
    if (!card) return;
    var icon = card.querySelector('.cat-icon');
    card.style.backgroundImage    = 'url(' + url + ')';
    card.style.backgroundSize     = 'cover';
    card.style.backgroundPosition = 'center';
    if (icon) icon.style.display  = 'none';
  });
}

// ── RENDER PRODUCT GRID ──────────────────────────────────────────────────────
function renderProductGrid() {
  var grid = document.getElementById('products-grid');
  if (!grid) return;

  if (!PRODUCTS.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gris)">No hay productos disponibles.</div>';
    return;
  }

  grid.innerHTML = PRODUCTS.map(function (p) {
    var style    = CAT_STYLES[p.cat] || { bg: '#F5F0E8', icon: 'fa-star' };
    var bg       = p.bg   || style.bg;
    var icon     = p.icon || style.icon;
    var iconClr  = p.cat === 'anillos' ? '#888' : '#555';
    var imgHTML  = p.img
      ? '<img src="' + p.img + '" class="product-real-img" alt="" onerror="this.remove()">'
      : '<i class="fa-solid ' + icon + '"></i>';
    var badgeHTML    = p.badge ? '<span class="product-badge badge-' + p.badge + '">' + (BADGE_LABELS[p.badge] || p.badge) + '</span>' : '';
    var oldPriceHTML = p.oldPrice ? '<span class="product-price-old">$' + Number(p.oldPrice).toLocaleString('es-AR') + '</span>' : '';
    var agotado      = (p.stock === 0) ? '<span class="product-badge" style="background:#444;color:#ccc;top:auto;bottom:10px">Agotado</span>' : '';
    var addBtnHTML   = (p.stock === 0)
      ? '<button class="add-btn" disabled style="opacity:0.35;cursor:not-allowed">+</button>'
      : '<button class="add-btn" onclick="addToCart(' + p.id + ')">+</button>';
    var inWish = wishlist.includes(p.id);

    return '<div class="product-card" data-cat="' + p.cat + '" data-product-id="' + p.id + '">' +
      '<div class="product-img" style="background:' + bg + ';color:' + iconClr + '">' +
        badgeHTML + imgHTML + agotado +
      '</div>' +
      '<div class="product-info">' +
        '<div class="product-name">'     + p.name     + '</div>' +
        '<div class="product-material">' + p.material + '</div>' +
        '<div class="product-footer">' +
          '<div><span class="product-price">$' + Number(p.price).toLocaleString('es-AR') + '</span>' + oldPriceHTML + '</div>' +
          '<div style="display:flex;gap:6px">' +
            '<button class="btn-wish' + (inWish ? ' active' : '') + '" data-id="' + p.id + '" onclick="toggleWish(' + p.id + ')" title="Favoritos"><i class="' + (inWish ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i></button>' +
            addBtnHTML +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  updateCategoryCounts();
}

function updateCategoryCounts() {
  var counts = {};
  PRODUCTS.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
  document.querySelectorAll('.cat-card[data-cat]').forEach(function (card) {
    var cat = card.getAttribute('data-cat');
    var el  = card.querySelector('.cat-count');
    if (!el) return;
    var n = counts[cat] || 0;
    el.textContent = n + ' ' + (n === 1 ? 'pieza' : 'piezas');
  });
}

// ── CHECKOUT MODAL ────────────────────────────────────────────────────────────
function checkout() {
  if (!cart.length) return;
  closeAllPanels();

  // Build order summary strip
  var subtotal = cart.reduce(function (acc, e) { return acc + e.product.price * e.qty; }, 0);
  var shipping = subtotal >= COSMO_CONFIG.freeShippingMin ? 0 : COSMO_CONFIG.shippingCost;
  var total    = subtotal + shipping;

  var summaryEl = document.getElementById('co-summary');
  summaryEl.innerHTML =
    cart.map(function (e) {
      return '<span class="co-summary-item">' + e.product.name + ' x' + e.qty + '</span>';
    }).join('') +
    '<span class="co-summary-total">Total $' + total.toLocaleString('es-AR') +
    (shipping === 0 ? ' · <span style="color:#25D366;font-size:11px">Envío gratis 🎉</span>' :
     ' · Envío $' + shipping.toLocaleString('es-AR')) + '</span>';

  // Reset form state
  document.getElementById('co-form-wrap').style.display = '';
  document.getElementById('co-success').style.display   = 'none';
  document.getElementById('co-error').textContent       = '';

  document.getElementById('co-overlay').classList.add('open');
}

function closeCheckout(force) {
  if (force === true || (force && force.target === document.getElementById('co-overlay'))) {
    document.getElementById('co-overlay').classList.remove('open');
  }
}

async function submitCheckout() {
  var name     = document.getElementById('co-name').value.trim();
  var phone    = document.getElementById('co-phone').value.trim();
  var province = document.getElementById('co-province').value;
  var city     = document.getElementById('co-city').value.trim();
  var shipping = document.querySelector('input[name="co-shipping"]:checked');
  var payment  = document.querySelector('input[name="co-payment"]:checked');
  var notes    = document.getElementById('co-notes').value.trim();
  var errEl    = document.getElementById('co-error');
  var btn      = document.getElementById('co-submit-btn');

  errEl.textContent = '';
  if (!name)     { errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Ingresá tu nombre.'; return; }
  if (!phone)    { errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Ingresá tu WhatsApp.'; return; }
  if (!province) { errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Seleccioná una provincia.'; return; }
  if (!city)     { errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Ingresá tu ciudad.'; return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Guardando...';

  var subtotal    = cart.reduce(function (acc, e) { return acc + e.product.price * e.qty; }, 0);
  var shippingAmt = subtotal >= COSMO_CONFIG.freeShippingMin ? 0 : COSMO_CONFIG.shippingCost;
  var total       = subtotal + shippingAmt;
  var orderId     = 'ORD-' + Date.now();
  var shippingVal = shipping ? shipping.value : 'correo';
  var paymentVal  = payment  ? payment.value  : 'transferencia';

  var orderData = {
    id:       orderId,
    date:     new Date().toISOString(),
    status:   'pending',
    customer: { name: name, phone: phone, province: province, city: city },
    items:    cart.map(function (e) {
      return { name: e.product.name, price: e.product.price, qty: e.qty, total: e.product.price * e.qty };
    }),
    subtotal:       subtotal,
    shipping:       shippingAmt,
    total:          total,
    shippingMethod: shippingVal,
    paymentMethod:  paymentVal,
    notes:          notes,
    via:            'whatsapp'
  };

  // Save to Firestore
  try {
    var db = firebase.firestore();
    await db.collection('orders').doc(orderId).set(orderData);
    console.log('[COSMO] Pedido guardado en Firestore:', orderId);
  } catch (e) {
    console.warn('[COSMO] No se pudo guardar en Firestore, continuando con WA:', e);
  }

  // Build WhatsApp message
  var shippingLabels = { correo: 'Correo Argentino', andreani: 'Andreani', retiro: 'Retiro acordado' };
  var paymentLabels  = { transferencia: 'Transferencia bancaria', mercadopago: 'Mercado Pago', efectivo: 'Efectivo' };

  var lines = cart.map(function (e) {
    return '• ' + e.product.name + ' x' + e.qty + ' — $' + (e.product.price * e.qty).toLocaleString('es-AR');
  });

  var msg = '🛒 *Nuevo pedido — COSMO*\n' +
    '📋 *N°:* ' + orderId + '\n\n' +
    lines.join('\n') + '\n\n' +
    '*Subtotal:* $' + subtotal.toLocaleString('es-AR') + '\n' +
    '*Envío:* ' + (shippingAmt === 0 ? 'Gratis 🎉' : '$' + shippingAmt.toLocaleString('es-AR')) + '\n' +
    '*Total: $' + total.toLocaleString('es-AR') + '*\n\n' +
    '👤 *Cliente:* ' + name + '\n' +
    '📱 *Tel:* ' + phone + '\n' +
    '📍 *Ubicación:* ' + city + ', ' + province + '\n' +
    '🚚 *Envío:* ' + (shippingLabels[shippingVal] || shippingVal) + '\n' +
    '💳 *Pago:* ' + (paymentLabels[paymentVal] || paymentVal) +
    (notes ? '\n📝 *Notas:* ' + notes : '');

  var waUrl = 'https://wa.me/' + COSMO_CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
  window.open(waUrl, '_blank');

  // Clear cart
  cart = [];
  saveCart();
  renderCart();

  // Show success
  document.getElementById('co-form-wrap').style.display = 'none';
  document.getElementById('co-success-id').textContent  = 'Pedido #' + orderId;
  document.getElementById('co-wa-link').href             = waUrl;
  document.getElementById('co-success').style.display    = '';

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Confirmar pedido por WhatsApp';
}

document.addEventListener('DOMContentLoaded', async function () {
  var db = firebase.firestore();

  // Show loading state while fetching
  var grid = document.getElementById('products-grid');
  if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gris)"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:1.5rem"></i></div>';

  try {
    // Load store config (whatsapp, shipping, hero, ticker)
    var storeDoc = await db.collection('config').doc('store').get();
    if (storeDoc.exists) {
      var cfg = storeDoc.data();
      if (cfg.whatsapp)        COSMO_CONFIG.whatsapp        = cfg.whatsapp;
      if (cfg.freeShippingMin) COSMO_CONFIG.freeShippingMin = cfg.freeShippingMin;
      if (cfg.shippingCost)    COSMO_CONFIG.shippingCost    = cfg.shippingCost;

      // Apply hero text
      if (cfg.hero) {
        var tagEl   = document.querySelector('.hero-tag');
        var titleEl = document.querySelector('.hero-title');
        var subEl   = document.querySelector('.hero-sub');
        if (tagEl   && cfg.hero.tag)   tagEl.textContent = cfg.hero.tag;
        if (titleEl && cfg.hero.title) titleEl.innerHTML  = cfg.hero.title;
        if (subEl   && cfg.hero.sub)   subEl.textContent  = cfg.hero.sub;
      }

      // Apply ticker
      if (Array.isArray(cfg.ticker) && cfg.ticker.length) {
        var inner = document.getElementById('ticker');
        if (inner) {
          var double = cfg.ticker.concat(cfg.ticker);
          inner.innerHTML = double.map(function (t) {
            return '<span>' + t + '<span class="ticker-dot">✦</span></span>';
          }).join('');
        }
      }

      // Update footer WhatsApp links dynamically
      if (cfg.whatsapp) {
        document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
          a.href = 'https://wa.me/' + cfg.whatsapp;
        });
      }
    }
  } catch (e) {}

  try {
    // Load products from Firestore
    var snap = await db.collection('products').get();
    if (!snap.empty) {
      PRODUCTS = snap.docs.map(function (d) { return d.data(); });
      PRODUCTS.sort(function (a, b) { return a.id - b.id; });
    } else {
      // Fallback to localStorage (backward compat)
      try {
        var saved = localStorage.getItem('cosmo_products');
        if (saved) {
          var data = JSON.parse(saved);
          if (Array.isArray(data) && data.length) PRODUCTS = data;
        }
      } catch (le) {}
    }
  } catch (e) {
    // Network error — fallback to localStorage
    try {
      var saved = localStorage.getItem('cosmo_products');
      if (saved) {
        var data = JSON.parse(saved);
        if (Array.isArray(data) && data.length) PRODUCTS = data;
      }
    } catch (le) {}
  }

  renderProductGrid();

  try {
    // Load category images from Firestore
    var catDoc = await db.collection('config').doc('categories').get();
    if (catDoc.exists) {
      var catImgs = catDoc.data();
      Object.keys(catImgs).forEach(function (catKey) {
        var url  = catImgs[catKey];
        if (!url) return;
        var card = document.querySelector('.cat-card[data-cat="' + catKey + '"]');
        if (!card) return;
        var icon = card.querySelector('.cat-icon');
        card.style.backgroundImage    = 'url(' + url + ')';
        card.style.backgroundSize     = 'cover';
        card.style.backgroundPosition = 'center';
        if (icon) icon.style.display  = 'none';
      });
    }
  } catch (e) {}
});
