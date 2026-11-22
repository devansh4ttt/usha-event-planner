/* ==========================================================================
   Usha Event Planner Farrukhabad — Production Admin Command Center
   6 Tabs: Analytics & Leads, Packages, Add-Ons & Live Offer, Date Calendar,
   Decor Photos (WebP auto-compression), and Family Reviews & Studio Info.
   Includes the 3D Emerald & Brass Event Activity Sphere.
   ========================================================================== */

import { mountAdminEventSphere3D } from './scene3d.js?v=1';

const SLOT_LABELS = {
  home_hero: 'Home Hero & 3D Pavilion',
  home_signature: 'Home Signature Arch Photo',
  about_craft: 'About Us Planning Photo',
  gallery: 'Decor Gallery'
};

const DECOR_CATEGORIES = [
  'Mandap & Stage',
  'Haldi & Mehendi',
  'Floral Entry',
  'Reception & Dining',
  'Birthday & Events',
  'Planning'
];

const LEAD_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'called', label: 'Called' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' }
];

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatINR(n) {
  return '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
}

function formatTs(ms) {
  if (!ms) return '—';
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function apiFetch(url, options = {}) {
  const opts = {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  };
  const res = await fetch(url, opts);
  let data = {};
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/* Browser-side WebP/JPEG compression keeping uploads <= 220 KB for free-tier D1 */
async function compressImageFile(file) {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read the selected image file.'));
      el.src = bitmapUrl;
    });

    const maxEdge = 1200;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (w > maxEdge || h > maxEdge) {
      if (w >= h) {
        h = Math.round((h * maxEdge) / w);
        w = maxEdge;
      } else {
        w = Math.round((w * maxEdge) / h);
        h = maxEdge;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    let mime = 'image/webp';
    let dataUrl = canvas.toDataURL(mime, 0.8);
    if (!dataUrl.startsWith('data:image/webp')) {
      mime = 'image/jpeg';
      dataUrl = canvas.toDataURL(mime, 0.8);
    }

    let quality = 0.72;
    while (dataUrl.length > 320000 && quality >= 0.42) {
      dataUrl = canvas.toDataURL(mime, quality);
      quality -= 0.1;
    }

    if (dataUrl.length > 360000) {
      canvas.width = Math.round(w * 0.75);
      canvas.height = Math.round(h * 0.75);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL(mime, 0.72);
    }

    const kb = Math.round((dataUrl.length * 3) / 4 / 1024);
    return { dataUrl, kb, width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

function showAdminToast(message) {
  let el = document.getElementById('usha-admin-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'usha-admin-toast';
    el.className = 'admin-toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.hidden = true;
  }, 3400);
}

export async function mountAdminApp(rootEl, { onDataChanged } = {}) {
  const cleanups = [];
  let sphereCtrl = null;
  let state = null;
  let activeTab = 'analytics';
  let editingPlanId = null;
  let editingAddonId = null;
  let editingMediaId = null;
  let pendingImageData = '';
  let mediaSlotFilter = 'all';

  function disposeSphere() {
    if (sphereCtrl) {
      sphereCtrl.dispose();
      sphereCtrl = null;
    }
  }
  cleanups.push(disposeSphere);

  /* ---------- Login View ---------- */
  function renderLoginView(errMsg = '', adminConfigured = true) {
    disposeSphere();
    rootEl.innerHTML = `
      <section class="admin-login-wrap">
        <div class="admin-login-card">
          <span class="live-status-pill" style="margin-bottom:10px;">
            <span class="live-pulse-dot" aria-hidden="true"></span>
            <span>Usha Event Planner Control</span>
          </span>
          <h1>Planner Admin Sign In</h1>
          <p>Sign in with your planner password to manage packages, add-ons, booked dates, live offers, decor photos, and event leads.</p>
          ${
            !adminConfigured
              ? `<div class="field-error" style="color:#F5B8C4;margin-bottom:16px;">Set the <strong>ADMIN_PASSWORD</strong> secret in Cloudflare Worker Settings to enable sign-in.</div>`
              : ''
          }
          <form id="adm-login-form" novalidate>
            <div class="form-block" style="margin-bottom:16px;">
              <label class="form-label" for="adm-pass" style="color:var(--light-text);">Admin Password</label>
              <input class="dark-input" id="adm-pass" type="password" autocomplete="current-password" placeholder="Enter planner password" required />
            </div>
            <div id="adm-login-err" class="field-error" style="color:#F5B8C4;margin-bottom:14px;">${esc(errMsg)}</div>
            <button type="submit" class="btn btn-brass" style="width:100%;" id="adm-login-btn">Sign In to Admin Panel</button>
          </form>
          <div style="margin-top:16px;text-align:center;">
            <a href="#/" style="font-size:0.86rem;color:var(--mist);text-decoration:underline;">Return to Public Website</a>
          </div>
        </div>
      </section>
    `;

    const form = rootEl.querySelector('#adm-login-form');
    const passInput = rootEl.querySelector('#adm-pass');
    const errEl = rootEl.querySelector('#adm-login-err');
    const btn = rootEl.querySelector('#adm-login-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = passInput.value;
      if (!pw) {
        errEl.textContent = 'Please enter your admin password.';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      errEl.textContent = '';
      try {
        await apiFetch('/api/v1/event-auth/login', {
          method: 'POST',
          body: JSON.stringify({ password: pw })
        });
        await loadAndRenderDashboard();
      } catch (err) {
        errEl.textContent = err.message || 'Sign in failed.';
        btn.disabled = false;
        btn.textContent = 'Sign In to Admin Panel';
        passInput.value = '';
        passInput.focus();
      }
    });
  }

  /* ---------- Load Overview & Render Shell ---------- */
  async function loadAndRenderDashboard() {
    try {
      state = await apiFetch('/api/v1/event-cms/overview');
    } catch (err) {
      if (String(err.message).toLowerCase().includes('unauthorized')) {
        renderLoginView('Your session ended. Please sign in again.');
        return;
      }
      showAdminToast(err.message);
      return;
    }

    if (typeof onDataChanged === 'function') onDataChanged();
    renderDashboardShell();
  }

  function renderDashboardShell() {
    const { analytics, plans, offer, bookedDates, media, recentBookings } = state;
    const trendingPlan = plans.find((p) => p.id === analytics.trendingPlanId) || plans[0];

    const tabs = [
      { id: 'analytics', label: `Analytics & Leads (${recentBookings.length})` },
      { id: 'plans', label: `Packages (${plans.length})` },
      { id: 'offer', label: offer.active ? `Offer (${offer.percent}%) & Add-Ons` : 'Offer & Add-Ons' },
      { id: 'dates', label: `Date Calendar (${bookedDates.length})` },
      { id: 'media', label: `Decor Photos (${media.length})` },
      { id: 'reviews', label: 'Reviews & Profile' }
    ];

    rootEl.innerHTML = `
      <section class="admin-hero">
        <div class="container admin-hero-grid">
          <div>
            <div class="live-status-pill">
              <span class="live-pulse-dot" aria-hidden="true"></span>
              <span>Live Event Hub Connected · Secure Session</span>
            </div>
            <h1 class="display-lg">Usha Event Command Center</h1>
            <p style="color:var(--mist);margin:10px 0 20px;max-width:54ch;">
              Manage wedding packages, decor add-ons, booked wedding dates, live seasonal offers, gallery photos, and incoming Farrukhabad inquiries from one screen.
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <a class="btn btn-brass btn-sm" href="#/" target="_blank" rel="noopener noreferrer">Open Live Site</a>
              <button type="button" class="btn btn-ghost-dark btn-sm" id="adm-refresh-btn">Refresh Data</button>
              <button type="button" class="btn btn-ghost-dark btn-sm" id="adm-logout-btn">Sign Out All Devices</button>
            </div>
          </div>

          <div class="sphere-stage" id="admin-sphere-stage">
            <div class="sphere-fallback-rings" aria-hidden="true">
              <div class="sphere-fallback-inner"></div>
            </div>
            <div class="sphere-canvas-host" id="admin-sphere-host" aria-label="Interactive 3D event activity sphere — drag to spin"></div>
            <div class="sphere-caption">
              <span>Event Activity Sphere</span>
              <span>Drag to spin · Double-tap boost</span>
            </div>
          </div>
        </div>
      </section>

      <section class="admin-shell">
        <div class="container">
          <div class="admin-toolbar">
            <div class="segmented-control" id="admin-tabs" role="tablist" aria-label="Admin sections">
              <span class="seg-indicator" id="admin-tab-ind" aria-hidden="true"></span>
              ${tabs
                .map(
                  (t) =>
                    `<button type="button" role="tab" aria-selected="${t.id === activeTab}" class="seg-btn ${t.id === activeTab ? 'is-active' : ''}" data-adm-tab="${t.id}">${esc(t.label)}</button>`
                )
                .join('')}
            </div>
            <div style="font-size:0.86rem;color:var(--muted);">
              Trending: <strong style="color:var(--emerald-cta);">${esc(trendingPlan ? trendingPlan.name : '—')}</strong> · Top Style: <strong style="color:var(--bronze);">${esc(analytics.topDecorStyle || 'Mandap & Stage')}</strong>
            </div>
          </div>

          <div id="admin-tab-body"></div>
        </div>
      </section>
    `;

    // Mount 3D Geodesic Event Activity Sphere
    const sphereHost = rootEl.querySelector('#admin-sphere-host');
    const activityScore = analytics.totalBookings * 3 + Math.min(20, analytics.totalViews * 0.2);
    disposeSphere();
    mountAdminEventSphere3D(sphereHost, activityScore).then((ctrl) => {
      if (!document.body.contains(sphereHost)) {
        ctrl.dispose();
        return;
      }
      sphereCtrl = ctrl;
      if (ctrl.supported) {
        const fb = rootEl.querySelector('.sphere-fallback-rings');
        if (fb) fb.style.display = 'none';
      }
    });

    const tabWrap = rootEl.querySelector('#admin-tabs');
    const tabInd = rootEl.querySelector('#admin-tab-ind');
    const posTabInd = () => {
      const act = tabWrap.querySelector('.seg-btn.is-active');
      if (!act) return;
      tabInd.style.width = `${act.offsetWidth}px`;
      tabInd.style.transform = `translateX(${act.offsetLeft}px)`;
    };
    requestAnimationFrame(posTabInd);

    tabWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-adm-tab]');
      if (!btn) return;
      activeTab = btn.dataset.admTab;
      Array.from(tabWrap.querySelectorAll('.seg-btn')).forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      posTabInd();
      renderActiveTab();
    });

    rootEl.querySelector('#adm-refresh-btn').addEventListener('click', async () => {
      showAdminToast('Refreshing live event data...');
      await loadAndRenderDashboard();
    });

    rootEl.querySelector('#adm-logout-btn').addEventListener('click', async () => {
      try {
        await apiFetch('/api/v1/event-auth/logout', { method: 'POST', body: '{}' });
      } catch (_) {}
      showAdminToast('Signed out from all devices.');
      renderLoginView('');
    });

    renderActiveTab();
  }

  function renderActiveTab() {
    const body = rootEl.querySelector('#admin-tab-body');
    if (!body) return;
    if (activeTab === 'analytics') renderAnalyticsTab(body);
    else if (activeTab === 'plans') renderPlansTab(body);
    else if (activeTab === 'offer') renderOfferAddonsTab(body);
    else if (activeTab === 'dates') renderDatesTab(body);
    else if (activeTab === 'media') renderMediaTab(body);
    else if (activeTab === 'reviews') renderReviewsSettingsTab(body);
  }

  /* ---------- TAB 1: ANALYTICS & INQUIRY PIPELINE ---------- */
  function renderAnalyticsTab(container) {
    const { analytics, plans, offer, recentBookings } = state;
    const trendingPlan = plans.find((p) => p.id === analytics.trendingPlanId) || plans[0];
    const maxViews = Math.max(1, ...plans.map((p) => p.views));

    const barsHtml = plans
      .map((p) => {
        const isTrend = p.id === analytics.trendingPlanId;
        const rate = p.views > 0 ? Math.round((p.bookings / p.views) * 100) : 0;
        const viewPct = Math.max(4, Math.round((p.views / maxViews) * 100));
        const bookPct = Math.min(viewPct, Math.round((p.bookings / maxViews) * 100));
        return `
          <div class="bar-row">
            <div class="bar-row-top">
              <strong>
                ${esc(p.name)}
                ${isTrend ? ' <span class="badge-trending" style="margin-left:6px;padding:2px 9px;font-size:0.72rem;">Most Trending</span>' : ''}
              </strong>
              <span style="color:var(--muted);">
                <strong>${p.views}</strong> visits · <strong style="color:var(--bronze);">${p.bookings}</strong> booked (${rate}% conv.)
              </span>
            </div>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill-book" style="width:${bookPct}%;"></div>
              <div class="bar-fill-views" style="width:${Math.max(0, viewPct - bookPct)}%;"></div>
            </div>
          </div>`;
      })
      .join('');

    const leadsHtml = recentBookings.length
      ? `
        <div class="table-scroll">
          <table class="bookings-table">
            <thead>
              <tr>
                <th>Family / Client</th>
                <th>Package, Add-Ons &amp; Quote</th>
                <th>Event Date &amp; Venue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${recentBookings
                .map((b) => {
                  const cleanPhone = String(b.customer_phone || '').replace(/[^0-9]/g, '');
                  const replyLink = cleanPhone.length >= 10
                    ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(`Namaste ${b.customer_name}, thank you for contacting Usha Event Planner Farrukhabad regarding ${b.plan_name} on ${b.event_date}. Let us finalize your venue details.`)}`
                    : '';
                  return `
                    <tr>
                      <td>
                        <strong>${esc(b.customer_name)}</strong>
                        ${b.customer_phone ? `<div style="font-size:0.8rem;color:var(--muted);">${esc(b.customer_phone)}</div>` : ''}
                        <div style="font-size:0.75rem;color:var(--muted);">${formatTs(b.created_at)}</div>
                      </td>
                      <td>
                        <strong>${esc(b.plan_name)}</strong>
                        <div style="font-size:0.84rem;color:var(--emerald-cta);font-weight:700;">${formatINR(b.quoted_price)}</div>
                        ${b.addon_names ? `<div style="font-size:0.76rem;color:var(--bronze);">+ ${esc(b.addon_names)}</div>` : ''}
                        ${b.offer_applied ? `<div style="font-size:0.75rem;color:var(--muted);">${esc(b.offer_applied)}</div>` : ''}
                      </td>
                      <td>
                        <strong>${esc(b.event_date)} · ${esc(b.event_type)}</strong>
                        <div style="font-size:0.8rem;color:var(--muted);">${esc(b.event_shift)} (${esc(b.event_time)}) · ${esc(b.guest_count || '')}</div>
                        ${b.venue ? `<div style="font-size:0.8rem;color:var(--ink);">Venue: ${esc(b.venue)}</div>` : ''}
                        ${b.notes ? `<div style="font-size:0.78rem;color:var(--muted);max-width:220px;">${esc(b.notes)}</div>` : ''}
                      </td>
                      <td>
                        <select class="text-input" style="min-height:36px;padding:4px 10px;font-size:0.82rem;min-width:118px;" data-status-booking="${b.id}" aria-label="Lead status for ${esc(b.customer_name)}">
                          ${LEAD_STATUSES.map((st) => `<option value="${st.id}" ${b.status === st.id ? 'selected' : ''}>${st.label}</option>`).join('')}
                        </select>
                      </td>
                      <td>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                          ${replyLink ? `<a class="btn btn-whatsapp btn-sm" href="${replyLink}" target="_blank" rel="noopener noreferrer">Reply</a>` : ''}
                          <button type="button" class="btn btn-danger btn-sm" data-del-booking="${b.id}">Delete</button>
                        </div>
                      </td>
                    </tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </div>`
      : `<p style="color:var(--muted);margin:0;">No inquiries recorded yet. Every time a family checks a date and taps Book Event on WhatsApp, their full brief appears here automatically.</p>`;

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Package Visits</div>
          <div class="kpi-value">${analytics.totalViews.toLocaleString('en-IN')}</div>
          <div class="kpi-sub">Unique visitor views on packages</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Event Inquiries</div>
          <div class="kpi-value">${analytics.totalBookings.toLocaleString('en-IN')}</div>
          <div class="kpi-sub">${analytics.conversionRate}% conversion · ${offer.active ? `${offer.percent}% offer on` : 'Standard pricing'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Most Viewed Decor</div>
          <div class="kpi-value" style="font-size:1.38rem;">${esc(analytics.topDecorStyle || 'Mandap & Stage')}</div>
          <div class="kpi-sub">Top gallery filter tapped</div>
        </div>
        <div class="kpi-card is-highlight">
          <div class="kpi-label">Most Trending Package</div>
          <div class="kpi-value" style="font-size:1.32rem;">${esc(trendingPlan ? trendingPlan.name : '—')}</div>
          <div class="kpi-sub">${trendingPlan ? `${trendingPlan.views} visits · ${trendingPlan.bookings} booked` : ''}</div>
        </div>
      </div>

      <div class="admin-panel-card">
        <div class="admin-panel-head">
          <h2>Package Performance</h2>
          <span style="font-size:0.82rem;color:var(--muted);">Bronze = Booked · Spruce = Visits</span>
        </div>
        <div class="bar-list">${barsHtml}</div>
      </div>

      <div class="admin-panel-card">
        <div class="admin-panel-head">
          <h2>Incoming Event Leads Pipeline</h2>
          <span style="font-size:0.84rem;color:var(--muted);">${recentBookings.length} inquiries</span>
        </div>
        ${leadsHtml}
      </div>
    `;

    container.addEventListener('change', async (e) => {
      const sel = e.target.closest('[data-status-booking]');
      if (!sel) return;
      const id = sel.dataset.statusBooking;
      const status = sel.value;
      try {
        await apiFetch(`/api/v1/event-cms/bookings/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        showAdminToast(`Lead marked as ${status}.`);
      } catch (err) {
        showAdminToast(err.message);
      }
    });

    container.addEventListener('click', async (e) => {
      const delBtn = e.target.closest('[data-del-booking]');
      if (!delBtn) return;
      if (!window.confirm('Delete this lead record?')) return;
      delBtn.disabled = true;
      try {
        await apiFetch(`/api/v1/event-cms/bookings/${delBtn.dataset.delBooking}`, { method: 'DELETE' });
        showAdminToast('Lead removed.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        delBtn.disabled = false;
      }
    });
  }

  /* ---------- TAB 2: PACKAGES CRUD MANAGER ---------- */
  function renderPlansTab(container) {
    const { plans } = state;
    const editing = editingPlanId ? plans.find((p) => p.id === editingPlanId) : null;

    container.innerHTML = `
      <div class="admin-split">
        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>${editing ? 'Edit Event Package' : 'Add New Event Package'}</h2>
            ${editing ? '<button type="button" class="btn btn-ghost-light btn-sm" id="plan-cancel-edit">Add New Instead</button>' : ''}
          </div>
          <form id="adm-plan-form">
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="pf-name">Package Name *</label>
              <input class="text-input" id="pf-name" required value="${esc(editing ? editing.name : '')}" placeholder="e.g. Royal Sangeet &amp; Cocktail Night" />
            </div>
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="pf-price">Base Price (₹) *</label>
                <input class="text-input" id="pf-price" type="number" min="1000" max="5000000" required value="${esc(editing ? editing.price : '')}" placeholder="e.g. 45000" />
              </div>
              <div>
                <label class="form-label" for="pf-order">Display Order</label>
                <input class="text-input" id="pf-order" type="number" min="1" max="99" value="${esc(editing ? editing.sort_order : plans.length + 1)}" />
              </div>
            </div>
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="pf-dur">Duration *</label>
                <input class="text-input" id="pf-dur" required value="${esc(editing ? editing.duration : '')}" placeholder="e.g. 1 Evening Function" />
              </div>
              <div>
                <label class="form-label" for="pf-scope">Ideal Venue / Scale *</label>
                <input class="text-input" id="pf-scope" required value="${esc(editing ? editing.event_scope : '')}" placeholder="e.g. Banquet Hall or Lawn" />
              </div>
            </div>
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="pf-desc">Short Description *</label>
              <textarea class="text-area" id="pf-desc" required placeholder="Describe the stage, blooms, and feel of this package...">${esc(editing ? editing.tagline : '')}</textarea>
            </div>
            <div class="form-block" style="margin-bottom:18px;">
              <label class="form-label" for="pf-deliv">What's Included (One item per line) *</label>
              <textarea class="text-area" id="pf-deliv" style="min-height:124px;" required placeholder="Grand Varmala stage (24x12 ft)&#10;Fresh floral mandap&#10;40ft jasmine entry walkway">${esc(editing ? editing.deliverables.join('\n') : '')}</textarea>
            </div>
            <button type="submit" class="btn btn-primary" id="pf-submit">${editing ? 'Save Package Changes' : 'Publish New Package'}</button>
          </form>
        </div>

        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Live Website Packages</h2>
            <span style="font-size:0.84rem;color:var(--muted);">Updates Home, Plans &amp; Booking instantly</span>
          </div>
          <div class="cms-list">
            ${plans
              .map(
                (p) => `
                <div class="cms-item">
                  <div>
                    <strong style="font-size:1rem;">${esc(p.name)}</strong>
                    <div style="font-size:0.86rem;color:var(--emerald-cta);font-weight:700;margin-top:2px;">${formatINR(p.price)} · ${esc(p.duration)}</div>
                    <div style="font-size:0.82rem;color:var(--muted);margin-top:4px;">${p.views} visits · ${p.bookings} booked · ${p.deliverables.length} items</div>
                  </div>
                  <div class="cms-item-actions">
                    <button type="button" class="btn btn-ghost-light btn-sm" data-edit-plan="${esc(p.id)}">Edit</button>
                    <button type="button" class="btn btn-danger btn-sm" data-del-plan="${esc(p.id)}">Delete</button>
                  </div>
                </div>`
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    const cancelBtn = container.querySelector('#plan-cancel-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        editingPlanId = null;
        renderPlansTab(container);
      });
    }

    container.querySelector('#adm-plan-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = container.querySelector('#pf-submit');
      const deliverables = container
        .querySelector('#pf-deliv')
        .value.split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      try {
        await apiFetch('/api/v1/event-cms/plans', {
          method: 'POST',
          body: JSON.stringify({
            id: editing ? editing.id : undefined,
            name: container.querySelector('#pf-name').value.trim(),
            price: Number(container.querySelector('#pf-price').value),
            sort_order: Number(container.querySelector('#pf-order').value || 1),
            duration: container.querySelector('#pf-dur').value.trim(),
            event_scope: container.querySelector('#pf-scope').value.trim(),
            tagline: container.querySelector('#pf-desc').value.trim(),
            deliverables
          })
        });
        editingPlanId = null;
        showAdminToast('Package published live.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = editing ? 'Save Package Changes' : 'Publish New Package';
      }
    });

    container.addEventListener('click', async (e) => {
      const ed = e.target.closest('[data-edit-plan]');
      if (ed) {
        editingPlanId = ed.dataset.editPlan;
        renderPlansTab(container);
        return;
      }
      const del = e.target.closest('[data-del-plan]');
      if (del) {
        if (!window.confirm('Delete this package from the live website?')) return;
        del.disabled = true;
        try {
          await apiFetch(`/api/v1/event-cms/plans/${encodeURIComponent(del.dataset.delPlan)}`, { method: 'DELETE' });
          if (editingPlanId === del.dataset.delPlan) editingPlanId = null;
          showAdminToast('Package deleted.');
          await loadAndRenderDashboard();
        } catch (err) {
          showAdminToast(err.message);
          del.disabled = false;
        }
      }
    });
  }

  /* ---------- TAB 3: LIVE SEASONAL OFFER + DECOR ADD-ONS CRUD ---------- */
  function renderOfferAddonsTab(container) {
    const { offer, plans, addons } = state;
    let liveActive = Boolean(offer.active);
    const editAddon = editingAddonId ? addons.find((a) => a.id === editingAddonId) : null;

    container.innerHTML = `
      <div class="admin-split" style="margin-bottom:22px;">
        <div class="admin-panel-card" style="margin-bottom:0;">
          <div class="admin-panel-head">
            <h2>Live Seasonal Offer Switch</h2>
          </div>
          <div class="switch-row">
            <div>
              <strong>Offer Ribbon &amp; Automatic Discount</strong>
              <div style="font-size:0.84rem;color:var(--muted);">Toggle seasonal savings across Home, Packages, and WhatsApp quotes</div>
            </div>
            <button type="button" id="offer-toggle" class="toggle-switch ${liveActive ? 'is-on' : ''}" role="switch" aria-checked="${liveActive}" aria-label="Toggle live offer"></button>
          </div>
          <form id="adm-offer-form">
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="of-title">Offer Title</label>
                <input class="text-input" id="of-title" value="${esc(offer.title)}" required />
              </div>
              <div>
                <label class="form-label" for="of-pct">Discount (%)</label>
                <input class="text-input" id="of-pct" type="number" min="0" max="75" value="${esc(offer.percent)}" required />
              </div>
            </div>
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="of-note">Offer Banner Message</label>
              <input class="text-input" id="of-note" value="${esc(offer.note)}" />
            </div>
            <div class="form-block" style="margin-bottom:18px;">
              <label class="form-label" for="of-valid">Valid Till Text</label>
              <input class="text-input" id="of-valid" value="${esc(offer.validTill)}" placeholder="e.g. 31 Dec 2026" />
            </div>
            <button type="submit" class="btn btn-primary" id="of-save-btn">Update Live Offer</button>
          </form>
        </div>

        <div class="admin-panel-card" style="margin-bottom:0;">
          <div class="admin-panel-head">
            <h2>Live Customer Price Preview</h2>
          </div>
          <div class="cms-list" id="offer-price-preview"></div>
        </div>
      </div>

      <div class="admin-split">
        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>${editAddon ? 'Edit Decor Add-On' : 'Add Optional Decor / Entry Extra'}</h2>
            ${editAddon ? '<button type="button" class="btn btn-ghost-light btn-sm" id="addon-cancel-edit">Add New Instead</button>' : ''}
          </div>
          <form id="adm-addon-form">
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="ad-name">Add-On Name *</label>
              <input class="text-input" id="ad-name" required value="${esc(editAddon ? editAddon.name : '')}" placeholder="e.g. Vintage Car Floral Decoration" />
            </div>
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="ad-price">Extra Price (₹) *</label>
                <input class="text-input" id="ad-price" type="number" min="200" max="1000000" required value="${esc(editAddon ? editAddon.price : '')}" placeholder="e.g. 4500" />
              </div>
              <div>
                <label class="form-label" for="ad-order">Order</label>
                <input class="text-input" id="ad-order" type="number" min="1" max="99" value="${esc(editAddon ? editAddon.sort_order : addons.length + 1)}" />
              </div>
            </div>
            <div class="form-block" style="margin-bottom:18px;">
              <label class="form-label" for="ad-note">Short Note</label>
              <input class="text-input" id="ad-note" value="${esc(editAddon ? editAddon.note : '')}" placeholder="e.g. Fresh orchids and satin ribbon styling" />
            </div>
            <button type="submit" class="btn btn-primary" id="ad-save-btn">${editAddon ? 'Save Add-On' : 'Publish Add-On'}</button>
          </form>
        </div>

        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Active Optional Add-Ons (${addons.length})</h2>
          </div>
          <div class="cms-list">
            ${addons
              .map(
                (a) => `
                <div class="cms-item">
                  <div>
                    <strong>${esc(a.name)}</strong>
                    <div style="font-size:0.84rem;color:var(--bronze);font-weight:700;">+${formatINR(a.price)}</div>
                    <div style="font-size:0.8rem;color:var(--muted);">${esc(a.note)}</div>
                  </div>
                  <div class="cms-item-actions">
                    <button type="button" class="btn btn-ghost-light btn-sm" data-edit-addon="${esc(a.id)}">Edit</button>
                    <button type="button" class="btn btn-danger btn-sm" data-del-addon="${esc(a.id)}">Delete</button>
                  </div>
                </div>`
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    const toggleBtn = container.querySelector('#offer-toggle');
    const pctInput = container.querySelector('#of-pct');
    const previewList = container.querySelector('#offer-price-preview');

    function syncPreview() {
      const pct = liveActive ? Math.max(0, Math.min(75, Number(pctInput.value || 0))) : 0;
      previewList.innerHTML = plans
        .map((p) => {
          const finalP = pct > 0 ? Math.round((p.price * (100 - pct)) / 100) : p.price;
          return `
            <div class="cms-item">
              <div>
                <strong>${esc(p.name)}</strong>
                <div style="font-size:0.82rem;color:var(--muted);">Base: ${formatINR(p.price)}</div>
              </div>
              <div style="text-align:right;">
                <strong style="color:var(--emerald-cta);font-size:1.05rem;">${formatINR(finalP)}</strong>
                <div style="font-size:0.78rem;color:var(--bronze);">${pct > 0 ? `-${pct}% live` : 'Regular rate'}</div>
              </div>
            </div>`;
        })
        .join('');
    }

    toggleBtn.addEventListener('click', () => {
      liveActive = !liveActive;
      toggleBtn.classList.toggle('is-on', liveActive);
      toggleBtn.setAttribute('aria-checked', String(liveActive));
      syncPreview();
    });
    pctInput.addEventListener('input', syncPreview);
    syncPreview();

    container.querySelector('#adm-offer-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = container.querySelector('#of-save-btn');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        await apiFetch('/api/v1/event-cms/offer', {
          method: 'PUT',
          body: JSON.stringify({
            active: liveActive,
            title: container.querySelector('#of-title').value.trim(),
            percent: Number(pctInput.value || 0),
            note: container.querySelector('#of-note').value.trim(),
            validTill: container.querySelector('#of-valid').value.trim()
          })
        });
        showAdminToast(liveActive ? 'Live seasonal offer updated!' : 'Seasonal offer turned off.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        btn.disabled = false;
        btn.textContent = 'Update Live Offer';
      }
    });

    const cancelAd = container.querySelector('#addon-cancel-edit');
    if (cancelAd) {
      cancelAd.addEventListener('click', () => {
        editingAddonId = null;
        renderOfferAddonsTab(container);
      });
    }

    container.querySelector('#adm-addon-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = container.querySelector('#ad-save-btn');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        await apiFetch('/api/v1/event-cms/addons', {
          method: 'POST',
          body: JSON.stringify({
            id: editAddon ? editAddon.id : undefined,
            name: container.querySelector('#ad-name').value.trim(),
            price: Number(container.querySelector('#ad-price').value),
            sort_order: Number(container.querySelector('#ad-order').value || 1),
            note: container.querySelector('#ad-note').value.trim()
          })
        });
        editingAddonId = null;
        showAdminToast('Add-on saved live.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        btn.disabled = false;
        btn.textContent = editAddon ? 'Save Add-On' : 'Publish Add-On';
      }
    });

    container.addEventListener('click', async (e) => {
      const ed = e.target.closest('[data-edit-addon]');
      if (ed) {
        editingAddonId = ed.dataset.editAddon;
        renderOfferAddonsTab(container);
        return;
      }
      const del = e.target.closest('[data-del-addon]');
      if (del) {
        if (!window.confirm('Remove this optional add-on?')) return;
        del.disabled = true;
        try {
          await apiFetch(`/api/v1/event-cms/addons/${encodeURIComponent(del.dataset.delAddon)}`, { method: 'DELETE' });
          if (editingAddonId === del.dataset.delAddon) editingAddonId = null;
          showAdminToast('Add-on removed.');
          await loadAndRenderDashboard();
        } catch (err) {
          showAdminToast(err.message);
          del.disabled = false;
        }
      }
    });
  }

  /* ---------- TAB 4: EVENT DATE AVAILABILITY CALENDAR ---------- */
  function renderDatesTab(container) {
    const { bookedDates } = state;

    container.innerHTML = `
      <div class="admin-split">
        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Mark Busy / Booked Wedding Dates</h2>
          </div>
          <p style="font-size:0.9rem;color:var(--muted);margin:0 0 18px;">
            Any date you mark here shows an instant live availability notice on the public Booking page (your private client note stays hidden inside Admin only).
          </p>
          <form id="adm-date-form">
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="dt-val">Event Date *</label>
                <input class="text-input" id="dt-val" type="date" min="${todayISO()}" required />
              </div>
              <div>
                <label class="form-label" for="dt-status">Availability Status *</label>
                <select class="text-input" id="dt-status">
                  <option value="booked">Fully Booked (Red Alert)</option>
                  <option value="limited">Limited Slots Left (Amber)</option>
                </select>
              </div>
            </div>
            <div class="form-block" style="margin-bottom:18px;">
              <label class="form-label" for="dt-note">Private Planner Note (Admin Only)</label>
              <input class="text-input" id="dt-note" placeholder="e.g. Sharma Wedding at Fatehgarh Lawn" />
            </div>
            <button type="submit" class="btn btn-primary" id="dt-save-btn">Save Date Status</button>
          </form>
        </div>

        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Marked Calendar Dates (${bookedDates.length})</h2>
          </div>
          <div class="cms-list">
            ${
              bookedDates.length
                ? bookedDates
                    .map(
                      (d) => `
                      <div class="cms-item">
                        <div>
                          <strong>${esc(d.event_date)}</strong>
                          <span style="margin-left:8px;padding:2px 9px;border-radius:999px;font-size:0.75rem;font-weight:700;background:${d.status === 'booked' ? 'rgba(142,35,52,0.14)' : 'rgba(127,86,17,0.14)'};color:${d.status === 'booked' ? 'var(--ruby)' : 'var(--bronze)'};">
                            ${d.status === 'booked' ? 'Fully Booked' : 'Limited Slots'}
                          </span>
                          ${d.note ? `<div style="font-size:0.82rem;color:var(--muted);margin-top:4px;">Note: ${esc(d.note)}</div>` : ''}
                        </div>
                        <button type="button" class="btn btn-ghost-light btn-sm" data-open-date="${esc(d.event_date)}">Re-Open Date</button>
                      </div>`
                    )
                    .join('')
                : `<p style="color:var(--muted);margin:0;">All upcoming dates currently show as Open on the public Booking page.</p>`
            }
          </div>
        </div>
      </div>
    `;

    container.querySelector('#adm-date-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = container.querySelector('#dt-save-btn');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        await apiFetch('/api/v1/event-cms/dates', {
          method: 'POST',
          body: JSON.stringify({
            event_date: container.querySelector('#dt-val').value,
            status: container.querySelector('#dt-status').value,
            note: container.querySelector('#dt-note').value.trim()
          })
        });
        showAdminToast('Calendar availability updated live.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        btn.disabled = false;
        btn.textContent = 'Save Date Status';
      }
    });

    container.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-open-date]');
      if (!btn) return;
      btn.disabled = true;
      try {
        await apiFetch(`/api/v1/event-cms/dates/${encodeURIComponent(btn.dataset.openDate)}`, { method: 'DELETE' });
        showAdminToast('Date marked Open again.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        btn.disabled = false;
      }
    });
  }

  /* ---------- TAB 5: DECOR PHOTO MANAGER (HOME, ABOUT, GALLERY) ---------- */
  function renderMediaTab(container) {
    const { media } = state;
    const editing = editingMediaId ? media.find((m) => m.id === editingMediaId) : null;
    const filteredMedia = mediaSlotFilter === 'all' ? media : media.filter((m) => m.slot === mediaSlotFilter);

    container.innerHTML = `
      <div class="admin-panel-card">
        <div class="admin-panel-head">
          <h2>${editing ? 'Edit / Replace Decor Photo' : 'Upload Photo to Home, About Us, or Decor Gallery'}</h2>
          ${editing ? '<button type="button" class="btn btn-ghost-light btn-sm" id="media-cancel-edit">Upload New Photo Instead</button>' : ''}
        </div>
        <form id="adm-media-form">
          <div class="field-row-2" style="margin-bottom:14px;">
            <div>
              <label class="form-label" for="mf-slot">Page Section *</label>
              <select class="text-input" id="mf-slot">
                <option value="gallery" ${(!editing || editing.slot === 'gallery') ? 'selected' : ''}>Decor Gallery Page</option>
                <option value="home_hero" ${(editing && editing.slot === 'home_hero') ? 'selected' : ''}>Home Page · 3D Pavilion Hero</option>
                <option value="home_signature" ${(editing && editing.slot === 'home_signature') ? 'selected' : ''}>Home Page · Arch Signature Photo (Replaces current)</option>
                <option value="about_craft" ${(editing && editing.slot === 'about_craft') ? 'selected' : ''}>About Us Page · Main Planning Photo (Replaces current)</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="mf-cat">Decor Category *</label>
              <select class="text-input" id="mf-cat">
                ${DECOR_CATEGORIES.map((c) => `<option value="${c}" ${(editing && editing.category === c) ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="field-row-2" style="margin-bottom:14px;">
            <div>
              <label class="form-label" for="mf-title">Setup Title *</label>
              <input class="text-input" id="mf-title" required value="${esc(editing ? editing.title : '')}" placeholder="e.g. Fatehgarh Lawn Varmala Stage" />
            </div>
            <div>
              <label class="form-label" for="mf-loc">Subtitle / Venue Detail</label>
              <input class="text-input" id="mf-loc" value="${esc(editing ? editing.location : '')}" placeholder="e.g. Fresh Mogra &amp; Brass Lanterns" />
            </div>
          </div>

          <div class="form-block" style="margin-bottom:16px;">
            <label class="form-label" for="mf-file">${editing ? 'Replace Photo File (Optional — leave empty to keep existing)' : 'Choose Photo From Phone or PC *'}</label>
            <label class="upload-drop" for="mf-file" style="display:block;">
              <input id="mf-file" type="file" accept="image/*" style="display:none;" />
              <strong id="mf-file-status">Tap to choose a photo (auto-compressed to fast WebP under 220 KB)</strong>
              <img id="mf-preview" class="upload-preview-img" src="${editing ? esc(editing.src) : ''}" ${editing ? '' : 'hidden'} alt="Selected preview" />
            </label>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
            <label style="display:inline-flex;align-items:center;gap:8px;font-size:0.9rem;cursor:pointer;">
              <input type="checkbox" id="mf-wide" ${editing && editing.wide ? 'checked' : ''} />
              <span>Span wide (2 columns) inside Decor Gallery</span>
            </label>
            <button type="submit" class="btn btn-primary" id="mf-save-btn">${editing ? 'Save Photo Update' : 'Upload & Publish Photo'}</button>
          </div>
        </form>
      </div>

      <div class="admin-panel-card">
        <div class="admin-panel-head">
          <h2>Current Live Photos (${filteredMedia.length})</h2>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${[
              ['all', 'All'],
              ['home_hero', 'Home Hero'],
              ['home_signature', 'Home Arch'],
              ['about_craft', 'About Us'],
              ['gallery', 'Decor Gallery']
            ]
              .map(
                ([k, lbl]) =>
                  `<button type="button" class="btn btn-sm ${mediaSlotFilter === k ? 'btn-primary' : 'btn-ghost-light'}" data-mslot="${k}">${lbl}</button>`
              )
              .join('')}
          </div>
        </div>

        <div class="media-admin-grid">
          ${filteredMedia
            .map(
              (m) => `
              <article class="media-admin-card">
                <div class="media-admin-thumb">
                  <img src="${esc(m.src)}" alt="${esc(m.title)}" loading="lazy" />
                  <span class="media-slot-badge">${esc(SLOT_LABELS[m.slot] || m.slot)}</span>
                </div>
                <div class="media-admin-body">
                  <div>
                    <strong style="font-size:0.95rem;">${esc(m.title)}</strong>
                    <div style="font-size:0.8rem;color:var(--muted);">${esc(m.category)} · ${esc(m.location)}</div>
                  </div>
                  <div class="cms-item-actions" style="margin-top:6px;">
                    <button type="button" class="btn btn-ghost-light btn-sm" data-edit-media="${esc(m.id)}">Edit / Replace</button>
                    ${
                      m.slot === 'gallery' || m.slot === 'home_hero'
                        ? `<button type="button" class="btn btn-danger btn-sm" data-del-media="${esc(m.id)}">Remove</button>`
                        : ''
                    }
                  </div>
                </div>
              </article>`
            )
            .join('')}
        </div>
      </div>
    `;

    const cancelEdit = container.querySelector('#media-cancel-edit');
    if (cancelEdit) {
      cancelEdit.addEventListener('click', () => {
        editingMediaId = null;
        pendingImageData = '';
        renderMediaTab(container);
      });
    }

    const fileInput = container.querySelector('#mf-file');
    const fileStatus = container.querySelector('#mf-file-status');
    const previewImg = container.querySelector('#mf-preview');

    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      fileStatus.textContent = 'Compressing photo to WebP...';
      try {
        const res = await compressImageFile(f);
        pendingImageData = res.dataUrl;
        previewImg.src = res.dataUrl;
        previewImg.hidden = false;
        fileStatus.textContent = `Ready: ${res.width}×${res.height}px (${res.kb} KB optimized)`;
      } catch (err) {
        pendingImageData = '';
        fileStatus.textContent = err.message;
      }
    });

    container.querySelector('#adm-media-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = container.querySelector('#mf-save-btn');
      if (!editing && !pendingImageData) {
        showAdminToast('Please choose an image file first.');
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Publishing...';
      try {
        await apiFetch('/api/v1/event-cms/media', {
          method: 'POST',
          body: JSON.stringify({
            id: editing ? editing.id : undefined,
            slot: container.querySelector('#mf-slot').value,
            category: container.querySelector('#mf-cat').value,
            title: container.querySelector('#mf-title').value.trim(),
            location: container.querySelector('#mf-loc').value.trim(),
            wide: container.querySelector('#mf-wide').checked,
            imageData: pendingImageData || ''
          })
        });
        editingMediaId = null;
        pendingImageData = '';
        showAdminToast('Decor photo updated live!');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = editing ? 'Save Photo Update' : 'Upload & Publish Photo';
      }
    });

    container.addEventListener('click', async (e) => {
      const mf = e.target.closest('[data-mslot]');
      if (mf) {
        mediaSlotFilter = mf.dataset.mslot;
        renderMediaTab(container);
        return;
      }
      const ed = e.target.closest('[data-edit-media]');
      if (ed) {
        editingMediaId = ed.dataset.editMedia;
        pendingImageData = '';
        renderMediaTab(container);
        window.scrollTo({ top: 180, behavior: 'smooth' });
        return;
      }
      const del = e.target.closest('[data-del-media]');
      if (del) {
        if (!window.confirm('Remove this photo from the website?')) return;
        del.disabled = true;
        try {
          await apiFetch(`/api/v1/event-cms/media/${encodeURIComponent(del.dataset.delMedia)}`, { method: 'DELETE' });
          showAdminToast('Photo removed.');
          await loadAndRenderDashboard();
        } catch (err) {
          showAdminToast(err.message);
          del.disabled = false;
        }
      }
    });
  }

  /* ---------- TAB 6: FAMILY REVIEWS & BUSINESS PROFILE SETTINGS ---------- */
  function renderReviewsSettingsTab(container) {
    const { reviews, studio } = state;

    container.innerHTML = `
      <div class="admin-split">
        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Add Family Review</h2>
          </div>
          <form id="adm-rev-form">
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="rv-name">Family / Client Name *</label>
                <input class="text-input" id="rv-name" required placeholder="e.g. Mishra Family · Farrukhabad" />
              </div>
              <div>
                <label class="form-label" for="rv-ev">Event Type *</label>
                <input class="text-input" id="rv-ev" required placeholder="e.g. Royal Wedding Mandap" />
              </div>
            </div>
            <div class="form-block" style="margin-bottom:16px;">
              <label class="form-label" for="rv-quote">Review Quote *</label>
              <textarea class="text-area" id="rv-quote" required placeholder="Paste the family's feedback..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary" id="rv-save-btn">Publish Review</button>
          </form>

          <div class="cms-list" style="margin-top:20px;">
            ${reviews
              .map(
                (r) => `
                <div class="cms-item">
                  <div>
                    <strong>${esc(r.family_name)}</strong>
                    <div style="font-size:0.78rem;color:var(--bronze);font-weight:600;">${esc(r.event_type)}</div>
                    <div style="font-size:0.84rem;color:var(--muted);margin-top:4px;">“${esc(r.quote)}”</div>
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" data-del-rev="${esc(r.id)}">Remove</button>
                </div>`
              )
              .join('')}
          </div>
        </div>

        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Business Contact &amp; Profile Info</h2>
          </div>
          <form id="adm-studio-form">
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="st-name">Business Name</label>
              <input class="text-input" id="st-name" value="${esc(studio.name)}" required />
            </div>
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="st-wa">WhatsApp Number (With 91)</label>
                <input class="text-input" id="st-wa" value="${esc(studio.whatsapp)}" required />
              </div>
              <div>
                <label class="form-label" for="st-phone">Display Phone</label>
                <input class="text-input" id="st-phone" value="${esc(studio.phone)}" required />
              </div>
            </div>
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="st-city">City / Address</label>
              <input class="text-input" id="st-city" value="${esc(studio.city)}" required />
            </div>
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="st-hours">Working Hours</label>
              <input class="text-input" id="st-hours" value="${esc(studio.hours)}" required />
            </div>
            <div class="form-block" style="margin-bottom:18px;">
              <label class="form-label" for="st-maps">Google Maps Link</label>
              <input class="text-input" id="st-maps" value="${esc(studio.mapsUrl)}" />
            </div>
            <button type="submit" class="btn btn-primary" id="st-save-btn">Save Profile Settings</button>
          </form>
        </div>
      </div>
    `;

    container.querySelector('#adm-rev-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = container.querySelector('#rv-save-btn');
      btn.disabled = true;
      btn.textContent = 'Publishing...';
      try {
        await apiFetch('/api/v1/event-cms/reviews', {
          method: 'POST',
          body: JSON.stringify({
            family_name: container.querySelector('#rv-name').value.trim(),
            event_type: container.querySelector('#rv-ev').value.trim(),
            quote: container.querySelector('#rv-quote').value.trim()
          })
        });
        showAdminToast('Family review published live.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        btn.disabled = false;
        btn.textContent = 'Publish Review';
      }
    });

    container.addEventListener('click', async (e) => {
      const del = e.target.closest('[data-del-rev]');
      if (!del) return;
      del.disabled = true;
      try {
        await apiFetch(`/api/v1/event-cms/reviews/${encodeURIComponent(del.dataset.delRev)}`, { method: 'DELETE' });
        showAdminToast('Review removed.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        del.disabled = false;
      }
    });

    container.querySelector('#adm-studio-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = container.querySelector('#st-save-btn');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        await apiFetch('/api/v1/event-cms/studio', {
          method: 'PUT',
          body: JSON.stringify({
            name: container.querySelector('#st-name').value.trim(),
            whatsapp: container.querySelector('#st-wa').value.trim(),
            phone: container.querySelector('#st-phone').value.trim(),
            city: container.querySelector('#st-city').value.trim(),
            hours: container.querySelector('#st-hours').value.trim(),
            mapsUrl: container.querySelector('#st-maps').value.trim()
          })
        });
        showAdminToast('Business profile updated live.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        btn.disabled = false;
        btn.textContent = 'Save Profile Settings';
      }
    });
  }

  /* ---------- Bootstrap Admin Session Check ---------- */
  rootEl.innerHTML = `<section class="admin-login-wrap"><p style="color:var(--mist);">Checking planner session...</p></section>`;
  try {
    const sess = await apiFetch('/api/v1/event-auth/session');
    if (sess.authenticated) {
      await loadAndRenderDashboard();
    } else {
      renderLoginView('', sess.adminConfigured !== false);
    }
  } catch (_) {
    renderLoginView('Could not connect to server. Deploy on Cloudflare Workers with D1 attached.', true);
  }

  return () => cleanups.forEach((fn) => fn());
}
