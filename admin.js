// ─── AUTH ─────────────────────────────────────────────────────────────────────

var AUTH_SESSION_KEY = 'cosmo_admin_session';
var SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

function isAuthenticated() {
  try {
    var s = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY));
    return !!(s && s.expires > Date.now());
  } catch (e) { return false; }
}

function createSession() {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ expires: Date.now() + SESSION_DURATION }));
}

function logout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  console.log('[COSMO AUTH] Sesión cerrada.');
  location.reload();
}

async function sha256(str) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function toggleAuthPw(inputId, iconId) {
  var input = document.getElementById(inputId);
  var icon  = document.getElementById(iconId);
  if (!input) return;
  var isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  if (icon) {
    icon.className = isHidden ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  }
}

async function checkAuthOnLoad() {
  // Mostrar overlay inmediatamente — bloquea el panel antes de cualquier await
  localStorage.removeItem(AUTH_SESSION_KEY);
  document.getElementById('auth-overlay').style.display = 'flex';

  console.log('[COSMO AUTH] Verificando config de admin desde Firestore...');
  try {
    var doc = await db.collection('config').doc('admin').get();
    if (!doc.exists || !doc.data().pwHash) {
      console.log('[COSMO AUTH] Sin contraseña configurada — modo setup.');
      showSetupMode();
    } else {
      console.log('[COSMO AUTH] Contraseña encontrada — modo login.');
      showLoginMode();
    }
  } catch (e) {
    console.error('[COSMO AUTH] Error al conectar con Firestore:', e);
    document.getElementById('login-error').textContent = 'Error al conectar con la base de datos. Verificá tu conexión a internet.';
    showLoginMode();
  }
}

function showLoginMode() {
  document.getElementById('auth-login').style.display = '';
  document.getElementById('auth-setup').style.display = 'none';
}

function showSetupMode() {
  document.getElementById('auth-login').style.display = 'none';
  document.getElementById('auth-setup').style.display = '';
}

async function submitLogin() {
  var pw    = document.getElementById('auth-password').value;
  var errEl = document.getElementById('login-error');
  var btn   = document.getElementById('btn-login');
  var card  = btn.closest('.auth-card');
  errEl.textContent = '';
  if (!pw) { errEl.textContent = 'Ingresá tu contraseña.'; return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="auth-spinner"></span>Verificando...';
  console.log('[COSMO AUTH] Intento de login...');
  try {
    var doc    = await db.collection('config').doc('admin').get();
    var stored = doc.data().pwHash;
    var entered = await sha256(pw);
    if (entered === stored) {
      console.log('[COSMO AUTH] ✔ Contraseña correcta — sesión iniciada.');
      createSession();
      document.getElementById('auth-overlay').style.display = 'none';
      await initAdmin();
    } else {
      console.warn('[COSMO AUTH] ✗ Contraseña incorrecta.');
      errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Contraseña incorrecta.';
      if (card) { card.classList.remove('auth-shake'); void card.offsetWidth; card.classList.add('auth-shake'); }
    }
  } catch (e) {
    console.error('[COSMO AUTH] Error al verificar:', e);
    errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Error al verificar. Intentá de nuevo.';
  }
  btn.disabled = false;
  btn.textContent = 'Ingresar';
}

async function submitSetup() {
  var pw1   = document.getElementById('setup-password').value;
  var pw2   = document.getElementById('setup-password2').value;
  var errEl = document.getElementById('setup-error');
  var btn   = document.getElementById('btn-setup');
  var card  = btn.closest('.auth-card');
  errEl.textContent = '';
  if (!pw1 || pw1.length < 6) {
    errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> La contraseña debe tener al menos 6 caracteres.';
    return;
  }
  if (pw1 !== pw2) {
    errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Las contraseñas no coinciden.';
    if (card) { card.classList.remove('auth-shake'); void card.offsetWidth; card.classList.add('auth-shake'); }
    return;
  }
  btn.disabled = true;
  btn.innerHTML = '<span class="auth-spinner"></span>Guardando...';
  console.log('[COSMO AUTH] Configurando contraseña por primera vez...');
  try {
    var hash = await sha256(pw1);
    await db.collection('config').doc('admin').set({ pwHash: hash });
    console.log('[COSMO AUTH] ✔ Contraseña guardada en Firestore.');
    createSession();
    document.getElementById('auth-overlay').style.display = 'none';
    await initAdmin();
  } catch (e) {
    console.error('[COSMO AUTH] Error al guardar contraseña:', e);
    errEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Error al guardar. Verificá tu conexión.';
  }
  btn.disabled = false;
  btn.textContent = 'Crear contraseña';
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

var CAT_STYLES_STORE = {
  collares: { bg: '#F9E5EA',   icon: 'fa-link'       },
  pulseras: { bg: '#F5F0E8',   icon: 'fa-gem'        },
  aros:     { bg: '#E8E2F5',   icon: 'fa-circle-dot' },
  anillos:  { bg: '#222222',   icon: 'fa-ring'       },
};

var DEFAULT_TICKER = [
  'Envíos a todo el país',
  'Nuevos ingresos cada semana',
  'Bijou sin níquel · hipoalergénico',
  'Pagos en cuotas sin interés',
  '+500 clientas satisfechas',
];

var DEFAULT_HERO = {
  tag:   '✦ Nueva colección 2025',
  title: 'Accesorios que <em>hablan</em> por vos.',
  sub:   'Accesorios con estética urbana. Diseñadas para vos, que no pasas desapercibid@.',
};

var DEFAULT_CONFIG = {
  whatsapp:        '5493537600803',
  freeShippingMin: 8000,
  shippingCost:    1200,
};

// ─── STATE ────────────────────────────────────────────────────────────────────

var db;
var products     = [];
var categories   = [
  { id: 1, name: 'Collares', icon: 'fa-link',       catKey: 'collares', img: '' },
  { id: 2, name: 'Pulseras', icon: 'fa-gem',        catKey: 'pulseras', img: '' },
  { id: 3, name: 'Aros',     icon: 'fa-circle-dot', catKey: 'aros',     img: '' },
  { id: 4, name: 'Anillos',  icon: 'fa-ring',       catKey: 'anillos',  img: '' },
];
var orders       = [];
var drops        = [];
var looksData    = [];
var tickerItems  = [];
var heroData     = {};
var storeConfig  = Object.assign({}, DEFAULT_CONFIG);
var editingId    = null;
var editingLookId = null;
var editingCatId = null;
var nextId       = 1;

// ─── FIRESTORE INIT ───────────────────────────────────────────────────────────

async function initAdmin() {
  await Promise.all([
    loadProducts(),
    loadConfig(),
    loadOrders(),
    loadDrops(),
    loadLooks(),
  ]);
  renderAll();
}

async function loadProducts() {
  try {
    var snap = await db.collection('products').get();
    if (!snap.empty) {
      products = snap.docs.map(function (d) { return d.data(); });
      products.sort(function (a, b) { return a.id - b.id; });
      nextId = Math.max.apply(null, products.map(function (p) { return p.id; })) + 1;
    } else {
      // One-time migration from localStorage if data exists
      try {
        var saved = localStorage.getItem('cosmo_products');
        if (saved) {
          var data = JSON.parse(saved);
          if (Array.isArray(data) && data.length) {
            products = data;
            nextId = Math.max.apply(null, products.map(function (p) { return p.id; })) + 1;
            var batch = db.batch();
            products.forEach(function (p) {
              batch.set(db.collection('products').doc(String(p.id)), p);
            });
            await batch.commit();
          }
        }
      } catch (e) {}
      products = products.length ? products : [];
    }
  } catch (e) { products = []; }
}

async function loadConfig() {
  try {
    var storeDoc = await db.collection('config').doc('store').get();
    if (storeDoc.exists) {
      var d = storeDoc.data();
      tickerItems = Array.isArray(d.ticker) ? d.ticker : [...DEFAULT_TICKER];
      heroData    = d.hero   || Object.assign({}, DEFAULT_HERO);
      storeConfig = {
        whatsapp:        d.whatsapp        || DEFAULT_CONFIG.whatsapp,
        freeShippingMin: d.freeShippingMin || DEFAULT_CONFIG.freeShippingMin,
        shippingCost:    d.shippingCost    || DEFAULT_CONFIG.shippingCost,
      };
    } else {
      tickerItems = [...DEFAULT_TICKER];
      heroData    = Object.assign({}, DEFAULT_HERO);
      storeConfig = Object.assign({}, DEFAULT_CONFIG);
    }
    // Load category images
    var catDoc = await db.collection('config').doc('categories').get();
    if (catDoc.exists) {
      var imgs = catDoc.data();
      categories.forEach(function (c) { if (imgs[c.catKey]) c.img = imgs[c.catKey]; });
    }
  } catch (e) {
    tickerItems = [...DEFAULT_TICKER];
    heroData    = Object.assign({}, DEFAULT_HERO);
    storeConfig = Object.assign({}, DEFAULT_CONFIG);
  }
}

async function loadOrders() {
  try {
    var snap = await db.collection('orders').get();
    orders = snap.docs.map(function (d) { return Object.assign({ _docId: d.id }, d.data()); });
    orders.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
  } catch (e) { orders = []; }
}

async function loadDrops() {
  try {
    var snap = await db.collection('drops').get();
    drops = snap.docs.map(function (d) { return Object.assign({ _docId: d.id }, d.data()); });
  } catch (e) { drops = []; }
}

async function loadLooks() {
  try {
    var snap = await db.collection('looks').get();
    if (!snap.empty) {
      looksData = snap.docs.map(function (d) { return d.data(); });
      looksData.sort(function (a, b) { return a.id - b.id; });
    } else {
      // One-time migration from localStorage
      try {
        var saved = localStorage.getItem('cosmo_lookbook');
        if (saved) {
          var data = JSON.parse(saved);
          if (Array.isArray(data) && data.length) {
            looksData = data;
            var batch = db.batch();
            looksData.forEach(function (l) {
              batch.set(db.collection('looks').doc(String(l.id)), l);
            });
            await batch.commit();
          }
        }
      } catch (e) {}
      looksData = looksData.length ? looksData : [];
    }
  } catch (e) { looksData = []; }
}

function renderAll() {
  renderProducts();
  renderCategories();
  renderOrders('orders-tbody');
  renderOrders('orders-tbody-dash');
  renderDrops();
  updateDashboardStats();
  renderTickerAdmin();
  renderHeroAdmin();
  renderLooksAdmin();
}

// ─── FIRESTORE PERSIST HELPERS ────────────────────────────────────────────────

async function persistProduct(p) {
  await db.collection('products').doc(String(p.id)).set(p);
}

async function removeProductDoc(id) {
  await db.collection('products').doc(String(id)).delete();
}

async function persistStoreConfig() {
  await db.collection('config').doc('store').set({
    ticker:          tickerItems,
    hero:            heroData,
    whatsapp:        storeConfig.whatsapp,
    freeShippingMin: storeConfig.freeShippingMin,
    shippingCost:    storeConfig.shippingCost,
  });
}

async function persistCatImages() {
  var imgs = {};
  categories.forEach(function (c) { if (c.img) imgs[c.catKey] = c.img; });
  await db.collection('config').doc('categories').set(imgs);
}

async function persistLook(look) {
  await db.collection('looks').doc(String(look.id)).set(look);
}

async function removeLookDoc(id) {
  await db.collection('looks').doc(String(id)).delete();
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function showSection(name, el) {
  document.querySelectorAll('.admin-section').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.sidebar-link').forEach(function (l) { l.classList.remove('active'); });
  document.getElementById('section-' + name).classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('topbar-title').textContent =
    name.charAt(0).toUpperCase() + name.slice(1);
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

function renderProducts(cat) {
  var tbody = document.getElementById('products-tbody');
  var list  = (!cat || cat === 'all') ? products : products.filter(function (p) { return p.cat === cat; });

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-box-open"></i><p>No hay productos en esta categoría.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = list.map(function (p) {
    return '<tr>' +
      '<td style="color:var(--blanco);font-weight:500">' + p.name + '</td>' +
      '<td>' + p.material + '</td>' +
      '<td style="text-transform:capitalize">' + p.cat + '</td>' +
      '<td style="color:var(--blanco);font-weight:600">$' + p.price.toLocaleString('es-AR') + '</td>' +
      '<td>' + (p.oldPrice ? '<span style="color:var(--gris);text-decoration:line-through;font-size:12px">$' + p.oldPrice.toLocaleString('es-AR') + '</span>' : '—') + '</td>' +
      '<td><span class="badge badge-' + (p.badge || 'none') + '">' + (p.badge || '—') + '</span></td>' +
      '<td class="' + (p.stock <= 5 ? 'stock-low' : p.stock <= 10 ? 'stock-mid' : 'stock-ok') + '">' + p.stock + '</td>' +
      '<td><div class="td-actions">' +
        '<button class="btn-ghost" onclick="openProductForm(' + p.id + ')"><i class="fa-solid fa-pen"></i> Editar</button>' +
        '<button class="btn-danger" onclick="deleteProduct(' + p.id + ')"><i class="fa-solid fa-trash"></i></button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function filterProducts(e, cat) {
  document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
  e.currentTarget.classList.add('active');
  renderProducts(cat);
}

function openProductForm(id) {
  var panel   = document.getElementById('product-form-panel');
  var titleEl = document.getElementById('form-panel-title');
  editingId = id || null;

  if (id) {
    var p = products.find(function (x) { return x.id === id; });
    document.getElementById('f-name').value      = p.name;
    document.getElementById('f-material').value  = p.material;
    document.getElementById('f-cat').value        = p.cat;
    document.getElementById('f-price').value      = p.price;
    document.getElementById('f-old-price').value  = p.oldPrice || '';
    document.getElementById('f-badge').value      = p.badge || '';
    document.getElementById('f-stock').value      = p.stock;
    document.getElementById('f-img').value        = p.img || '';
    previewProductImg(p.img || '');
    titleEl.innerHTML = 'Editar producto <button class="btn-close-form" onclick="closeProductForm()"><i class="fa-solid fa-xmark"></i></button>';
  } else {
    document.getElementById('product-form').reset();
    previewProductImg('');
    titleEl.innerHTML = 'Nuevo producto <button class="btn-close-form" onclick="closeProductForm()"><i class="fa-solid fa-xmark"></i></button>';
  }

  panel.classList.add('open');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  switchImgTab('url');
}

function closeProductForm() {
  document.getElementById('product-form-panel').classList.remove('open');
  editingId = null;
}

async function saveProduct() {
  var name     = document.getElementById('f-name').value.trim();
  var material = document.getElementById('f-material').value.trim();
  var cat      = document.getElementById('f-cat').value;
  var price    = parseInt(document.getElementById('f-price').value);
  var oldPrice = parseInt(document.getElementById('f-old-price').value) || null;
  var badge    = document.getElementById('f-badge').value || null;
  var stock    = parseInt(document.getElementById('f-stock').value);
  var img      = document.getElementById('f-img').value.trim();

  if (!name || !material || !cat || isNaN(price) || isNaN(stock)) {
    alert('Completá los campos obligatorios: Nombre, Material, Categoría, Precio y Stock.');
    return;
  }

  var style   = CAT_STYLES_STORE[cat] || { bg: '#F5F0E8', icon: 'fa-star' };
  var product;

  if (editingId) {
    var idx = products.findIndex(function (p) { return p.id === editingId; });
    product = Object.assign({}, products[idx], { name: name, material: material, cat: cat, price: price, oldPrice: oldPrice, badge: badge, stock: stock, img: img, bg: style.bg, icon: style.icon });
    products[idx] = product;
  } else {
    product = { id: nextId++, name: name, material: material, cat: cat, price: price, oldPrice: oldPrice, badge: badge, stock: stock, img: img, bg: style.bg, icon: style.icon };
    products.push(product);
  }

  closeProductForm();
  renderProducts();
  updateDashboardStats();

  try {
    await persistProduct(product);
  } catch (e) {
    alert('Guardado local OK. Error al sincronizar en la nube: ' + e.message);
  }
}

function previewProductImg(url) {
  var el = document.getElementById('f-img-preview');
  if (!el) return;
  if (url && (url.startsWith('http') || url.startsWith('data:'))) {
    el.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML=\'<i class=\\"fa-solid fa-image\\"></i>\'">';
  } else {
    el.innerHTML = '<i class="fa-solid fa-image"></i>';
  }
}

function switchImgTab(tab) {
  document.getElementById('img-input-url').style.display  = tab === 'url'  ? '' : 'none';
  document.getElementById('img-input-file').style.display = tab === 'file' ? '' : 'none';
  document.getElementById('img-tab-url').classList.toggle('active',  tab === 'url');
  document.getElementById('img-tab-file').classList.toggle('active', tab === 'file');
  if (tab === 'url') {
    var fileInput = document.getElementById('f-img-file');
    if (fileInput) fileInput.value = '';
    document.getElementById('f-img-filename').textContent = 'Ningún archivo seleccionado';
    previewProductImg(document.getElementById('f-img').value);
  } else {
    previewProductImg(document.getElementById('f-img').value);
  }
}

function handleImgFile(input) {
  var file = input.files[0];
  if (!file) return;
  var nameEl = document.getElementById('f-img-filename');
  if (nameEl) nameEl.textContent = file.name;
  var reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById('f-img').value = e.target.result;
    previewProductImg(e.target.result);
  };
  reader.readAsDataURL(file);
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
  products = products.filter(function (p) { return p.id !== id; });
  renderProducts();
  updateDashboardStats();
  try {
    await removeProductDoc(id);
  } catch (e) {
    alert('Eliminado localmente. Error al sincronizar: ' + e.message);
  }
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

function renderCategories() {
  var grid = document.getElementById('cats-admin-grid');
  grid.innerHTML = categories.map(function (c) {
    var count = products.filter(function (p) { return p.cat === c.catKey; }).length;
    return '<div class="cat-admin-card">' +
      '<div class="cat-admin-icon" style="' + (c.img ? 'overflow:hidden;border-radius:50%;width:52px;height:52px;' : '') + '">' +
        (c.img
          ? '<img src="' + c.img + '" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">'
          : '<i class="fa-solid ' + c.icon + '"></i>') +
      '</div>' +
      '<div class="cat-admin-name">' + c.name + '</div>' +
      '<div class="cat-admin-count">' + count + ' piezas</div>' +
      '<div class="cat-admin-actions">' +
        '<button class="btn-ghost" onclick="editCategory(' + c.id + ')"><i class="fa-solid fa-pen"></i> Editar</button>' +
        '<button class="btn-danger" onclick="deleteCategory(' + c.id + ')"><i class="fa-solid fa-trash"></i></button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function addCategory() {
  var name = prompt('Nombre de la nueva categoría:');
  if (!name || !name.trim()) return;
  categories.push({ id: Date.now(), name: name.trim(), icon: 'fa-tag', catKey: name.trim().toLowerCase().replace(/\s+/g, '_'), img: '' });
  renderCategories();
}

function editCategory(id) {
  var cat = categories.find(function (c) { return c.id === id; });
  if (!cat) return;
  editingCatId = id;
  document.getElementById('cf-name').value = cat.name;
  document.getElementById('cf-img').value  = cat.img || '';
  previewCatImg(cat.img || '');
  switchCatImgTab('url');
  var catPanel = document.getElementById('cat-form-panel');
  catPanel.classList.add('open');
  catPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('cf-name').focus();
}

function closeCatForm() {
  editingCatId = null;
  document.getElementById('cat-form-panel').classList.remove('open');
  document.getElementById('cf-img-filename').textContent = 'Ningún archivo seleccionado';
}

async function saveCategoryForm() {
  var cat = categories.find(function (c) { return c.id === editingCatId; });
  if (!cat) return;
  var newName = document.getElementById('cf-name').value.trim();
  if (!newName) { alert('El nombre es requerido.'); return; }
  var newImg  = document.getElementById('cf-img').value.trim();
  cat.name = newName;
  cat.img  = newImg;
  try { await persistCatImages(); } catch (e) {}
  renderCategories();
  closeCatForm();
}

function switchCatImgTab(tab) {
  document.getElementById('cat-img-tab-url').classList.toggle('active', tab === 'url');
  document.getElementById('cat-img-tab-file').classList.toggle('active', tab === 'file');
  document.getElementById('cat-img-input-url').style.display  = tab === 'url'  ? '' : 'none';
  document.getElementById('cat-img-input-file').style.display = tab === 'file' ? '' : 'none';
}

function previewCatImg(url) {
  var box = document.getElementById('cf-img-preview');
  if (!box) return;
  if (url && url.trim()) {
    box.style.backgroundImage    = 'url(' + url.trim() + ')';
    box.style.backgroundSize     = 'cover';
    box.style.backgroundPosition = 'center';
    box.innerHTML = '';
  } else {
    box.style.backgroundImage = '';
    box.innerHTML = '<i class="fa-solid fa-image"></i>';
  }
}

function handleCatImgFile(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  document.getElementById('cf-img-filename').textContent = file.name;
  var reader = new FileReader();
  reader.onload = function (e) {
    var b64 = e.target.result;
    document.getElementById('cf-img').value = b64;
    previewCatImg(b64);
  };
  reader.readAsDataURL(file);
}

async function deleteCategory(id) {
  if (!confirm('¿Eliminar esta categoría?')) return;
  categories = categories.filter(function (c) { return c.id !== id; });
  try { await persistCatImages(); } catch (e) {}
  renderCategories();
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

var STATUS_LABELS = {
  pending:   { label: 'Pendiente',  cls: 'status-pending'   },
  shipped:   { label: 'Enviado',    cls: 'status-shipped'   },
  delivered: { label: 'Entregado',  cls: 'status-delivered' },
  cancelled: { label: 'Cancelado',  cls: 'status-cancelled' },
};

function renderOrders(targetId) {
  var tbody = document.getElementById(targetId);
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No hay pedidos registrados todavía.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(function (o) {
    var s = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
    return '<tr>' +
      '<td style="font-weight:600;color:var(--blanco)">' + o.id + '</td>' +
      '<td>' + o.client + '</td>' +
      '<td>' + o.items + '</td>' +
      '<td style="font-weight:600">$' + (o.total || 0).toLocaleString('es-AR') + '</td>' +
      '<td>' + (o.date || '—') + '</td>' +
      '<td><span class="status-pill ' + s.cls + '">' + s.label + '</span></td>' +
      '<td><button class="btn-ghost"><i class="fa-solid fa-eye"></i> Ver</button></td>' +
    '</tr>';
  }).join('');
}

// ─── DROPS ────────────────────────────────────────────────────────────────────

var DROP_STATUS = {
  active:   { label: 'Activo',     cls: 'ds-active'   },
  upcoming: { label: 'Próximo',    cls: 'ds-upcoming' },
  ended:    { label: 'Finalizado', cls: 'ds-ended'    },
};

function renderDrops() {
  var wrap = document.getElementById('drops-wrap');

  if (!drops.length) {
    wrap.innerHTML = '<p style="color:var(--gris);padding:2rem;font-size:13px">No hay drops creados todavía. Usá el botón de arriba para crear el primero.</p>';
    return;
  }

  wrap.innerHTML = drops.map(function (d) {
    var s = DROP_STATUS[d.status] || DROP_STATUS.upcoming;
    return '<div class="drop-card">' +
      '<div>' +
        '<div class="drop-name">' + d.name + '</div>' +
        '<div class="drop-meta">' + d.desc + ' · ' + (d.sold || 0) + '/' + (d.pieces || 0) + ' vendidos</div>' +
      '</div>' +
      '<div class="drop-right">' +
        '<span class="drop-status-pill ' + s.cls + '">' + s.label + '</span>' +
        '<button class="btn-ghost"><i class="fa-solid fa-pen"></i> Editar</button>' +
        '<button class="btn-danger"><i class="fa-solid fa-trash"></i></button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function updateDashboardStats() {
  document.getElementById('stat-total-products').textContent = products.length;
  document.getElementById('stat-low-stock').textContent =
    products.filter(function (p) { return p.stock <= 5; }).length;
  var ordersEl = document.getElementById('stat-orders-today');
  if (ordersEl) ordersEl.textContent = orders.length;
  var salesEl = document.getElementById('stat-sales-today');
  if (salesEl) {
    var total = orders.reduce(function (acc, o) { return acc + (o.total || 0); }, 0);
    salesEl.textContent = '$' + total.toLocaleString('es-AR');
  }
}

// ─── LOOKBOOK ─────────────────────────────────────────────────────────────────

function renderLooksAdmin() {
  var wrap = document.getElementById('looks-admin-wrap');
  if (!wrap) return;

  if (!looksData.length) {
    wrap.innerHTML = '<p style="color:var(--gris);padding:2rem;font-size:13px">No hay looks todavía. Creá el primero con el botón de arriba.</p>';
    return;
  }

  wrap.innerHTML = looksData.map(function (look) {
    var prodNames = (look.products || [])
      .map(function (id) { var p = products.find(function (x) { return x.id === id; }); return p ? p.name : ''; })
      .filter(Boolean).join(', ');
    return '<div class="drop-card" style="border-left:4px solid ' + look.color + ';position:relative">' +
      '<div class="drop-card-header">' +
        '<div>' +
          '<div class="drop-card-title">' + look.name + '</div>' +
          '<div class="drop-card-date" style="margin-top:4px">' + (look.desc || '—') + '</div>' +
        '</div>' +
        '<span class="drop-status-pill" style="background:' + look.color + ';color:' + (look.dark ? '#fff' : '#1A1A1A') + ';border:1px solid rgba(255,255,255,0.15)">' +
          (look.products || []).length + ' pieza' + ((look.products || []).length !== 1 ? 's' : '') +
        '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--gris);margin:6px 0 12px">' + (prodNames || 'Sin productos asignados') + '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btn-ghost" style="font-size:11px" onclick="openLookForm(' + look.id + ')"><i class="fa-solid fa-pen"></i> Editar</button>' +
        '<button class="btn-danger" style="font-size:11px" onclick="deleteLook(' + look.id + ')"><i class="fa-solid fa-trash"></i> Eliminar</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function openLookForm(id) {
  editingLookId = id || null;
  var panel  = document.getElementById('look-form-panel');
  var title  = document.getElementById('look-form-title');
  var checks = document.getElementById('lk-products-check');

  checks.innerHTML = products.map(function (p) {
    return '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;cursor:pointer;font-size:13px;color:#ccc">' +
      '<input type="checkbox" value="' + p.id + '" style="width:14px;height:14px;cursor:pointer">' +
      p.name + ' <span style="color:var(--gris);font-size:11px">(' + p.cat + ')</span>' +
    '</label>';
  }).join('');

  if (id) {
    var look = looksData.find(function (x) { return x.id === id; });
    if (!look) return;
    title.childNodes[0].textContent = 'Editar look';
    document.getElementById('lk-name').value      = look.name;
    document.getElementById('lk-desc').value      = look.desc || '';
    document.getElementById('lk-color').value     = look.color;
    document.getElementById('lk-color-hex').value = look.color;
    document.getElementById('lk-dark').checked    = !!look.dark;
    checks.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
      cb.checked = (look.products || []).includes(parseInt(cb.value));
    });
  } else {
    title.childNodes[0].textContent = 'Nuevo look';
    document.getElementById('lk-name').value      = '';
    document.getElementById('lk-desc').value      = '';
    document.getElementById('lk-color').value     = '#F5F0E8';
    document.getElementById('lk-color-hex').value = '#F5F0E8';
    document.getElementById('lk-dark').checked    = false;
  }

  document.getElementById('lk-color').oninput = function () {
    document.getElementById('lk-color-hex').value = this.value;
  };

  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeLookForm() {
  document.getElementById('look-form-panel').style.display = 'none';
  editingLookId = null;
}

function syncLookColor(val) {
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    document.getElementById('lk-color').value = val;
  }
}

async function saveLook() {
  var name  = document.getElementById('lk-name').value.trim();
  var desc  = document.getElementById('lk-desc').value.trim();
  var color = document.getElementById('lk-color').value;
  var dark  = document.getElementById('lk-dark').checked;
  var prods = Array.from(document.querySelectorAll('#lk-products-check input:checked'))
    .map(function (cb) { return parseInt(cb.value); });

  if (!name) { alert('El nombre del look es obligatorio.'); return; }

  var look;
  if (editingLookId) {
    look = looksData.find(function (x) { return x.id === editingLookId; });
    if (look) Object.assign(look, { name: name, desc: desc, color: color, dark: dark, products: prods });
  } else {
    var newId = looksData.length ? Math.max.apply(null, looksData.map(function (x) { return x.id; })) + 1 : 1;
    look = { id: newId, name: name, desc: desc, color: color, dark: dark, products: prods };
    looksData.push(look);
  }

  closeLookForm();
  renderLooksAdmin();

  try {
    await persistLook(look);
  } catch (e) {
    alert('Guardado local OK. Error al sincronizar: ' + e.message);
  }
}

async function deleteLook(id) {
  if (!confirm('¿Eliminar este look?')) return;
  looksData = looksData.filter(function (x) { return x.id !== id; });
  renderLooksAdmin();
  try {
    await removeLookDoc(id);
  } catch (e) {
    alert('Eliminado localmente. Error al sincronizar: ' + e.message);
  }
}

// ─── TICKER ───────────────────────────────────────────────────────────────────

function renderTickerAdmin() {
  var wrap = document.getElementById('ticker-admin-wrap');
  if (!wrap) return;
  wrap.innerHTML = tickerItems.map(function (item, i) {
    return '<div class="ticker-admin-row">' +
      '<span class="ticker-dot-preview">✦</span>' +
      '<span class="ticker-admin-text">' + item + '</span>' +
      '<div class="td-actions">' +
        '<button class="btn-ghost" onclick="editTickerItem(' + i + ')"><i class="fa-solid fa-pen"></i></button>' +
        '<button class="btn-ghost" onclick="moveTickerItem(' + i + ', -1)"' + (i === 0 ? ' disabled style="opacity:0.3;pointer-events:none"' : '') + '><i class="fa-solid fa-arrow-up"></i></button>' +
        '<button class="btn-ghost" onclick="moveTickerItem(' + i + ', 1)"' + (i === tickerItems.length - 1 ? ' disabled style="opacity:0.3;pointer-events:none"' : '') + '><i class="fa-solid fa-arrow-down"></i></button>' +
        '<button class="btn-danger" onclick="deleteTickerItem(' + i + ')"><i class="fa-solid fa-trash"></i></button>' +
      '</div>' +
    '</div>';
  }).join('');
}

async function saveTicker() {
  try {
    await persistStoreConfig();
    showSaveFeedback('ticker-feedback');
  } catch (e) {
    alert('Error al guardar el ticker: ' + e.message);
  }
}

function addTickerItem() {
  var val = prompt('Texto del mensaje:');
  if (!val || !val.trim()) return;
  tickerItems.push(val.trim());
  saveTicker();
  renderTickerAdmin();
}

function editTickerItem(i) {
  var val = prompt('Editar mensaje:', tickerItems[i]);
  if (val === null || !val.trim()) return;
  tickerItems[i] = val.trim();
  saveTicker();
  renderTickerAdmin();
}

function deleteTickerItem(i) {
  if (tickerItems.length <= 1) { alert('Debe haber al menos un mensaje.'); return; }
  if (!confirm('¿Eliminar este mensaje?')) return;
  tickerItems.splice(i, 1);
  saveTicker();
  renderTickerAdmin();
}

function moveTickerItem(i, dir) {
  var j = i + dir;
  if (j < 0 || j >= tickerItems.length) return;
  var tmp = tickerItems[i]; tickerItems[i] = tickerItems[j]; tickerItems[j] = tmp;
  saveTicker();
  renderTickerAdmin();
}

function resetTicker() {
  if (!confirm('¿Restaurar los mensajes por defecto?')) return;
  tickerItems = [...DEFAULT_TICKER];
  saveTicker();
  renderTickerAdmin();
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function renderHeroAdmin() {
  var tagEl   = document.getElementById('h-tag');
  var titleEl = document.getElementById('h-title');
  var subEl   = document.getElementById('h-sub');
  if (tagEl)   tagEl.value   = heroData.tag   || DEFAULT_HERO.tag;
  if (titleEl) titleEl.value = heroData.title || DEFAULT_HERO.title;
  if (subEl)   subEl.value   = heroData.sub   || DEFAULT_HERO.sub;
}

async function saveHero() {
  heroData.tag   = document.getElementById('h-tag').value.trim()   || DEFAULT_HERO.tag;
  heroData.title = document.getElementById('h-title').value.trim() || DEFAULT_HERO.title;
  heroData.sub   = document.getElementById('h-sub').value.trim()   || DEFAULT_HERO.sub;
  try {
    await persistStoreConfig();
    showSaveFeedback('hero-feedback');
  } catch (e) {
    alert('Error al guardar el hero: ' + e.message);
  }
}

async function resetHero() {
  if (!confirm('¿Restaurar el hero por defecto?')) return;
  heroData = Object.assign({}, DEFAULT_HERO);
  renderHeroAdmin();
  try {
    await persistStoreConfig();
    showSaveFeedback('hero-feedback');
  } catch (e) {
    alert('Error al restaurar: ' + e.message);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function showSaveFeedback(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  setTimeout(function () { el.classList.remove('show'); }, 2000);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  db = firebase.firestore();

  // Dynamic date in topbar
  var dateEl = document.querySelector('.topbar-date');
  if (dateEl) {
    var now    = new Date();
    var MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    dateEl.textContent = now.getDate() + ' ' + MONTHS[now.getMonth()] + ' ' + now.getFullYear();
  }

  checkAuthOnLoad();
});
