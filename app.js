/**
 * Invoice & Receipt Generator - Core Logic
 * Encapsulated in InvoiceApp class for better maintainability and state management.
 */

class InvoiceApp {
  constructor() {
    // 👇 Paste your Google Apps Script Web App URL here
    this.SHEET_URL = 'https://script.google.com/macros/s/AKfycbxldZ5g1IwAN8Pac_xXckZ44Nc1NXSTIDrnFLNddnpJ8lyegdEEtq-6ZvDMFaw_zp_yVg/exec';

    this.state = {
      docType: 'Invoice',
      logoDataUrl: '',
      items: [{ name: '', qty: 1, price: '' }],
      currentUser: JSON.parse(sessionStorage.getItem('invoice-user')) || { name: 'Anonymous', role: '' },
      theme: localStorage.getItem('invoice-theme') || 'light',
      trackingActive: false
    };

    this.init();
  }

  init() {
    this.applyTheme(this.state.theme);
    this.initEventListeners();
    this.loadPersistedData();
    this.checkLogin();
    this.renderItems();
    this.renderPreview();
    this.checkSetupBanner();

    // Set today's date if not loaded from persistence
    const dateInput = document.getElementById('doc-date');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  initEventListeners() {
    // Theme toggle
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

    // Doc type toggle
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.textContent.includes('Invoice') ? 'Invoice' : 'Receipt';
        this.setDocType(type);
      });
    });

    // Logo upload
    const logoInput = document.querySelector('input[type="file"]');
    if (logoInput) logoInput.addEventListener('change', (e) => this.handleLogo(e));

    // Form inputs (automatic preview and persistence)
    const formInputs = [
      'biz-name', 'biz-tagline', 'biz-phone', 'biz-email', 'biz-payment',
      'from-name', 'to-name', 'to-detail', 'doc-date', 'doc-number',
      'currency', 'shipping', 'discount', 'doc-notes'
    ];

    formInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          this.persistData();
          this.renderPreview();
        });
      }
    });

    // Item container interactions
    const itemsContainer = document.getElementById('items-container');
    if (itemsContainer) {
      itemsContainer.addEventListener('input', (e) => {
        const input = e.target.closest('input[data-field]');
        if (input) {
          const idx = parseInt(input.dataset.idx);
          const field = input.dataset.field;
          this.state.items[idx][field] = input.value;
          this.persistData();
          this.renderPreview();
        }
      });

      itemsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-remove');
        if (btn) {
          const idx = parseInt(btn.dataset.idx);
          this.removeItem(idx);
        }
      });
    }

    // Add item button
    const addItemBtn = document.querySelector('.btn-add-item');
    if (addItemBtn) addItemBtn.addEventListener('click', () => this.addItem());

    // Print/Generate buttons
    const genBtn = document.querySelector('.btn-generate');
    if (genBtn) genBtn.addEventListener('click', () => {
      this.renderPreview();
      this.trackDocument();
    });

    const printBtn = document.querySelector('.btn-print');
    if (printBtn) printBtn.addEventListener('click', () => {
      this.trackDocument();
      window.print();
    });

    // Login modal
    const modalNameInput = document.getElementById('modal-name');
    if (modalNameInput) {
      modalNameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.submitLogin();
      });
    }

    // Window events
    window.addEventListener('load', () => this.trackSession('page_open'));
  }

  // ── THEME ──────────────────────────────────────────────────
  toggleTheme() {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  applyTheme(theme) {
    this.state.theme = theme;
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    localStorage.setItem('invoice-theme', theme);

    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
  }

  // ── DATA PERSISTENCE ───────────────────────────────────────
  persistData() {
    const formData = {
      bizName: document.getElementById('biz-name').value,
      bizTagline: document.getElementById('biz-tagline').value,
      bizPhone: document.getElementById('biz-phone').value,
      bizEmail: document.getElementById('biz-email').value,
      bizPayment: document.getElementById('biz-payment').value,
      fromName: document.getElementById('from-name').value,
      toName: document.getElementById('to-name').value,
      toDetail: document.getElementById('to-detail').value,
      docDate: document.getElementById('doc-date').value,
      docNumber: document.getElementById('doc-number').value,
      currency: document.getElementById('currency').value,
      shipping: document.getElementById('shipping').value,
      discount: document.getElementById('discount').value,
      docNotes: document.getElementById('doc-notes').value,
      items: this.state.items,
      docType: this.state.docType,
      logoDataUrl: this.state.logoDataUrl
    };
    localStorage.setItem('invoice-data-v2', JSON.stringify(formData));
  }

  loadPersistedData() {
    const saved = localStorage.getItem('invoice-data-v2');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      document.getElementById('biz-name').value = data.bizName || '';
      document.getElementById('biz-tagline').value = data.bizTagline || '';
      document.getElementById('biz-phone').value = data.bizPhone || '';
      document.getElementById('biz-email').value = data.bizEmail || '';
      document.getElementById('biz-payment').value = data.bizPayment || '';
      document.getElementById('from-name').value = data.fromName || '';
      document.getElementById('to-name').value = data.toName || '';
      document.getElementById('to-detail').value = data.toDetail || '';
      document.getElementById('doc-date').value = data.docDate || '';
      document.getElementById('doc-number').value = data.docNumber || '';
      document.getElementById('currency').value = data.currency || 'KSh';
      document.getElementById('shipping').value = data.shipping || 0;
      document.getElementById('discount').value = data.discount || 0;
      document.getElementById('doc-notes').value = data.docNotes || '';
      this.state.items = data.items || [{ name: '', qty: 1, price: '' }];
      this.state.docType = data.docType || 'Invoice';
      this.state.logoDataUrl = data.logoDataUrl || '';

      if (this.state.logoDataUrl) {
        const prev = document.getElementById('logo-preview');
        if (prev) {
          prev.src = this.state.logoDataUrl;
          prev.classList.add('show');
        }
      }

      this.updateDocTypeButtons();
    } catch (e) {
      console.error('Failed to load persisted data', e);
    }
  }

  resetForm() {
    if (confirm('Are you sure you want to clear all data?')) {
      localStorage.removeItem('invoice-data-v2');
      location.reload();
    }
  }

  exportData() {
    const data = localStorage.getItem('invoice-data-v2');
    if (!data) return alert('No data to export!');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        localStorage.setItem('invoice-data-v2', JSON.stringify(data));
        location.reload();
      } catch (err) {
        alert('Invalid data file!');
      }
    };
    reader.readAsText(file);
  }

  // ── DOC TYPE ───────────────────────────────────────────────
  setDocType(type) {
    this.state.docType = type;
    this.updateDocTypeButtons();
    this.renderPreview();
    this.persistData();
  }

  updateDocTypeButtons() {
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(this.state.docType));
    });
    const label = document.getElementById('preview-type-label');
    if (label) label.textContent = this.state.docType;
  }

  // ── LOGO ───────────────────────────────────────────────────
  handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      this.state.logoDataUrl = ev.target.result;
      const prev = document.getElementById('logo-preview');
      if (prev) {
        prev.src = this.state.logoDataUrl;
        prev.classList.add('show');
      }
      this.renderPreview();
      this.persistData();
    };
    reader.readAsDataURL(file);
  }

  // ── ITEMS ──────────────────────────────────────────────────
  addItem() {
    this.state.items.push({ name: '', qty: 1, price: '' });
    this.renderItems();
    this.persistData();

    // Auto-focus the new item name
    const rows = document.querySelectorAll('.item-row');
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const input = lastRow.querySelector('input[data-field="name"]');
      if (input) input.focus();
    }
  }

  removeItem(idx) {
    if (this.state.items.length <= 1) return;
    this.state.items.splice(idx, 1);
    this.renderItems();
    this.renderPreview();
    this.persistData();
  }

  renderItems() {
    const container = document.getElementById('items-container');
    if (!container) return;
    container.innerHTML = '';

    this.state.items.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="field">
          <label>${i === 0 ? 'Item / Service Name' : ''}</label>
          <input type="text" data-field="name" data-idx="${i}" placeholder="e.g. Mauve scrubs" value="${this.escapeHTML(item.name)}">
        </div>
        <div class="field">
          <label>${i === 0 ? 'Qty' : ''}</label>
          <input type="number" data-field="qty" data-idx="${i}" min="1" placeholder="1" value="${item.qty}">
        </div>
        <div class="field">
          <label>${i === 0 ? 'Unit Price' : ''}</label>
          <input type="number" data-field="price" data-idx="${i}" placeholder="0.00" value="${item.price}">
        </div>
        <button class="btn-remove" data-idx="${i}" title="Remove">✕</button>
      `;
      container.appendChild(row);
    });
  }

  // ── RENDER PREVIEW ─────────────────────────────────────────
  renderPreview() {
    const bizName  = document.getElementById('biz-name').value || 'Your Business';
    const tagline  = document.getElementById('biz-tagline').value;
    const phone    = document.getElementById('biz-phone').value;
    const email    = document.getElementById('biz-email').value;
    const payment  = document.getElementById('biz-payment').value;
    const fromName = document.getElementById('from-name').value || bizName;
    const toName   = document.getElementById('to-name').value || 'Customer';
    const toDetail = document.getElementById('to-detail').value;
    const dateVal  = document.getElementById('doc-date').value;
    const currency = document.getElementById('currency').value || 'KSh';

    const dateStr  = dateVal
      ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Today';

    const docNum   = document.getElementById('doc-number').value || `${this.state.docType.toUpperCase()}-0001`;
    const notes    = document.getElementById('doc-notes').value;
    const shipping = parseFloat(document.getElementById('shipping').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;

    const subtotal  = this.state.items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
    const total     = Math.max(0, subtotal + shipping - discount);
    const itemCount = this.state.items.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);

    const logoHtml = this.state.logoDataUrl
      ? `<img class="doc-logo-img" src="${this.state.logoDataUrl}" alt="logo">`
      : `<div style="width:72px;height:72px;background:var(--primary);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:4px;">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 4C10.268 4 4 10.268 4 18s6.268 14 14 14 14-6.268 14-14S25.732 4 18 4zm0 6v8l5 3"
              stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
         </div>`;

    const itemsRows = this.state.items.map(it => {
      const lineTotal = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
      return `<tr>
        <td><span class="item-desc">${this.escapeHTML(it.name) || '—'}</span></td>
        <td style="text-align:center">${it.qty || 0}</td>
        <td style="text-align:right">${this.formatCurrency(it.price, currency)}</td>
        <td style="text-align:right">${this.formatCurrency(lineTotal, currency)}</td>
      </tr>`;
    }).join('');

    // Reformatting contact bar (vertical format)
    const contactBar = (phone || email) ? `
      <div class="doc-contact-bar">
        ${phone ? `<div><strong>Contact:</strong> ${this.escapeHTML(phone)}</div>` : ''}
        ${email ? `<div><strong>Email:</strong> ${this.escapeHTML(email)}</div>` : ''}
      </div>` : '';

    const shippingRow = shipping > 0
      ? `<tr><td style="color:var(--text-muted)">Shipping</td><td>${this.formatCurrency(shipping, currency)}</td></tr>`
      : `<tr><td style="color:var(--text-muted)">Shipping</td><td>FREE</td></tr>`;
    const discountRow = discount > 0
      ? `<tr><td style="color:var(--text-muted)">Discount</td><td>-${this.formatCurrency(discount, currency)}</td></tr>`
      : '';

    document.getElementById('doc-output').innerHTML = `
      <div class="doc-logo-area">
        ${logoHtml}
        <div class="doc-company-name">${this.escapeHTML(bizName)}</div>
        ${tagline ? `<div class="doc-tagline">${this.escapeHTML(tagline)}</div>` : ''}
      </div>

      ${contactBar}

      <div class="doc-meta">
        <div>
          <div class="doc-doc-type">${this.state.docType}</div>
          <div class="doc-meta-date">${dateStr}</div>
          <div class="doc-order-id" style="margin-top:6px"><strong>#${this.escapeHTML(docNum)}</strong></div>
        </div>
        <div class="doc-from-to">
          <div class="doc-party">
            <div class="party-label">From</div>
            <div class="party-name">${this.escapeHTML(fromName)}</div>
          </div>
          <div class="doc-party">
            <div class="party-label">To</div>
            <div class="party-name">${this.escapeHTML(toName)}</div>
            ${toDetail ? `<div class="party-detail">${this.escapeHTML(toDetail)}</div>` : ''}
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
        <tr><td style="color:var(--text-muted)">${itemCount} Item${itemCount !== 1 ? 's' : ''}</td><td>${this.formatCurrency(subtotal, currency)}</td></tr>
        ${shippingRow}
        ${discountRow}
        <tr class="total-row"><td>Total</td><td>${this.formatCurrency(total, currency)}</td></tr>
      </table>

      ${notes ? `<div class="doc-notes"><strong>Notes</strong>${this.escapeHTML(notes)}</div>` : ''}

      <div class="doc-footer">
        <strong>Thank you for your order!</strong>
      </div>

      ${payment ? `<div class="doc-payment-footer">💳 ${this.escapeHTML(payment)}</div>` : ''}
    `;

    const typeLabel = document.getElementById('preview-type-label');
    if (typeLabel) typeLabel.textContent = this.state.docType;
  }

  // ── HELPERS ────────────────────────────────────────────────
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  formatCurrency(num, symbol = 'KSh') {
    const val = parseFloat(num) || 0;
    const formatted = new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(val);
    return `${symbol} ${formatted}`;
  }

  // ── TRACKING ───────────────────────────────────────────────
  checkSetupBanner() {
    const setupBanner = document.getElementById('setup-banner');
    if (this.SHEET_URL && !this.SHEET_URL.includes('YOUR_APPS_SCRIPT_URL_HERE')) {
      if (setupBanner) setupBanner.style.display = 'none';
    }
  }

  checkLogin() {
    const modal = document.getElementById('login-modal');
    if (!sessionStorage.getItem('invoice-user')) {
      if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
          const nameInput = document.getElementById('modal-name');
          if (nameInput) nameInput.focus();
        }, 300);
      }
    } else {
      if (modal) modal.style.display = 'none';
      this.updateTrackingPill(true);
    }
  }

  submitLogin() {
    const nameInput = document.getElementById('modal-name');
    const roleInput = document.getElementById('modal-role');
    const name = nameInput.value.trim() || 'Anonymous';
    const role = roleInput.value.trim();
    this.state.currentUser = { name, role };
    sessionStorage.setItem('invoice-user', JSON.stringify(this.state.currentUser));

    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'none';

    this.updateTrackingPill(true);
    this.trackSession('page_open');
  }

  skipLogin() {
    this.state.currentUser = { name: 'Anonymous', role: 'Skipped' };
    sessionStorage.setItem('invoice-user', JSON.stringify(this.state.currentUser));

    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'none';

    this.updateTrackingPill(false);
    this.trackSession('page_open');
  }

  updateTrackingPill(active) {
    const dot = document.getElementById('track-dot');
    const text = document.getElementById('track-pill-text');
    if (dot) dot.classList.toggle('live', active);
    if (text) text.textContent = active ? `Tracking: ${this.state.currentUser.name}` : 'Not tracking';
    this.state.trackingActive = active;
  }

  trackSession(eventType) {
    if (!this.state.trackingActive || !this.SHEET_URL || this.SHEET_URL.includes('YOUR_APPS_SCRIPT_URL_HERE')) return;

    this.sendToSheet({
      type: 'session',
      event: eventType,
      user: this.state.currentUser.name,
      role: this.state.currentUser.role,
      timestamp: new Date().toISOString(),
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      browser: navigator.userAgent.split(') ')[0].split('(')[1] || 'Unknown',
    });
  }

  trackDocument() {
    if (!this.state.trackingActive || !this.SHEET_URL || this.SHEET_URL.includes('YOUR_APPS_SCRIPT_URL_HERE')) return;

    const shipping = parseFloat(document.getElementById('shipping').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const subtotal = this.state.items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);

    this.sendToSheet({
      type: 'document',
      event: 'generated',
      user: this.state.currentUser.name,
      role: this.state.currentUser.role,
      docType: this.state.docType,
      docNumber: document.getElementById('doc-number').value || 'N/A',
      business: document.getElementById('biz-name').value || 'Unnamed',
      client:   document.getElementById('to-name').value   || 'Unknown',
      itemCount: this.state.items.length,
      total: Math.max(0, subtotal + shipping - discount).toFixed(2),
      currency: document.getElementById('currency').value || 'KSh',
      timestamp: new Date().toISOString(),
    });
  }

  sendToSheet(payload) {
    const body = JSON.stringify(payload);

    // Method 1: sendBeacon
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(this.SHEET_URL, blob)) return;
    }

    // Method 2: fetch
    fetch(this.SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body,
    }).catch(err => console.warn('Tracking failed', err));
  }
}

// ── INITIALIZE ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.app = new InvoiceApp();
});

// Helper for inline HTML calls (backwards compatibility if needed)
function submitLogin() { window.app.submitLogin(); }
function skipLogin() { window.app.skipLogin(); }
