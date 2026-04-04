let docType = 'Invoice';
let logoDataUrl = '';
let items = [{ name: '', qty: 1, price: '' }];

// ── THEME ──────────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('theme-icon').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('theme-label').textContent = isDark ? 'Dark' : 'Light';
  localStorage.setItem('invoice-theme', isDark ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('invoice-theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.getElementById('theme-icon').textContent = '☀️';
  document.getElementById('theme-label').textContent = 'Light';
}

// ── INIT DATE ──────────────────────────────────────────────
document.getElementById('doc-date').value = new Date().toISOString().split('T')[0];

// ── DOC TYPE ───────────────────────────────────────────────
function setType(t) {
  docType = t;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.textContent.includes(t)));
  document.getElementById('preview-type-label').textContent = t;
  renderPreview();
}

// ── LOGO ───────────────────────────────────────────────────
function handleLogo(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    logoDataUrl = ev.target.result;
    const prev = document.getElementById('logo-preview');
    prev.src = logoDataUrl;
    prev.classList.add('show');
    renderPreview();
  };
  reader.readAsDataURL(file);
}

// ── ITEMS ──────────────────────────────────────────────────
function buildItemRow(i) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.dataset.index = i;
  row.innerHTML = `
    <div class="field">
      <label>${i === 0 ? 'Item / Service Name' : ''}</label>
      <input type="text" data-field="name" data-idx="${i}"
        placeholder="e.g. Mauve scrubs" value="${esc(items[i].name)}" autocomplete="off">
    </div>
    <div class="field">
      <label>${i === 0 ? 'Qty' : ''}</label>
      <input type="number" data-field="qty" data-idx="${i}" min="1" placeholder="1" value="${items[i].qty}">
    </div>
    <div class="field">
      <label>${i === 0 ? 'Unit Price' : ''}</label>
      <input type="number" data-field="price" data-idx="${i}" placeholder="0.00" value="${items[i].price}">
    </div>
    <button class="btn-remove" data-remove="${i}" title="Remove">✕</button>
  `;
  return row;
}

function syncItemRows() {
  const container = document.getElementById('items-container');
  for (let i = container.querySelectorAll('.item-row').length; i < items.length; i++) {
    container.appendChild(buildItemRow(i));
  }
  while (container.querySelectorAll('.item-row').length > items.length) {
    container.lastElementChild.remove();
  }
}

function rebuildAllItemRows() {
  const container = document.getElementById('items-container');
  container.innerHTML = '';
  items.forEach((_, i) => container.appendChild(buildItemRow(i)));
}

const itemsContainer = document.getElementById('items-container');

itemsContainer.addEventListener('input', e => {
  const inp = e.target.closest('input[data-field]');
  if (!inp) return;
  const idx = parseInt(inp.dataset.idx);
  const field = inp.dataset.field;
  items[idx][field] = inp.value;
  renderPreview();
});

itemsContainer.addEventListener('click', e => {
  const btn = e.target.closest('[data-remove]');
  if (!btn || items.length === 1) return;
  items.splice(parseInt(btn.dataset.remove), 1);
  rebuildAllItemRows();
  renderPreview();
});

function addItem() {
  items.push({ name: '', qty: 1, price: '' });
  syncItemRows();
  const rows = itemsContainer.querySelectorAll('.item-row');
  rows[rows.length - 1].querySelector('input[data-field="name"]').focus();
}

// ── HELPERS ────────────────────────────────────────────────
function esc(s) {
  return (s || '').replace(/"/g, '&quot;');
}

function fmt(n) {
  const currency = document.getElementById('currency').value || 'KSh';
  return `${currency} ${parseFloat(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ── RENDER ─────────────────────────────────────────────────
function render() {
  renderPreview();
}

function renderPreview() {
  const bizName  = document.getElementById('biz-name').value || 'Your Business';
  const tagline  = document.getElementById('biz-tagline').value;
  const phone    = document.getElementById('biz-phone').value;
  const email    = document.getElementById('biz-email').value;
  const payment  = document.getElementById('biz-payment').value;
  const fromName = document.getElementById('from-name').value || bizName;
  const toName   = document.getElementById('to-name').value || 'Customer';
  const toDetail = document.getElementById('to-detail').value;
  const dateVal  = document.getElementById('doc-date').value;
  const dateStr  = dateVal
    ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Today';
  const docNum   = document.getElementById('doc-number').value || `${docType.toUpperCase()}-0001`;
  const notes    = document.getElementById('doc-notes').value;
  const shipping = parseFloat(document.getElementById('shipping').value) || 0;
  const discount = parseFloat(document.getElementById('discount').value) || 0;

  const subtotal  = items.reduce((s, it) => s + (parseFloat(it.qty) || 1) * (parseFloat(it.price) || 0), 0);
  const total     = Math.max(0, subtotal + shipping - discount);
  const itemCount = items.reduce((s, it) => s + (parseFloat(it.qty) || 1), 0);

  const logoHtml = logoDataUrl
    ? `<img class="doc-logo-img" src="${logoDataUrl}" alt="logo">`
    : `<div style="width:72px;height:72px;background:#0d7b6e;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:4px;">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 4C10.268 4 4 10.268 4 18s6.268 14 14 14 14-6.268 14-14S25.732 4 18 4zm0 6v8l5 3"
            stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
       </div>`;

  const itemsRows = items.map(it => {
    const lineTotal = (parseFloat(it.qty) || 1) * (parseFloat(it.price) || 0);
    return `<tr>
      <td><span class="item-desc">${it.name || '—'}</span></td>
      <td style="text-align:center">${it.qty || 1}</td>
      <td style="text-align:right">${fmt(it.price)}</td>
      <td style="text-align:right">${fmt(lineTotal)}</td>
    </tr>`;
  }).join('');

  const contactBar = (phone || email || payment) ? `
    <div class="doc-contact-bar">
      ${payment ? `<span>💳 ${payment}</span>` : ''}
      <span>
        ${phone ? `📞 ${phone}` : ''}
        ${email ? `&nbsp;&nbsp;✉️ ${email}` : ''}
      </span>
    </div>` : '';

  const shippingRow = shipping > 0
    ? `<tr><td style="color:#4a5568">Shipping</td><td>${fmt(shipping)}</td></tr>`
    : `<tr><td style="color:#4a5568">Shipping</td><td>FREE</td></tr>`;
  const discountRow = discount > 0
    ? `<tr><td style="color:#4a5568">Discount</td><td>-${fmt(discount)}</td></tr>`
    : '';

  document.getElementById('doc-output').innerHTML = `
    <div class="doc-logo-area">
      ${logoHtml}
      <div class="doc-company-name">${bizName}</div>
      ${tagline ? `<div class="doc-tagline">${tagline}</div>` : ''}
    </div>

    ${contactBar}

    <div class="doc-meta">
      <div>
        <div class="doc-doc-type">${docType}</div>
        <div class="doc-meta-date">${dateStr}</div>
        <div class="doc-order-id" style="margin-top:6px"><strong>#${docNum}</strong></div>
      </div>
      <div class="doc-from-to">
        <div class="doc-party">
          <div class="party-label">From</div>
          <div class="party-name">${fromName}</div>
        </div>
        <div class="doc-party">
          <div class="party-label">To</div>
          <div class="party-name">${toName}</div>
          ${toDetail ? `<div class="party-detail">${toDetail}</div>` : ''}
        </div>
      </div>
    </div>

    <table class="doc-items">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <table class="doc-totals" style="margin-left:auto;width:240px">
      <tr><td style="color:#4a5568">${itemCount} Item${itemCount !== 1 ? 's' : ''}</td><td>${fmt(subtotal)}</td></tr>
      ${shippingRow}
      ${discountRow}
      <tr class="total-row"><td>Total</td><td>${fmt(total)}</td></tr>
    </table>

    ${notes ? `<div class="doc-notes"><strong>Notes</strong>${notes}</div>` : ''}

    <div class="doc-footer">
      <strong>Thank you for your order!</strong>
      ${payment || ''}
    </div>
  `;

  document.getElementById('preview-type-label').textContent = docType;
}

// ── TRACKING ───────────────────────────────────────────────
// 👇 Paste your Google Apps Script Web App URL here ONCE — tracking works for everyone automatically
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxldZ5g1IwAN8Pac_xXckZ44Nc1NXSTIDrnFLNddnpJ8lyegdEEtq-6ZvDMFaw_zp_yVg/exec';

let currentUser = { name: 'Anonymous', role: '' };
let sheetUrl = SHEET_URL;
let trackingActive = false;

// Hide the setup banner if URL is already baked in
const setupBanner = document.getElementById('setup-banner');
if (sheetUrl && sheetUrl !== 'https://script.google.com/macros/s/AKfycbxldZ5g1IwAN8Pac_xXckZ44Nc1NXSTIDrnFLNddnpJ8lyegdEEtq-6ZvDMFaw_zp_yVg/exec') {
  if (setupBanner) setupBanner.style.display = 'none';
}

const sessionUser = sessionStorage.getItem('invoice-user');
if (sessionUser) {
  currentUser = JSON.parse(sessionUser);
  document.getElementById('login-modal').style.display = 'none';
  trackSession('page_open');
} else {
  setTimeout(() => document.getElementById('modal-name').focus(), 300);
  document.getElementById('modal-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitLogin();
  });
}

function submitLogin() {
  const name = document.getElementById('modal-name').value.trim() || 'Anonymous';
  const role = document.getElementById('modal-role').value.trim();
  currentUser = { name, role };
  sessionStorage.setItem('invoice-user', JSON.stringify(currentUser));
  document.getElementById('login-modal').style.display = 'none';
  trackSession('page_open');
}

function skipLogin() {
  currentUser = { name: 'Anonymous', role: 'Skipped' };
  sessionStorage.setItem('invoice-user', JSON.stringify(currentUser));
  document.getElementById('login-modal').style.display = 'none';
  trackSession('page_open');
}

function setTrackingPill(active) {
  trackingActive = active;
  const dot  = document.getElementById('track-dot');
  const text = document.getElementById('track-pill-text');
  if (active) {
    dot.classList.add('live');
    text.textContent = `Tracking: ${currentUser.name}`;
  } else {
    dot.classList.remove('live');
    text.textContent = 'Not tracking';
  }
}

function trackSession(eventType) {
  if (currentUser.name !== 'Anonymous') setTrackingPill(!!sheetUrl && sheetUrl !== 'https://script.google.com/macros/s/AKfycbxldZ5g1IwAN8Pac_xXckZ44Nc1NXSTIDrnFLNddnpJ8lyegdEEtq-6ZvDMFaw_zp_yVg/exec');
  if (!sheetUrl || sheetUrl === 'https://script.google.com/macros/s/AKfycbxldZ5g1IwAN8Pac_xXckZ44Nc1NXSTIDrnFLNddnpJ8lyegdEEtq-6ZvDMFaw_zp_yVg/exec') return;
  sendToSheet({
    type: 'session',
    event: eventType,
    user: currentUser.name,
    role: currentUser.role,
    timestamp: new Date().toISOString(),
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    browser: navigator.userAgent.split(') ')[0].split('(')[1] || 'Unknown',
  });
}

function trackDocument() {
  if (!sheetUrl || sheetUrl === 'https://script.google.com/macros/s/AKfycbxldZ5g1IwAN8Pac_xXckZ44Nc1NXSTIDrnFLNddnpJ8lyegdEEtq-6ZvDMFaw_zp_yVg/exec') return;
  const shipping = parseFloat(document.getElementById('shipping').value) || 0;
  const discount = parseFloat(document.getElementById('discount').value) || 0;
  const subtotal = items.reduce((s, it) => s + (parseFloat(it.qty) || 1) * (parseFloat(it.price) || 0), 0);
  sendToSheet({
    type: 'document',
    event: 'generated',
    user: currentUser.name,
    role: currentUser.role,
    docType,
    docNumber: document.getElementById('doc-number').value || 'N/A',
    business: document.getElementById('biz-name').value || 'Unnamed',
    client:   document.getElementById('to-name').value   || 'Unknown',
    itemCount: items.length,
    total: Math.max(0, subtotal + shipping - discount).toFixed(2),
    currency: document.getElementById('currency').value || 'KSh',
    timestamp: new Date().toISOString(),
  });
}

function sendToSheet(payload) {
  if (!sheetUrl || sheetUrl === 'https://script.google.com/macros/s/AKfycbxldZ5g1IwAN8Pac_xXckZ44Nc1NXSTIDrnFLNddnpJ8lyegdEEtq-6ZvDMFaw_zp_yVg/exec') return;
  const body = JSON.stringify(payload);

  // Method 1: sendBeacon — works on Brave/Firefox, bypasses most blockers
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(sheetUrl, blob)) return;
  }

  // Method 2: fetch with text/plain to avoid CORS preflight
  fetch(sheetUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body,
  }).catch(() => {
    // Method 3: image ping — last resort
    const slim = { t: payload.type, u: payload.user, e: payload.event, ts: payload.timestamp };
    new Image().src = sheetUrl + '?data=' + encodeURIComponent(JSON.stringify(slim));
  });
}



// ── INIT ───────────────────────────────────────────────────
syncItemRows();
