// ── PRODUCTS & LOOKS (loaded from Firestore) ───────────────────────────────
var PRODUCTS = [];
var LOOKS    = [];
var FREE_SHIPPING_MIN = 8000;
var SHIPPING_COST     = 1200;
var WHATSAPP          = '5493537600803';

// ── STATE ───────────────────────────────────────────────────────────────────
var cart     = [];
var wishlist = [];

// ── PANELS ──────────────────────────────────────────────────────────────────
function openPanel(id) {
  document.getElementById('panel-overlay').classList.add('open');
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel(id) {
  document.getElementById(id).classList.remove('open');
  var anyOpen = document.querySelectorAll('.side-panel.open').length > 0;
  if (!anyOpen) {
    document.getElementById('panel-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }
}

function closeAllPanels() {
  document.querySelectorAll('.side-panel').forEach(function (el) { el.classList.remove('open'); });
  document.getElementById('panel-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── CART ────────────────────────────────────────────────────────────────────
function openCart() { renderCart(); openPanel('panel-cart'); }

function addToCart(productId) {
  var p = PRODUCTS.find(function (x) { return x.id === productId; });
  if (!p) return;
  var entry = cart.find(function (x) { return x.id === productId; });
  if (entry) { entry.qty++; } else { cart.push({ id: p.id, name: p.name, price: p.price, bg: p.bg, icon: p.icon, qty: 1 }); }
  updateCartBadge();
  renderCart();
  openPanel('panel-cart');
}

function addAllToCart(productIds) {
  productIds.forEach(function (id) {
    var p = PRODUCTS.find(function (x) { return x.id === id; });
    if (!p) return;
    var entry = cart.find(function (x) { return x.id === id; });
    if (entry) { entry.qty++; } else { cart.push({ id: p.id, name: p.name, price: p.price, bg: p.bg, icon: p.icon, qty: 1 }); }
  });
  updateCartBadge();
  renderCart();
  openPanel('panel-cart');
}

function changeQty(productId, delta) {
  var entry = cart.find(function (x) { return x.id === productId; });
  if (!entry) return;
  entry.qty += delta;
  if (entry.qty <= 0) { cart = cart.filter(function (x) { return x.id !== productId; }); }
  updateCartBadge();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(function (x) { return x.id !== productId; });
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  var total = cart.reduce(function (s, c) { return s + c.qty; }, 0);
  var badge = document.getElementById('cart-badge');
  if (badge) { badge.textContent = total; badge.style.display = total > 0 ? 'flex' : 'none'; }
}

function renderCart() {
  var el     = document.getElementById('cart-items');
  var footer = document.getElementById('cart-footer');
  if (!el) return;
  if (!cart.length) {
    el.innerHTML = '<div class="search-empty"><i class="fa-solid fa-cart-shopping"></i>Tu carrito está vacío.</div>';
    if (footer) footer.style.display = 'none';
    return;
  }
  el.innerHTML = cart.map(function (entry) {
    return '<div class="prow">' +
      '<div class="prow-img" style="background:' + entry.bg + '"><i class="fa-solid ' + entry.icon + '"></i></div>' +
      '<div class="prow-info"><div class="prow-name">' + entry.name + '</div>' +
      '<div class="prow-price">$' + entry.price.toLocaleString('es-AR') + '</div></div>' +
      '<div class="prow-actions">' +
        '<div class="qty-ctrl">' +
          '<button class="qty-btn" onclick="changeQty(' + entry.id + ',-1)">−</button>' +
          '<span class="qty-val">' + entry.qty + '</span>' +
          '<button class="qty-btn" onclick="changeQty(' + entry.id + ',1)">+</button>' +
        '</div>' +
        '<button class="btn-prow-remove" onclick="removeFromCart(' + entry.id + ')"><i class="fa-solid fa-xmark"></i></button>' +
      '</div></div>';
  }).join('');
  var subtotal = cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0);
  var shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
  var sub = document.getElementById('cart-subtotal');
  var shi = document.getElementById('cart-shipping');
  var tot = document.getElementById('cart-total');
  if (sub) sub.textContent = '$' + subtotal.toLocaleString('es-AR');
  if (shi) shi.textContent = shipping === 0 ? 'Gratis' : '$' + shipping.toLocaleString('es-AR');
  if (tot) tot.textContent = '$' + (subtotal + shipping).toLocaleString('es-AR');
  if (footer) footer.style.display = '';
}

// ── WISHLIST ─────────────────────────────────────────────────────────────────
function openWishlist() { renderWishlist(); openPanel('panel-wishlist'); }

function toggleWish(productId) {
  var idx = wishlist.indexOf(productId);
  if (idx === -1) { wishlist.push(productId); } else { wishlist.splice(idx, 1); }
  var active = wishlist.includes(productId);
  document.querySelectorAll('[data-wish="' + productId + '"]').forEach(function (btn) {
    btn.classList.toggle('active', active);
    btn.querySelector('i').className = active ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  });
  updateWishBadge();
  renderWishlist();
}

function updateWishBadge() {
  var badge = document.getElementById('wish-badge');
  if (badge) { badge.textContent = wishlist.length; badge.style.display = wishlist.length > 0 ? 'flex' : 'none'; }
}

function renderWishlist() {
  var el = document.getElementById('wishlist-items');
  if (!el) return;
  if (!wishlist.length) {
    el.innerHTML = '<div class="search-empty"><i class="fa-regular fa-heart"></i>Todavía no guardaste ninguna pieza.</div>';
    return;
  }
  var items = PRODUCTS.filter(function (p) { return wishlist.includes(p.id); });
  el.innerHTML = items.map(function (p) {
    return '<div class="prow">' +
      '<div class="prow-img" style="background:' + p.bg + '"><i class="fa-solid ' + p.icon + '"></i></div>' +
      '<div class="prow-info"><div class="prow-name">' + p.name + '</div>' +
      '<div class="prow-price">$' + p.price.toLocaleString('es-AR') + '</div></div>' +
      '<div class="prow-actions">' +
        '<button class="btn-prow-add" onclick="addToCart(' + p.id + ')">+</button>' +
        '<button class="btn-prow-remove" onclick="toggleWish(' + p.id + ')"><i class="fa-solid fa-xmark"></i></button>' +
      '</div></div>';
  }).join('');
}

// ── RENDER LOOKBOOK ──────────────────────────────────────────────────────────
function renderLookbook() {
  var looks = LOOKS;
  var grid  = document.getElementById('lb-grid');
  if (!grid) return;

  if (!looks.length) {
    grid.innerHTML = '<div class="lb-empty"><i class="fa-solid fa-camera"></i>' +
      '<div class="lb-empty-title">No hay looks todavía.</div>' +
      '<p>Creá el primero desde el panel admin.</p></div>';
    return;
  }

  grid.innerHTML = looks.map(function (look, idx) {
    var prods = (look.products || [])
      .map(function (id) { return PRODUCTS.find(function (p) { return p.id === id; }); })
      .filter(Boolean);

    var iconsHTML = prods.map(function (p) {
      return '<div class="lb-card-visual-icon" style="background:' + p.bg + '">' +
        '<i class="fa-solid ' + p.icon + '"></i></div>';
    }).join('');

    var prodsHTML = prods.map(function (p) {
      return '<div class="lb-product-row">' +
        '<div class="lb-product-row-info">' +
          '<div class="lb-product-row-icon" style="background:' + p.bg + '">' +
            '<i class="fa-solid ' + p.icon + '"></i></div>' +
          '<span class="lb-product-row-name">' + p.name + '</span>' +
          '<span class="lb-product-row-price">$' + p.price.toLocaleString('es-AR') + '</span>' +
        '</div>' +
        '<div class="lb-product-row-actions">' +
          '<button class="lb-btn-wish" data-wish="' + p.id + '" onclick="toggleWish(' + p.id + ')" title="Favoritos">' +
            '<i class="fa-regular fa-heart"></i></button>' +
          '<button class="lb-btn-add" onclick="addToCart(' + p.id + ')" title="Agregar al carrito">+</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var allIds = JSON.stringify(look.products || []);

    return '<article class="lb-card' + (look.dark ? ' dark' : '') + '" style="--mood:' + look.color + '">' +
      '<div class="lb-card-visual">' + iconsHTML + '</div>' +
      '<div class="lb-card-body">' +
        '<div class="lb-card-number">Look ' + String(idx + 1).padStart(2, '0') + '</div>' +
        '<h2 class="lb-card-title">' + look.name + '</h2>' +
        '<p class="lb-card-desc">' + (look.desc || '') + '</p>' +
        '<div class="lb-product-list">' + prodsHTML + '</div>' +
        '<button class="lb-btn-all" onclick="addAllToCart(' + allIds + ')">' +
          '<i class="fa-solid fa-bag-shopping" style="margin-right:7px"></i>Agregar todo al carrito' +
        '</button>' +
      '</div>' +
    '</article>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', async function () {
  var db = firebase.firestore();

  // Show loading spinner
  var grid = document.getElementById('lb-grid');
  if (grid) grid.innerHTML = '<div class="lb-empty"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:1.5rem;color:#888"></i></div>';

  try {
    var storeDoc = await db.collection('config').doc('store').get();
    if (storeDoc.exists) {
      var cfg = storeDoc.data();
      if (cfg.freeShippingMin) FREE_SHIPPING_MIN = cfg.freeShippingMin;
      if (cfg.shippingCost)    SHIPPING_COST     = cfg.shippingCost;
      if (cfg.whatsapp)        WHATSAPP          = cfg.whatsapp;
    }
  } catch (e) {}

  try {
    var pSnap = await db.collection('products').get();
    if (!pSnap.empty) {
      PRODUCTS = pSnap.docs.map(function (d) { return d.data(); });
    } else {
      // Fallback to localStorage
      try {
        var lsSaved = localStorage.getItem('cosmo_products');
        if (lsSaved) { var lsData = JSON.parse(lsSaved); if (Array.isArray(lsData)) PRODUCTS = lsData; }
      } catch (le) {}
    }
  } catch (e) {
    try {
      var lsSaved = localStorage.getItem('cosmo_products');
      if (lsSaved) { var lsData = JSON.parse(lsSaved); if (Array.isArray(lsData)) PRODUCTS = lsData; }
    } catch (le) {}
  }

  try {
    var lkSnap = await db.collection('looks').get();
    if (!lkSnap.empty) {
      LOOKS = lkSnap.docs.map(function (d) { return d.data(); });
      LOOKS.sort(function (a, b) { return a.id - b.id; });
    } else {
      // Fallback to localStorage
      try {
        var lkSaved = localStorage.getItem('cosmo_lookbook');
        if (lkSaved) { var lkData = JSON.parse(lkSaved); if (Array.isArray(lkData)) LOOKS = lkData; }
      } catch (le) {}
    }
  } catch (e) {
    try {
      var lkSaved = localStorage.getItem('cosmo_lookbook');
      if (lkSaved) { var lkData = JSON.parse(lkSaved); if (Array.isArray(lkData)) LOOKS = lkData; }
    } catch (le) {}
  }

  renderLookbook();
});
