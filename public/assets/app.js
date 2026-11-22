/* ==========================================================================
   Usha Event Planner Farrukhabad — Production Multi-Page Web Application
   Live-wired to same-origin hidden Cloudflare Worker + D1 API (/api/v1/*).
   Routes: #/ (Home), #/gallery, #/about, #/plans, #/booking, #/admin, * (404)
   ========================================================================== */

import { mountMandapPavilion3D } from './scene3d.js?v=1';

const FALLBACK_DATA = {
  studio: {
    name: 'Usha Event Planner',
    city: 'Farrukhabad & Fatehgarh, UP',
    whatsapp: '917705007229',
    phone: '+91 77050 07229',
    hours: 'Daily · 10:00 AM to 9:00 PM',
    instagram: 'https://www.instagram.com/',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Usha+event+planner+Farrukhabad'
  },
  offer: {
    active: true,
    title: 'Shaadi Season Offer',
    percent: 10,
    note: 'Flat 10% off on full Wedding Mandap & Reception setups booked 30+ days ahead',
    validTill: '31 Dec 2026'
  },
  trendingPlanId: 'wedding-mandap-signature',
  plans: [
    {
      id: 'haldi-mehendi-courtyard',
      name: 'Haldi & Mehendi Courtyard',
      tagline: 'Bright marigold flower curtains, upholstered swing seating, brass urlis, and shaded botanical lounge styling.',
      price: 22999,
      duration: '1 Daytime Function (6–8 Hours)',
      event_scope: 'Home Courtyard, Terrace, or Lawn',
      deliverables: [
        'Fresh marigold & white jasmine backdrop curtains (12x10 ft)',
        'Floral upholstered jhoola swing or cane Mehendi sofa setup',
        '6 antique brass urlis with floating petals + embroidered floor cushions',
        'Entrance floral arch and warm daytime photo-corner props',
        'Complete morning setup and post-function pack-up crew'
      ],
      views: 0,
      bookings: 0
    },
    {
      id: 'engagement-ring-stage',
      name: 'Engagement & Ring Ceremony',
      tagline: 'Sculptural concentric brass arch stage, white hydrangeas, velvet couple sofa, and architectural uplighting.',
      price: 34999,
      duration: '1 Evening Function',
      event_scope: 'Banquet Hall or Garden Lawn',
      deliverables: [
        'Designer concentric brass ring arch with fresh white blooms & foliage',
        'Plush ivory tufted couple sofa on a draped 16x10 ft stage riser',
        'Warm ambient LED uplights, pillar candles, and floral walkway entrance',
        'Dedicated ring-platter pedestal and welcome signage board',
        'On-site decor coordinator throughout the ceremony'
      ],
      views: 0,
      bookings: 0
    },
    {
      id: 'wedding-mandap-signature',
      name: 'Complete Wedding Mandap & Stage',
      tagline: 'Our signature Farrukhabad wedding production covering grand Varmala stage, sacred phera mandap, and floral entry.',
      price: 69999,
      duration: 'Full Wedding Day + Night',
      event_scope: 'Guest House, Marriage Lawn, or Heritage Courtyard',
      deliverables: [
        'Grand carved-arch Varmala stage (24x12 ft) with brass chandeliers & roses',
        'Four-pillar floral Phera Mandap with silk drapes, mogra garlands & brass bells',
        '40-foot jasmine & emerald floral entry tunnel lined with candle lanterns',
        'Welcome gate arch, dining passage lighting, and brass urli centerpieces',
        'Dedicated 8-member installation and live-event coordination crew'
      ],
      views: 0,
      bookings: 0
    },
    {
      id: 'grand-royal-production',
      name: 'Grand Royal Full-Wedding Production',
      tagline: 'End-to-end event planning and custom theme production across Haldi, Mehendi, Sangeet, Wedding, and Reception.',
      price: 129999,
      duration: '2 to 3 Days (All Wedding Functions)',
      event_scope: 'Full Venue Transformation (Up to 800+ Guests)',
      deliverables: [
        'Distinct custom decor themes for Haldi, Sangeet, Wedding, and Reception',
        'Overhead vintage Edison bulb canopy & emerald-ivory ceiling silk draping',
        'Candlelit VIP banquet dining tables with brass candelabras & floral runners',
        'Bridal entry coordination, cold-pyro cues, truss sound & lighting layout',
        'Lead event manager on-site from morning rituals to final vidaai'
      ],
      views: 0,
      bookings: 0
    }
  ],
  addons: [
    { id: 'addon-floral-chadar', name: 'Bridal Floral Chadar & Entry Coordination', price: 4500, note: 'Fresh jasmine & rose phoolon ki chadar with lantern pathway cues' },
    { id: 'addon-cold-pyro', name: '8 Cold Pyro Sparkler Shots (Varmala)', price: 3800, note: 'Smokeless indoor/outdoor safe cold spark fountains synced to Jaimala' },
    { id: 'addon-low-fog', name: 'Low-Lying Cloud Fog Machine', price: 4200, note: 'Dry-ice floor cloud effect for couple entry and first dance' },
    { id: 'addon-bulb-canopy', name: 'Warm Vintage Bulb & Drape Canopy', price: 9500, note: 'Overhead warm tungsten string bulbs with emerald & ivory fabric swags' },
    { id: 'addon-birthday-arch', name: 'Milestone Cake & Brass Ring Photo Corner', price: 6500, note: 'Circular brass floral arch with linen dessert table and hurricane candles' }
  ],
  bookedDates: [],
  media: [
    { id: 'hero-1', slot: 'home_hero', category: 'Mandap & Stage', title: 'Twilight Floral Mandap Pavilion', location: 'Courtyard Mandap · Fresh Mogra & Brass Bells', src: '/assets/photos/01-hero-mandap-pavilion.webp', wide: true },
    { id: 'hero-2', slot: 'home_hero', category: 'Mandap & Stage', title: 'Royal Sandstone Varmala Stage', location: 'Varmala Stage · White Roses & Chandeliers', src: '/assets/photos/02-stage-royal-varmala.webp', wide: true },
    { id: 'hero-3', slot: 'home_hero', category: 'Floral Entry', title: 'Jasmine & Lantern Entry Tunnel', location: 'Walkway Entry · 40ft Illuminated Arch', src: '/assets/photos/06-entry-jasmine-walkway.webp', wide: true },
    { id: 'hero-4', slot: 'home_hero', category: 'Reception & Dining', title: 'Candlelit Emerald Banquet Courtyard', location: 'Evening Reception · Warm Bulb Canopy', src: '/assets/photos/07-reception-banquet.webp', wide: true },
    { id: 'home-sig-main', slot: 'home_signature', category: 'Reception & Dining', title: 'Concentric Brass Arch Ring Stage', location: 'Engagement & Reception Signature', src: '/assets/photos/08-stage-ring-arch.webp', wide: false },
    { id: 'about-craft-main', slot: 'about_craft', category: 'Planning', title: 'Venue Floor Plans & Material Board', location: 'Usha Event Planner · Farrukhabad Studio', src: '/assets/photos/10-planner-blueprints.webp', wide: true },
    { id: 'gal-1', slot: 'gallery', category: 'Mandap & Stage', title: 'Twilight Floral Mandap Pavilion', location: 'Four-Pillar Courtyard Mandap', src: '/assets/photos/01-hero-mandap-pavilion.webp', wide: true },
    { id: 'gal-2', slot: 'gallery', category: 'Mandap & Stage', title: 'Royal Sandstone Varmala Stage', location: 'Symmetrical Arch Stage & Chandeliers', src: '/assets/photos/02-stage-royal-varmala.webp', wide: true },
    { id: 'gal-3', slot: 'gallery', category: 'Mandap & Stage', title: 'Sheer Silk & Jasmine Phera Mandap', location: 'Intimate Havan Kund & Diya Platform', src: '/assets/photos/03-mandap-silk-jasmine.webp', wide: false },
    { id: 'gal-4', slot: 'gallery', category: 'Haldi & Mehendi', title: 'Marigold Courtyard Haldi Swing', location: 'Daytime Floral Curtains & Brass Urlis', src: '/assets/photos/04-haldi-marigold-swing.webp', wide: true },
    { id: 'gal-5', slot: 'gallery', category: 'Haldi & Mehendi', title: 'Botanical Emerald Mehendi Lounge', location: 'Cane Sofa, Hanging Lanterns & Jute Rugs', src: '/assets/photos/05-mehendi-botanical.webp', wide: false },
    { id: 'gal-6', slot: 'gallery', category: 'Floral Entry', title: 'Jasmine & Brass Lantern Walkway', location: 'Illuminated Bridal & Baraat Entry', src: '/assets/photos/06-entry-jasmine-walkway.webp', wide: true },
    { id: 'gal-7', slot: 'gallery', category: 'Reception & Dining', title: 'Candlelit Banquet Courtyard', location: 'Emerald & Ivory Silk Drapes + Candelabras', src: '/assets/photos/07-reception-banquet.webp', wide: true },
    { id: 'gal-8', slot: 'gallery', category: 'Reception & Dining', title: 'Concentric Brass Ring Ceremony Stage', location: 'White Hydrangeas & Ivory Velvet Sofa', src: '/assets/photos/08-stage-ring-arch.webp', wide: false },
    { id: 'gal-9', slot: 'gallery', category: 'Birthday & Events', title: 'Milestone Garden Arch & Dessert Table', location: 'Anniversary & Private Lawn Celebration', src: '/assets/photos/09-birthday-garden-arch.webp', wide: true }
  ],
  reviews: [
    {
      id: 'rev-1',
      family_name: 'Srivastava Family · Fatehgarh',
      event_type: 'Complete Wedding Mandap & Stage',
      quote: 'The floral mandap and candlelit entry walkway looked better in real life than in the sketches. Their crew finished setup two hours before Baraat arrival with zero last-minute stress.'
    },
    {
      id: 'rev-2',
      family_name: 'Gupta Family · Awas Vikas Colony',
      event_type: 'Haldi & Mehendi Courtyard',
      quote: 'Fresh marigold curtains and brass urlis turned our home terrace into a magazine setup. Every relative asked who planned the decor.'
    },
    {
      id: 'rev-3',
      family_name: 'Tiwari Family · Barhpur',
      event_type: 'Engagement & Ring Ceremony',
      quote: 'Transparent pricing from day one—no surprise lighting charges at night, and the concentric brass arch stage photographed cleanly from every angle.'
    }
  ]
};

const SHIFTS = [
  { id: 'Morning', label: 'Morning', range: '7:00 AM – 1:00 PM', defaultTime: '09:30' },
  { id: 'Afternoon', label: 'Afternoon', range: '1:00 PM – 6:00 PM', defaultTime: '14:00' },
  { id: 'Evening / Night', label: 'Evening / Night', range: '6:00 PM – 12:00 AM', defaultTime: '19:00' },
  { id: 'Full Day', label: 'Full Day', range: 'Morning to Night Setup', defaultTime: '10:00' }
];

const EVENT_TYPES = [
  'Wedding',
  'Haldi & Mehendi',
  'Engagement / Ring Ceremony',
  'Reception',
  'Birthday / Anniversary',
  'Corporate / Private Event'
];

const PAGE_ORDER = ['/', '/gallery', '/about', '/plans', '/booking', '/admin'];

let siteData = structuredClone ? structuredClone(FALLBACK_DATA) : JSON.parse(JSON.stringify(FALLBACK_DATA));

/* ---------- Live Server Bootstrap & Analytics Hooks ---------- */
async function syncFromServer() {
  try {
    const res = await fetch('/api/v1/bootstrap', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (data && Array.isArray(data.plans) && data.plans.length) {
      siteData = {
        studio: { ...FALLBACK_DATA.studio, ...(data.studio || {}) },
        offer: { ...FALLBACK_DATA.offer, ...(data.offer || {}) },
        plans: data.plans,
        addons: Array.isArray(data.addons) ? data.addons : FALLBACK_DATA.addons,
        bookedDates: Array.isArray(data.bookedDates) ? data.bookedDates : [],
        media: Array.isArray(data.media) && data.media.length ? data.media : FALLBACK_DATA.media,
        reviews: Array.isArray(data.reviews) && data.reviews.length ? data.reviews : FALLBACK_DATA.reviews,
        trendingPlanId: data.trendingPlanId || data.plans[0].id
      };
      updateShellBranding();
      return true;
    }
  } catch (_) {}
  return false;
}

function updateShellBranding() {
  const dot = document.getElementById('nav-offer-dot');
  const label = document.getElementById('nav-plans-label');
  if (dot) dot.style.display = siteData.offer && siteData.offer.active ? '' : 'none';
  if (label) label.textContent = siteData.offer && siteData.offer.active ? `Packages · ${siteData.offer.percent}% Off` : 'Event Packages';

  const brandName = document.getElementById('shell-brand-name');
  const footerPhone = document.getElementById('footer-phone-line');
  const footerWa = document.getElementById('footer-wa-link');
  const drawerContact = document.getElementById('drawer-contact-line');
  if (brandName && siteData.studio.name) brandName.textContent = siteData.studio.name;
  if (footerPhone) footerPhone.textContent = `${siteData.studio.phone} · ${siteData.studio.hours}`;
  if (footerWa) footerWa.href = `https://wa.me/${siteData.studio.whatsapp}`;
  if (drawerContact) drawerContact.textContent = `${siteData.studio.city} · ${siteData.studio.phone}`;
}

function trackPulse(payload) {
  const key = 'usha_pulse_' + (payload.planId || payload.category || '');
  if (!key || sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  fetch('/api/v1/pulse', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

function sendBookingRecord(payload) {
  fetch('/api/v1/book', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

/* ---------- Media Slot Helpers (Always Non-Empty) ---------- */
function getHeroFrames() {
  const list = siteData.media.filter((m) => m.slot === 'home_hero');
  return list.length ? list : FALLBACK_DATA.media.filter((m) => m.slot === 'home_hero');
}

function getGalleryItems() {
  const list = siteData.media.filter((m) => m.slot === 'gallery');
  return list.length ? list : FALLBACK_DATA.media.filter((m) => m.slot === 'gallery');
}

function getSlotPhoto(slotName, fallbackSrc) {
  const found = siteData.media.find((m) => m.slot === slotName);
  return found || { src: fallbackSrc, title: 'Usha Event Planner', location: 'Farrukhabad' };
}

/* ---------- Formatting Helpers ---------- */
function formatINR(amount) {
  return '₹' + Math.round(Number(amount || 0)).toLocaleString('en-IN');
}

function getPlanPricing(plan) {
  const base = Number(plan.price || 0);
  const off = siteData.offer;
  if (off && off.active && Number(off.percent) > 0) {
    const finalPrice = Math.round((base * (100 - Number(off.percent))) / 100);
    return { base, finalPrice, savings: base - finalPrice, hasOffer: true, percent: Number(off.percent) };
  }
  return { base, finalPrice: base, savings: 0, hasOffer: false, percent: 0 };
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitWordsMarkup(text) {
  return text
    .split(' ')
    .map((w, i) => `<span class="at-word" aria-hidden="true"><span style="--wd:${i * 42}ms">${escapeHtml(w)}</span></span>`)
    .join('');
}

function formatDateNice(iso) {
  if (!iso) return 'Not selected yet';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime12h(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return 'Flexible';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- Fullscreen Lightbox ---------- */
const lightboxEl = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
const lbMeta = document.getElementById('lb-meta');
const lbCounter = document.getElementById('lb-counter');
const lbClose = document.getElementById('lb-close');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');
const lbBook = document.getElementById('lb-book');

let lbItems = [];
let lbIndex = 0;
let lbTouchX = 0;

function renderLightboxFrame() {
  const item = lbItems[lbIndex];
  if (!item) return;
  lbImg.src = item.src;
  lbImg.alt = item.title;
  lbTitle.textContent = item.title;
  lbMeta.textContent = item.location || item.category || '';
  lbCounter.textContent = `${String(lbIndex + 1).padStart(2, '0')} / ${String(lbItems.length).padStart(2, '0')}`;
}

function openLightbox(items, startIdx = 0) {
  if (!items || !items.length) return;
  lbItems = items;
  lbIndex = Math.max(0, Math.min(startIdx, items.length - 1));
  renderLightboxFrame();
  lightboxEl.classList.add('is-open');
  lightboxEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox() {
  lightboxEl.classList.remove('is-open');
  lightboxEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function stepLightbox(delta) {
  if (!lbItems.length) return;
  lbIndex = (lbIndex + delta + lbItems.length) % lbItems.length;
  renderLightboxFrame();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => stepLightbox(-1));
lbNext.addEventListener('click', () => stepLightbox(1));
lbBook.addEventListener('click', () => {
  const item = lbItems[lbIndex];
  closeLightbox();
  const note = item ? `?style=${encodeURIComponent(item.title)}` : '';
  navigate('/booking' + note);
});
lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox(); });
lightboxEl.addEventListener('touchstart', (e) => { if (e.touches && e.touches[0]) lbTouchX = e.touches[0].clientX; }, { passive: true });
lightboxEl.addEventListener('touchend', (e) => {
  if (!e.changedTouches || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - lbTouchX;
  if (Math.abs(dx) > 48) stepLightbox(dx < 0 ? 1 : -1);
}, { passive: true });
window.addEventListener('keydown', (e) => {
  if (!lightboxEl.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') stepLightbox(1);
  else if (e.key === 'ArrowLeft') stepLightbox(-1);
});

/* ---------- Mobile Drawer ---------- */
const drawer = document.getElementById('mobile-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const menuToggle = document.getElementById('menu-toggle');
const drawerClose = document.getElementById('drawer-close');

function setDrawer(open) {
  drawer.classList.toggle('is-open', open);
  drawerBackdrop.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  menuToggle.setAttribute('aria-expanded', String(open));
}

menuToggle.addEventListener('click', () => setDrawer(!drawer.classList.contains('is-open')));
drawerClose.addEventListener('click', () => setDrawer(false));
drawerBackdrop.addEventListener('click', () => setDrawer(false));

/* ---------- Dual Reveal Safety Net + Scroll-Scrubbed Copy ---------- */
function setupMotion(rootEl) {
  const reveals = Array.from(rootEl.querySelectorAll('.reveal'));
  const scrubs = Array.from(rootEl.querySelectorAll('.at-scrub'));

  const updateScrollMotion = () => {
    const vh = window.innerHeight || 800;
    for (const el of reveals) {
      if (el.classList.contains('is-in')) continue;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.96 && r.bottom > 0) el.classList.add('is-in');
    }
    for (const el of scrubs) {
      const r = el.getBoundingClientRect();
      const prog = Math.max(0, Math.min(1, (vh * 0.92 - r.top) / (vh * 0.42)));
      el.style.setProperty('--scrub', prog.toFixed(3));
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.02 }
  );
  for (const el of reveals) io.observe(el);
  requestAnimationFrame(updateScrollMotion);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateScrollMotion();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

/* ==========================================================================
   PAGE 1: HOME (#/) — 3D Mandap Pavilion + Coverflow + Bento Services + Reviews
   ========================================================================== */
function renderHomePage() {
  const { studio, offer, plans, reviews, trendingPlanId } = siteData;
  const heroFrames = getHeroFrames();
  const gallery = getGalleryItems();
  const homeSig = getSlotPhoto('home_signature', '/assets/photos/08-stage-ring-arch.webp');
  const cfItems = gallery.slice(0, Math.min(6, gallery.length));

  const findCatImg = (cat, fb) => {
    const found = gallery.find((g) => g.category === cat);
    return found ? found.src : fb;
  };

  const offerRibbon = offer.active
    ? `<div class="offer-ribbon">
         <div class="offer-ribbon-inner">
           <div class="offer-ribbon-main">
             <span class="offer-pill-tag">${escapeHtml(offer.title)} · ${offer.percent}% Off</span>
             <span>${escapeHtml(offer.note)}</span>
           </div>
           <a class="offer-ribbon-link" href="#/plans">See Offer Packages</a>
         </div>
       </div>`
    : '';

  const coverflowSlides = cfItems
    .map(
      (item, idx) => `
      <article class="cf-slide" data-cf-idx="${idx}">
        <div class="cf-card">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" loading="${idx < 2 ? 'eager' : 'lazy'}" />
          <div class="cf-overlay">
            <div class="cf-meta">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.category)} · ${escapeHtml(item.location)}</p>
            </div>
            <button type="button" class="cf-expand" data-expand-idx="${idx}" aria-label="View ${escapeHtml(item.title)} fullscreen">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
          </div>
        </div>
      </article>`
    )
    .join('');

  const cfDots = cfItems
    .map(
      (_, idx) => `
      <button type="button" class="cf-dot ${idx === 0 ? 'is-active' : ''}" data-cf-dot="${idx}" aria-label="Go to slide ${idx + 1}">
        <span class="cf-dot-fill"></span>
      </button>`
    )
    .join('');

  const planTeasers = plans
    .map((plan) => {
      const { base, finalPrice, savings, hasOffer } = getPlanPricing(plan);
      const isTrend = plan.id === trendingPlanId;
      return `
        <article class="plan-card reveal ${isTrend ? 'is-trending' : ''}">
          <div>
            <div class="plan-badges">
              ${isTrend ? '<span class="badge-trending">Most Booked Package</span>' : `<span class="badge-views">${escapeHtml(plan.duration)}</span>`}
              <span class="badge-views">${escapeHtml(plan.event_scope)}</span>
            </div>
            <h3>${escapeHtml(plan.name)}</h3>
            <p class="plan-desc">${escapeHtml(plan.tagline)}</p>
            <div class="plan-price-row">
              <span class="price-final">${formatINR(finalPrice)}</span>
              ${hasOffer ? `<span class="price-old">${formatINR(base)}</span><span class="price-save">Save ${formatINR(savings)}</span>` : ''}
            </div>
            <ul class="plan-features">
              ${plan.deliverables.slice(0, 3).map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
            </ul>
          </div>
          <div class="plan-card-actions">
            <a class="btn btn-brass" href="#/booking?plan=${encodeURIComponent(plan.id)}">Check Date &amp; Book</a>
            <a class="btn btn-ghost-dark" href="#/plans">Full Details</a>
          </div>
        </article>`;
    })
    .join('');

  const reviewsHtml = reviews
    .slice(0, 3)
    .map(
      (r) => `
      <article class="review-card reveal">
        <p class="review-quote">“${escapeHtml(r.quote)}”</p>
        <div class="review-author">
          <strong>${escapeHtml(r.family_name)}</strong>
          <span>${escapeHtml(r.event_type)}</span>
        </div>
      </article>`
    )
    .join('');

  return `
    ${offerRibbon}
    <section class="hero-courtyard">
      <div class="hero-backdrop-wash" aria-hidden="true"></div>
      <div class="container hero-grid">
        <div class="hero-copy">
          <div class="hero-location">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHtml(studio.city)}</span>
          </div>
          <h1 class="display-xl" aria-label="Celebrations designed from floor plan to final lantern.">
            ${splitWordsMarkup('Celebrations designed from floor plan to final lantern.')}
          </h1>
          <p class="lead-copy">
            ${escapeHtml(studio.name)} plans and builds royal floral mandaps, Varmala stages, Haldi courtyards, illuminated walkways, and full wedding hospitality across Farrukhabad and Fatehgarh.
          </p>
          <div class="hero-cta-row">
            <a class="btn btn-brass" href="#/booking">Check Date Availability</a>
            <a class="btn btn-ghost-dark" href="#/plans">View Packages</a>
            <a class="btn btn-ghost-dark" href="#/gallery">Decor Gallery</a>
          </div>
          <div class="hero-facts">
            <div class="hero-fact">
              <strong>450+</strong>
              <span>Events produced</span>
            </div>
            <div class="hero-fact">
              <strong>Fresh Florals</strong>
              <span>Mogra, marigold &amp; roses</span>
            </div>
            <div class="hero-fact">
              <strong>On-Time Crew</strong>
              <span>Ready before Baraat</span>
            </div>
          </div>
        </div>

        <div class="stage-card" id="hero-stage-card">
          <img id="hero-fallback-img" class="stage-photo-fallback" src="${escapeHtml(heroFrames[0].src)}" alt="${escapeHtml(heroFrames[0].title)}" />
          <div id="hero-3d-host" class="stage-canvas-host" aria-label="Interactive 3D architectural wedding mandap pavilion — drag horizontally to rotate"></div>
          <div class="stage-vignette" aria-hidden="true"></div>

          <div class="stage-top-bar">
            <div class="glass-segment" role="group" aria-label="Display mode">
              <button type="button" class="glass-seg-btn is-active" id="mode-3d-btn">3D Pavilion</button>
              <button type="button" class="glass-seg-btn" id="mode-photo-btn">Photo</button>
            </div>
            <button type="button" class="stage-icon-btn" id="stage-pause-btn">Pause</button>
          </div>

          <div class="stage-bottom-bar">
            <div class="stage-caption">
              <strong id="stage-frame-title">${escapeHtml(heroFrames[0].title)}</strong>
              <span id="stage-frame-meta">${escapeHtml(heroFrames[0].location)} · Drag to orbit</span>
            </div>
            <div class="stage-frame-dots" aria-label="Switch decor preview">
              ${heroFrames
                .slice(0, 5)
                .map(
                  (f, i) => `<button type="button" class="stage-dot ${i === 0 ? 'is-active' : ''}" data-hero-frame="${i}" aria-label="Show ${escapeHtml(f.title)}"><img src="${escapeHtml(f.src)}" alt="" /></button>`
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container">
        <div class="chapter-rail">
          <span>Recent Venue Transformations</span>
          <span>Swipe or drag the reel · Tap expand for fullscreen</span>
        </div>
        <div class="chapter-head reveal">
          <div>
            <h2 class="display-lg">Spaces built for unforgettable evenings</h2>
            <p class="at-scrub">Every venue has different light, lawn depth, and guest flow. We proportion stage height, floral density, and candle placement to fit your exact guest house or courtyard.</p>
          </div>
          <a class="btn btn-ghost-light" href="#/gallery">Explore All Setups</a>
        </div>

        <div class="coverflow-track" id="cf-track">${coverflowSlides}</div>
        <div class="cf-controls">
          <div class="cf-dots" id="cf-dots">${cfDots}</div>
          <div class="cf-nav-btns">
            <button type="button" class="icon-circle-btn" id="cf-play-btn" aria-label="Pause slideshow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
            <button type="button" class="icon-circle-btn" id="cf-prev-btn" aria-label="Previous slide">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button type="button" class="icon-circle-btn" id="cf-next-btn" aria-label="Next slide">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="linen-chapter">
      <div class="container">
        <div class="chapter-rail">
          <span>What We Design &amp; Produce</span>
          <span>Tap any category to browse setups</span>
        </div>
        <div class="chapter-head reveal">
          <div>
            <h2 class="display-lg">Built for every wedding ritual &amp; family milestone</h2>
          </div>
          <a class="btn btn-primary" href="#/gallery">Open Decor Gallery</a>
        </div>

        <div class="bento-grid">
          <a class="bento-card span-7 reveal" href="#/gallery?cat=Mandap+%26+Stage">
            <img src="${escapeHtml(findCatImg('Mandap & Stage', '/assets/photos/02-stage-royal-varmala.webp'))}" alt="Royal wedding mandap and varmala stage" loading="lazy" />
            <div class="bento-scrim" aria-hidden="true"></div>
            <div class="bento-content">
              <h3>Mandap &amp; Varmala Stages</h3>
              <p>Carved arches, fresh jasmine phera pavilions, chandeliers, and balanced stage lighting built for photography.</p>
            </div>
          </a>

          <a class="bento-card span-5 reveal" href="#/gallery?cat=Haldi+%26+Mehendi">
            <img src="${escapeHtml(findCatImg('Haldi & Mehendi', '/assets/photos/04-haldi-marigold-swing.webp'))}" alt="Haldi and Mehendi courtyard decor" loading="lazy" />
            <div class="bento-scrim" aria-hidden="true"></div>
            <div class="bento-content">
              <h3>Haldi &amp; Mehendi Courtyards</h3>
              <p>Marigold flower curtains, floral swings, brass urlis, and shaded botanical cane seating.</p>
            </div>
          </a>

          <a class="bento-card span-6 reveal" href="#/gallery?cat=Floral+Entry">
            <img src="${escapeHtml(findCatImg('Floral Entry', '/assets/photos/06-entry-jasmine-walkway.webp'))}" alt="Illuminated floral wedding entry walkway" loading="lazy" />
            <div class="bento-scrim" aria-hidden="true"></div>
            <div class="bento-content">
              <h3>Floral Walkways &amp; Bridal Entries</h3>
              <p>Illuminated 40-foot mogra tunnels, candle lantern aisles, cold pyro cues, and phoolon ki chadar.</p>
            </div>
          </a>

          <a class="bento-card span-6 reveal" href="#/gallery?cat=Birthday+%26+Events">
            <img src="${escapeHtml(findCatImg('Birthday & Events', '/assets/photos/09-birthday-garden-arch.webp'))}" alt="Anniversary and birthday garden celebration" loading="lazy" />
            <div class="bento-scrim" aria-hidden="true"></div>
            <div class="bento-content">
              <h3>Receptions, Anniversaries &amp; Birthdays</h3>
              <p>Candlelit banquet dining tables, overhead warm Edison bulb canopies, and intimate lawn setups.</p>
            </div>
          </a>
        </div>
      </div>
    </section>

    <section class="silk-chapter">
      <div class="container editorial-split">
        <div class="arch-portrait-frame reveal">
          <img src="${escapeHtml(homeSig.src)}" alt="${escapeHtml(homeSig.title)}" loading="lazy" />
        </div>
        <div class="reveal">
          <h2 class="display-lg">Why Farrukhabad families trust Usha Event Planner with their biggest dates</h2>
          <p class="lead-copy at-scrub" style="color:var(--muted);margin-top:16px;">
            Wedding decor is not just renting frames and lights—it is showing up at 6:00 AM with fresh blooms, hiding every cable neatly, and staying calm on site until the final family portrait is taken.
          </p>
          <div class="story-points">
            <div class="story-point">
              <span class="story-num">01</span>
              <div>
                <h3>Fresh morning florals &amp; clean metalwork</h3>
                <p>No faded plastic backdrops or mismatched drapes. Every marigold garland, brass urli, and sofa fabric is checked before loading.</p>
              </div>
            </div>
            <div class="story-point">
              <span class="story-num">02</span>
              <div>
                <h3>One coordinator for stage, lights &amp; entry</h3>
                <p>Your family enjoys the rituals while our on-site supervisor coordinates truss lighting, cold pyro, DJ cues, and bridal entry timing.</p>
              </div>
            </div>
            <div class="story-point">
              <span class="story-num">03</span>
              <div>
                <h3>Written quote before advance booking</h3>
                <p>Every stage dimension, add-on, generator/lighting detail, and setup timeline is confirmed clearly on WhatsApp upfront.</p>
              </div>
            </div>
          </div>
          <div class="hero-cta-row">
            <a class="btn btn-primary" href="#/about">How We Plan Events</a>
            <a class="btn btn-ghost-light" href="#/booking">Check Your Date</a>
          </div>
        </div>
      </div>
    </section>

    <section class="emerald-chapter">
      <div class="container">
        <div class="chapter-rail">
          <span>Event &amp; Decor Packages</span>
          <span>${offer.active ? `${offer.percent}% ${escapeHtml(offer.title)} active` : 'Transparent venue packages'}</span>
        </div>
        <div class="chapter-head reveal">
          <div>
            <h2 class="display-lg">Clear starting packages for every function</h2>
            <p>Choose a package, add optional extras like cold pyro or low fog on the Booking page, and confirm availability straight on WhatsApp.</p>
          </div>
          <a class="btn btn-brass" href="#/booking">Reserve Your Date</a>
        </div>
        <div class="plans-grid">${planTeasers}</div>
      </div>
    </section>

    <section class="silk-chapter">
      <div class="container">
        <div class="chapter-rail">
          <span>Family Words</span>
          <span>Real events hosted across Farrukhabad &amp; Fatehgarh</span>
        </div>
        <div class="chapter-head reveal">
          <div>
            <h2 class="display-lg">What local families say after the wedding</h2>
          </div>
        </div>
        <div class="reviews-grid">${reviewsHtml}</div>

        <div class="next-page-bar reveal">
          <div>
            <span style="font-size:0.84rem;color:var(--muted);">Next Page</span>
            <h3 class="display-md">Explore the Full Decor Gallery by Function</h3>
          </div>
          <a class="btn btn-primary" href="#/gallery">Open Decor Gallery</a>
        </div>
      </div>
    </section>
  `;
}

function hydrateHomePage(rootEl) {
  const cleanups = [];
  const heroFrames = getHeroFrames().slice(0, 5);
  const gallery = getGalleryItems();
  const cfItems = gallery.slice(0, Math.min(6, gallery.length));

  const stageCard = rootEl.querySelector('#hero-stage-card');
  const stageHost = rootEl.querySelector('#hero-3d-host');
  const fallbackImg = rootEl.querySelector('#hero-fallback-img');
  const titleEl = rootEl.querySelector('#stage-frame-title');
  const metaEl = rootEl.querySelector('#stage-frame-meta');
  const btn3d = rootEl.querySelector('#mode-3d-btn');
  const btnPhoto = rootEl.querySelector('#mode-photo-btn');
  const btnPause = rootEl.querySelector('#stage-pause-btn');
  const frameDots = Array.from(rootEl.querySelectorAll('[data-hero-frame]'));

  let stageCtrl = null;
  let is3dMode = true;
  let isPaused = false;
  let unmounted = false;

  const init3D = async () => {
    const ctrl = await mountMandapPavilion3D(stageHost, heroFrames[0].src, {
      onReady() {
        if (!unmounted && is3dMode) stageCard.classList.add('is-3d-live');
      }
    });
    if (unmounted) {
      ctrl.dispose();
      return;
    }
    stageCtrl = ctrl;
    if (!ctrl.supported) {
      is3dMode = false;
      stageCard.classList.remove('is-3d-live');
      btn3d.classList.remove('is-active');
      btnPhoto.classList.add('is-active');
      btn3d.disabled = true;
      btnPause.style.display = 'none';
    }
  };

  const tId = setTimeout(init3D, 120);
  cleanups.push(() => {
    unmounted = true;
    clearTimeout(tId);
    if (stageCtrl) stageCtrl.dispose();
  });

  const onMode3d = () => {
    if (!stageCtrl || !stageCtrl.supported) return;
    is3dMode = true;
    stageCard.classList.add('is-3d-live');
    stageHost.style.opacity = '1';
    stageHost.style.pointerEvents = 'auto';
    stageCtrl.setPaused(isPaused);
    btn3d.classList.add('is-active');
    btnPhoto.classList.remove('is-active');
    btnPause.style.display = '';
  };

  const onModePhoto = () => {
    is3dMode = false;
    stageCard.classList.remove('is-3d-live');
    stageHost.style.opacity = '0';
    stageHost.style.pointerEvents = 'none';
    if (stageCtrl) stageCtrl.setPaused(true);
    btnPhoto.classList.add('is-active');
    btn3d.classList.remove('is-active');
    btnPause.style.display = 'none';
  };

  const onPauseToggle = () => {
    isPaused = !isPaused;
    btnPause.textContent = isPaused ? 'Play' : 'Pause';
    if (stageCtrl && is3dMode) stageCtrl.setPaused(isPaused);
  };

  btn3d.addEventListener('click', onMode3d);
  btnPhoto.addEventListener('click', onModePhoto);
  btnPause.addEventListener('click', onPauseToggle);
  cleanups.push(() => {
    btn3d.removeEventListener('click', onMode3d);
    btnPhoto.removeEventListener('click', onModePhoto);
    btnPause.removeEventListener('click', onPauseToggle);
  });

  frameDots.forEach((dot, idx) => {
    const h = () => {
      const f = heroFrames[idx];
      if (!f) return;
      frameDots.forEach((d, j) => d.classList.toggle('is-active', j === idx));
      fallbackImg.src = f.src;
      fallbackImg.alt = f.title;
      titleEl.textContent = f.title;
      metaEl.textContent = `${f.location} · Drag to orbit`;
      if (stageCtrl && stageCtrl.supported) stageCtrl.setPhoto(f.src);
    };
    dot.addEventListener('click', h);
    cleanups.push(() => dot.removeEventListener('click', h));
  });

  // 3D Coverflow Carousel
  const track = rootEl.querySelector('#cf-track');
  const slides = Array.from(track.querySelectorAll('.cf-slide'));
  const dots = Array.from(rootEl.querySelectorAll('.cf-dot'));
  const prevBtn = rootEl.querySelector('#cf-prev-btn');
  const nextBtn = rootEl.querySelector('#cf-next-btn');
  const playBtn = rootEl.querySelector('#cf-play-btn');

  let activeIdx = 0;
  let scrollLockUntil = 0;
  let autoPlay = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let hovering = false;
  let touching = false;
  let inView = true;
  let slideStart = performance.now();
  const SLIDE_MS = 5200;
  let cfRaf = 0;

  function updateCoverflowTransforms() {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let closest = 0;
    let closestDist = Infinity;

    for (let i = 0; i < slides.length; i++) {
      const r = slides[i].getBoundingClientRect();
      const slideCenter = r.left + r.width / 2;
      const shift = Math.max(-1, Math.min(1, (slideCenter - center) / Math.max(r.width, 1)));
      const absShift = Math.abs(shift);
      slides[i].style.setProperty('--hl-shift', shift.toFixed(4));
      slides[i].style.setProperty('--hl-abs', absShift.toFixed(4));
      if (absShift < closestDist) {
        closestDist = absShift;
        closest = i;
      }
    }
    if (performance.now() > scrollLockUntil && closest !== activeIdx) setActiveDot(closest);
  }

  function setActiveDot(idx) {
    activeIdx = idx;
    slideStart = performance.now();
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
      const fill = d.querySelector('.cf-dot-fill');
      if (fill) fill.style.transform = 'scaleX(0)';
    });
  }

  function goToSlide(idx, smooth = true) {
    if (!slides.length) return;
    const target = (idx + slides.length) % slides.length;
    setActiveDot(target);
    scrollLockUntil = performance.now() + 560;
    const s = slides[target];
    if (s) {
      const left = s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
      track.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    }
  }

  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragLastX = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;

  const onTrackDown = (e) => {
    if (e.pointerType !== 'mouse' || e.target.closest('button')) return;
    dragging = true;
    track.classList.add('is-dragging');
    dragStartX = e.clientX;
    dragLastX = e.clientX;
    dragLastTime = performance.now();
    dragStartScroll = track.scrollLeft;
    dragVelocity = 0;
  };
  const onTrackMove = (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - dragLastTime);
    dragVelocity = (e.clientX - dragLastX) / dt;
    dragLastX = e.clientX;
    dragLastTime = now;
    track.scrollLeft = dragStartScroll - (e.clientX - dragStartX);
  };
  const onTrackUp = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    if (Math.abs(dragVelocity) > 0.45) goToSlide(activeIdx + (dragVelocity < 0 ? 1 : -1));
  };

  const onTrackScroll = () => updateCoverflowTransforms();
  const onTrackEnter = () => { hovering = true; };
  const onTrackLeave = () => { hovering = false; slideStart = performance.now(); };
  const onTrackTouchStart = () => { touching = true; };
  const onTrackTouchEnd = () => { touching = false; slideStart = performance.now(); };

  track.addEventListener('scroll', onTrackScroll, { passive: true });
  track.addEventListener('pointerdown', onTrackDown);
  window.addEventListener('pointermove', onTrackMove, { passive: true });
  window.addEventListener('pointerup', onTrackUp, { passive: true });
  track.addEventListener('mouseenter', onTrackEnter);
  track.addEventListener('mouseleave', onTrackLeave);
  track.addEventListener('touchstart', onTrackTouchStart, { passive: true });
  track.addEventListener('touchend', onTrackTouchEnd, { passive: true });
  window.addEventListener('resize', updateCoverflowTransforms, { passive: true });

  const onPrev = () => goToSlide(activeIdx - 1);
  const onNext = () => goToSlide(activeIdx + 1);
  const onTogglePlay = () => {
    autoPlay = !autoPlay;
    slideStart = performance.now();
    playBtn.setAttribute('aria-label', autoPlay ? 'Pause slideshow' : 'Play slideshow');
    playBtn.innerHTML = autoPlay
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
  };

  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  playBtn.addEventListener('click', onTogglePlay);

  dots.forEach((d, idx) => {
    const h = () => goToSlide(idx);
    d.addEventListener('click', h);
    cleanups.push(() => d.removeEventListener('click', h));
  });

  Array.from(rootEl.querySelectorAll('[data-expand-idx]')).forEach((btn) => {
    const h = () => openLightbox(cfItems, Number(btn.dataset.expandIdx));
    btn.addEventListener('click', h);
    cleanups.push(() => btn.removeEventListener('click', h));
  });

  const cfIo = new IntersectionObserver((entries) => {
    inView = !!(entries[0] && entries[0].isIntersecting);
    if (inView) slideStart = performance.now();
  }, { threshold: 0.15 });
  cfIo.observe(track);

  function cfLoop(now) {
    cfRaf = requestAnimationFrame(cfLoop);
    const activeFill = dots[activeIdx] && dots[activeIdx].querySelector('.cf-dot-fill');
    if (autoPlay && !hovering && !touching && !dragging && inView && !document.hidden) {
      const progress = Math.min(1, (now - slideStart) / SLIDE_MS);
      if (activeFill) activeFill.style.transform = `scaleX(${progress.toFixed(4)})`;
      if (progress >= 1) goToSlide(activeIdx + 1);
    } else {
      slideStart = now;
    }
  }
  cfRaf = requestAnimationFrame(cfLoop);
  requestAnimationFrame(updateCoverflowTransforms);

  cleanups.push(() => {
    cancelAnimationFrame(cfRaf);
    cfIo.disconnect();
    track.removeEventListener('scroll', onTrackScroll);
    track.removeEventListener('pointerdown', onTrackDown);
    window.removeEventListener('pointermove', onTrackMove);
    window.removeEventListener('pointerup', onTrackUp);
    track.removeEventListener('mouseenter', onTrackEnter);
    track.removeEventListener('mouseleave', onTrackLeave);
    track.removeEventListener('touchstart', onTrackTouchStart);
    track.removeEventListener('touchend', onTrackTouchEnd);
    window.removeEventListener('resize', updateCoverflowTransforms);
    prevBtn.removeEventListener('click', onPrev);
    nextBtn.removeEventListener('click', onNext);
    playBtn.removeEventListener('click', onTogglePlay);
  });

  return () => cleanups.forEach((fn) => fn());
}

/* ==========================================================================
   PAGE 2: DECOR GALLERY (#/gallery)
   ========================================================================== */
function renderGalleryPage(query) {
  const gallery = getGalleryItems();
  const presentCats = Array.from(new Set(gallery.map((g) => g.category)));
  const categories = ['All', ...presentCats];
  const reqCat = query.get('cat');
  const startCat = reqCat && categories.includes(reqCat) ? reqCat : 'All';
  const headerPhoto = gallery.find((g) => g.category === 'Floral Entry') || gallery[0];

  return `
    <section class="sub-hero">
      <img class="sub-hero-bg" src="${escapeHtml(headerPhoto.src)}" alt="" />
      <div class="sub-hero-scrim" aria-hidden="true"></div>
      <div class="container sub-hero-inner">
        <h1 class="display-xl" aria-label="Wedding & Event Decor Gallery">${splitWordsMarkup('Wedding & Event Decor Gallery')}</h1>
        <p class="lead-copy">
          Filter setups by function—Mandap &amp; Stage, Haldi &amp; Mehendi, Floral Entries, Evening Receptions, and Milestone Birthdays. Tap any frame to inspect fullscreen or book that exact style.
        </p>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container">
        <div class="filter-rail-wrap">
          <div class="segmented-control" id="gallery-filter" role="tablist" aria-label="Filter decor by event type">
            <span class="seg-indicator" id="seg-indicator" aria-hidden="true"></span>
            ${categories
              .map(
                (cat) => `<button type="button" role="tab" aria-selected="${cat === startCat}" class="seg-btn ${cat === startCat ? 'is-active' : ''}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
              )
              .join('')}
          </div>
          <span id="gallery-count" style="font-size:0.88rem;color:var(--muted);">Showing ${gallery.length} setups</span>
        </div>

        <div class="spotlight-box reveal" id="spotlight-box">
          <div class="spotlight-stage" id="spotlight-stage">
            <img class="spotlight-img" id="spotlight-img" src="${escapeHtml(gallery[0].src)}" alt="${escapeHtml(gallery[0].title)}" />
          </div>
          <div class="spotlight-bar">
            <div>
              <strong id="spotlight-title" style="font-family:var(--font-display);font-size:1.5rem;font-weight:500;">${escapeHtml(gallery[0].title)}</strong>
              <div id="spotlight-meta" style="font-size:0.86rem;color:var(--mist);">${escapeHtml(gallery[0].category)} · ${escapeHtml(gallery[0].location)}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button type="button" class="stage-icon-btn" id="spot-prev">Prev</button>
              <button type="button" class="stage-icon-btn" id="spot-next">Next</button>
              <button type="button" class="btn btn-brass" style="min-height:40px;padding:0 16px;font-size:0.84rem;" id="spot-expand">Fullscreen</button>
            </div>
          </div>
          <div class="thumb-strip" id="thumb-strip"></div>
        </div>

        <div class="gallery-grid" id="gallery-grid"></div>

        <div class="next-page-bar reveal">
          <div>
            <span style="font-size:0.84rem;color:var(--muted);">Next Page</span>
            <h3 class="display-md">See How Our Crew Plans &amp; Builds Each Venue</h3>
          </div>
          <a class="btn btn-primary" href="#/about">About Usha Event Planner</a>
        </div>
      </div>
    </section>
  `;
}

function hydrateGalleryPage(rootEl, query) {
  const gallery = getGalleryItems();
  const filterWrap = rootEl.querySelector('#gallery-filter');
  const segBtns = Array.from(filterWrap.querySelectorAll('.seg-btn'));
  const indicator = rootEl.querySelector('#seg-indicator');
  const countEl = rootEl.querySelector('#gallery-count');
  const gridEl = rootEl.querySelector('#gallery-grid');

  const spotStage = rootEl.querySelector('#spotlight-stage');
  const spotTitle = rootEl.querySelector('#spotlight-title');
  const spotMeta = rootEl.querySelector('#spotlight-meta');
  const spotPrev = rootEl.querySelector('#spot-prev');
  const spotNext = rootEl.querySelector('#spot-next');
  const spotExpand = rootEl.querySelector('#spot-expand');
  const thumbStrip = rootEl.querySelector('#thumb-strip');

  const reqCat = query.get('cat');
  let activeCat = segBtns.some((b) => b.dataset.cat === reqCat) ? reqCat : 'All';
  let filtered = [...gallery];
  let spotIdx = 0;
  let touchStartX = 0;

  function positionIndicator() {
    const active = filterWrap.querySelector('.seg-btn.is-active');
    if (!active) return;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  function renderSpotlight(dir = '') {
    const item = filtered[spotIdx] || filtered[0];
    if (!item) return;
    const wipeClass = dir === 'next' ? 'wipe-next' : dir === 'prev' ? 'wipe-prev' : '';
    spotStage.innerHTML = `<img class="spotlight-img ${wipeClass}" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" />`;
    spotTitle.textContent = item.title;
    spotMeta.textContent = `${item.category} · ${item.location}`;
    Array.from(thumbStrip.querySelectorAll('.thumb-btn')).forEach((b, i) => {
      b.classList.toggle('is-active', i === spotIdx);
    });
  }

  function renderFiltered() {
    filtered = activeCat === 'All' ? [...gallery] : gallery.filter((g) => g.category === activeCat);
    spotIdx = 0;
    countEl.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'setup' : 'setups'}`;

    thumbStrip.innerHTML = filtered
      .map(
        (item, idx) => `<button type="button" class="thumb-btn ${idx === 0 ? 'is-active' : ''}" data-thumb="${idx}" aria-label="Show ${escapeHtml(item.title)}"><img src="${escapeHtml(item.src)}" alt="" /></button>`
      )
      .join('');

    gridEl.innerHTML = filtered
      .map(
        (item, idx) => `
        <button type="button" class="gallery-tile ${item.wide && activeCat === 'All' ? 'is-wide' : ''}" data-tile-idx="${idx}">
          <div class="gallery-tile-media">
            <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy" />
          </div>
          <div class="gallery-tile-cap">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.category)} · ${escapeHtml(item.location)}</span>
          </div>
        </button>`
      )
      .join('');

    renderSpotlight('');
  }

  const onFilterClick = (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    activeCat = btn.dataset.cat;
    if (activeCat !== 'All') trackPulse({ category: activeCat });
    segBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    positionIndicator();
    renderFiltered();
  };

  const onThumbClick = (e) => {
    const btn = e.target.closest('.thumb-btn');
    if (!btn) return;
    const nextIdx = Number(btn.dataset.thumb);
    const dir = nextIdx >= spotIdx ? 'next' : 'prev';
    spotIdx = nextIdx;
    renderSpotlight(dir);
  };

  const onGridClick = (e) => {
    const tile = e.target.closest('.gallery-tile');
    if (!tile) return;
    openLightbox(filtered, Number(tile.dataset.tileIdx));
  };

  const onPrev = () => { spotIdx = (spotIdx - 1 + filtered.length) % filtered.length; renderSpotlight('prev'); };
  const onNext = () => { spotIdx = (spotIdx + 1) % filtered.length; renderSpotlight('next'); };
  const onExpand = () => openLightbox(filtered, spotIdx);

  const onTouchStart = (e) => { if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 42) (dx < 0 ? onNext : onPrev)();
  };

  filterWrap.addEventListener('click', onFilterClick);
  thumbStrip.addEventListener('click', onThumbClick);
  gridEl.addEventListener('click', onGridClick);
  spotPrev.addEventListener('click', onPrev);
  spotNext.addEventListener('click', onNext);
  spotExpand.addEventListener('click', onExpand);
  spotStage.addEventListener('touchstart', onTouchStart, { passive: true });
  spotStage.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('resize', positionIndicator, { passive: true });

  if (activeCat !== 'All') trackPulse({ category: activeCat });
  renderFiltered();
  requestAnimationFrame(positionIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionIndicator);

  return () => {
    filterWrap.removeEventListener('click', onFilterClick);
    thumbStrip.removeEventListener('click', onThumbClick);
    gridEl.removeEventListener('click', onGridClick);
    spotPrev.removeEventListener('click', onPrev);
    spotNext.removeEventListener('click', onNext);
    spotExpand.removeEventListener('click', onExpand);
    spotStage.removeEventListener('touchstart', onTouchStart);
    spotStage.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('resize', positionIndicator);
  };
}

/* ==========================================================================
   PAGE 3: ABOUT US (#/about) — Venue Blueprint Craft + Sticky 4-Step Execution
   ========================================================================== */
function getExecutionSteps() {
  const craftPhoto = getSlotPhoto('about_craft', '/assets/photos/10-planner-blueprints.webp');
  const heroFrames = getHeroFrames();
  const gallery = getGalleryItems();
  const haldi = gallery.find((g) => g.category === 'Haldi & Mehendi') || gallery[0];
  const reception = gallery.find((g) => g.category === 'Reception & Dining') || gallery[0];

  return [
    {
      step: 'Step 01 · Venue Visit & Moodboard',
      title: 'Walk the lawn and lock the color story',
      copy: 'We measure stage sightlines, guest entry width, power points, and dining zones at your Farrukhabad or Fatehgarh venue before suggesting fabrics and blooms.',
      img: craftPhoto.src,
      alt: craftPhoto.title
    },
    {
      step: 'Step 02 · Custom Floor Plan & Quote',
      title: 'Clear layout with every structure listed',
      copy: 'You approve the mandap style, Varmala backdrop, entry length, lighting warmth, and optional add-ons in one transparent written estimate.',
      img: haldi.src,
      alt: haldi.title
    },
    {
      step: 'Step 03 · Early-Morning Fresh Setup',
      title: 'Truss, fabrics, and fresh flowers installed early',
      copy: 'Our carpenters, electricians, and florists begin early morning so every marigold string, brass lantern, and chandelier is tested hours before guests arrive.',
      img: heroFrames[0].src,
      alt: heroFrames[0].title
    },
    {
      step: 'Step 04 · Live Event Coordination',
      title: 'Calm supervision through Varmala & Reception',
      copy: 'A dedicated planner stays on site to cue bridal entry music, cold-pyro shots, lighting dips, and post-ceremony pack-up without troubling the family.',
      img: reception.src,
      alt: reception.title
    }
  ];
}

function renderAboutPage() {
  const { studio, reviews } = siteData;
  const craftPhoto = getSlotPhoto('about_craft', '/assets/photos/10-planner-blueprints.webp');
  const steps = getExecutionSteps();

  return `
    <section class="sub-hero">
      <img class="sub-hero-bg" src="${escapeHtml(craftPhoto.src)}" alt="" />
      <div class="sub-hero-scrim" aria-hidden="true"></div>
      <div class="container sub-hero-inner">
        <h1 class="display-xl" aria-label="Planned with precision, styled with warmth.">${splitWordsMarkup('Planned with precision, styled with warmth.')}</h1>
        <p class="lead-copy">
          ${escapeHtml(studio.name)} brings together floral artisans, structural carpentry, warm architectural lighting, and calm wedding management for families across Farrukhabad and Fatehgarh.
        </p>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container editorial-split">
        <div class="reveal">
          <div style="border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-card);">
            <img src="${escapeHtml(craftPhoto.src)}" alt="${escapeHtml(craftPhoto.title)}" />
          </div>
        </div>
        <div class="reveal">
          <h2 class="display-lg">Architectural floor plans, fresh florals, zero last-minute chaos</h2>
          <p class="at-scrub" style="color:var(--muted);margin-top:16px;">
            Great events feel effortless because the hard logistics happen quietly behind the scenes. We maintain our own inventory of brass urlis, carved arches, velvet seating, and warm lighting rigs—so you get reliable quality instead of last-minute sub-rented pieces.
          </p>
          <div class="story-points">
            <div class="story-point">
              <span class="story-num">A</span>
              <div>
                <h3>In-House Brass, Drape &amp; Stage Inventory</h3>
                <p>Clean ivory silks, emerald velvets, carved sandstone-finish arches, and antique brass candleware maintained in our Farrukhabad store.</p>
              </div>
            </div>
            <div class="story-point">
              <span class="story-num">B</span>
              <div>
                <h3>Complete Vendor &amp; Entry Coordination</h3>
                <p>Smooth handoff with photographers, DJ sound teams, caterers, and lawn managers so rituals run right on schedule.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="linen-chapter">
      <div class="container">
        <div class="chapter-rail">
          <span>Our 4-Step Execution</span>
          <span>From first venue visit to final lantern pack-up</span>
        </div>
        <div class="chapter-head reveal">
          <div>
            <h2 class="display-lg">How we take an empty lawn to a wedding courtyard</h2>
            <p>Tap or scroll through each stage to see how our planning and installation crew works.</p>
          </div>
        </div>

        <div class="sticky-walkthrough">
          <div class="sticky-visual-col reveal">
            <div class="sticky-frame" id="about-sticky-frame">
              <div class="sticky-frame-inner">
                <img src="${escapeHtml(steps[0].img)}" alt="${escapeHtml(steps[0].alt)}" />
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
              <span id="about-step-counter" style="font-size:0.86rem;color:var(--muted);">Step 01 of 04</span>
              <div style="display:flex;gap:8px;">
                <button type="button" class="icon-circle-btn" id="step-prev-btn" aria-label="Previous step">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button type="button" class="icon-circle-btn" id="step-next-btn" aria-label="Next step">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="step-cards">
            ${steps
              .map(
                (s, i) => `
              <article class="step-card ${i === 0 ? 'is-active' : ''}" data-step-idx="${i}" tabindex="0">
                <div class="step-tag">${escapeHtml(s.step)}</div>
                <h3>${escapeHtml(s.title)}</h3>
                <p>${escapeHtml(s.copy)}</p>
              </article>`
              )
              .join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="silk-chapter">
      <div class="container">
        <div class="reviews-grid" style="margin-bottom:36px;">
          ${reviews
            .slice(0, 3)
            .map(
              (r) => `
              <article class="review-card reveal">
                <p class="review-quote">“${escapeHtml(r.quote)}”</p>
                <div class="review-author">
                  <strong>${escapeHtml(r.family_name)}</strong>
                  <span>${escapeHtml(r.event_type)}</span>
                </div>
              </article>`
            )
            .join('')}
        </div>

        <div class="location-grid reveal">
          <div class="info-card">
            <h3>Service Area</h3>
            <p>${escapeHtml(studio.city)}, plus Kannauj, Shahjahanpur, Mainpuri, Etawah, and Kanpur highway venues.</p>
            <a class="btn btn-ghost-light btn-sm" style="margin-top:14px;" href="${escapeHtml(studio.mapsUrl)}" target="_blank" rel="noopener noreferrer">Find on Google Maps</a>
          </div>
          <div class="info-card">
            <h3>Planning Hours</h3>
            <p>${escapeHtml(studio.hours)}. Venue site visits scheduled on request for families.</p>
          </div>
          <div class="info-card">
            <h3>Direct Booking Line</h3>
            <p>Call or WhatsApp ${escapeHtml(studio.phone)} to lock your wedding or birthday date.</p>
            <a class="btn btn-primary btn-sm" style="margin-top:14px;" href="#/booking">Check Date Now</a>
          </div>
        </div>

        <div class="next-page-bar reveal">
          <div>
            <span style="font-size:0.84rem;color:var(--muted);">Next Page</span>
            <h3 class="display-md">Compare Event Packages &amp; Optional Add-Ons</h3>
          </div>
          <a class="btn btn-primary" href="#/plans">View Event Packages</a>
        </div>
      </div>
    </section>
  `;
}

function hydrateAboutPage(rootEl) {
  const steps = getExecutionSteps();
  const frameWrap = rootEl.querySelector('#about-sticky-frame');
  const counterEl = rootEl.querySelector('#about-step-counter');
  const cards = Array.from(rootEl.querySelectorAll('.step-card'));
  const prevBtn = rootEl.querySelector('#step-prev-btn');
  const nextBtn = rootEl.querySelector('#step-next-btn');

  let cur = 0;
  function setStep(idx) {
    const next = (idx + steps.length) % steps.length;
    if (next === cur && frameWrap.querySelector('img')) return;
    cur = next;
    const s = steps[cur];
    cards.forEach((c, i) => c.classList.toggle('is-active', i === cur));
    frameWrap.innerHTML = `<div class="sticky-frame-inner"><img src="${escapeHtml(s.img)}" alt="${escapeHtml(s.alt)}" /></div>`;
    counterEl.textContent = `Step 0${cur + 1} of 0${steps.length}`;
  }

  const cardHandlers = cards.map((card, i) => {
    const h = () => setStep(i);
    const kh = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setStep(i);
      }
    };
    card.addEventListener('click', h);
    card.addEventListener('keydown', kh);
    return { card, h, kh };
  });

  const onPrev = () => setStep(cur - 1);
  const onNext = () => setStep(cur + 1);
  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.dataset.stepIdx);
          if (!Number.isNaN(idx)) setStep(idx);
        }
      }
    },
    { rootMargin: '-36% 0px -44% 0px', threshold: 0.1 }
  );
  cards.forEach((c) => io.observe(c));

  return () => {
    io.disconnect();
    prevBtn.removeEventListener('click', onPrev);
    nextBtn.removeEventListener('click', onNext);
    cardHandlers.forEach(({ card, h, kh }) => {
      card.removeEventListener('click', h);
      card.removeEventListener('keydown', kh);
    });
  };
}

/* ==========================================================================
   PAGE 4: PACKAGES, ADD-ONS & POLICIES (#/plans)
   ========================================================================== */
const PLAN_FAQS = [
  {
    q: 'How early should we book for peak wedding season (saya) dates?',
    a: 'We take limited weddings per date so every venue gets our senior crew. Booking 30 to 60 days ahead locks your date, fresh floral order, and preferred stage structures—and qualifies for our live seasonal offer.'
  },
  {
    q: 'How does the payment schedule work?',
    a: 'A 30% booking advance reserves your date and inventory on our calendar. 50% is due one week before setup when flowers and lighting trusses are scheduled, and the remaining 20% upon completion of venue setup.'
  },
  {
    q: 'Can we customize colors or mix items from two packages?',
    a: 'Yes. Pick the closest base package on the Booking page, toggle any optional add-ons (like Cold Pyro, Low Fog, or Floral Chadar), and mention your custom lawn size or theme colors in the Venue Notes box.'
  },
  {
    q: 'Do you handle both home courtyards and large marriage lawns?',
    a: 'Yes. From intimate home terrace Haldi and birthday setups to 800-guest marriage lawns across Farrukhabad and Fatehgarh, our structures scale cleanly to the exact venue dimensions.'
  }
];

function renderPlansPage() {
  const { offer, plans, addons, trendingPlanId } = siteData;
  const gallery = getGalleryItems();
  const headerPhoto = gallery.find((g) => g.category === 'Reception & Dining') || gallery[0];

  const offerCard = offer.active
    ? `
      <div class="live-offer-card reveal">
        <div>
          <span class="offer-pill-tag">Live Event Offer${offer.validTill ? ` · Valid till ${escapeHtml(offer.validTill)}` : ''}</span>
          <h3>${escapeHtml(offer.title)} — ${offer.percent}% Off Automatically Applied</h3>
          <p>${escapeHtml(offer.note)}. Discounted starting prices are shown below.</p>
        </div>
        <a class="btn btn-brass" href="#/booking">Lock Date With Offer</a>
      </div>`
    : '';

  const cardsHtml = plans
    .map((plan) => {
      const { base, finalPrice, savings, hasOffer } = getPlanPricing(plan);
      const isTrend = plan.id === trendingPlanId;
      return `
        <article class="plan-card reveal ${isTrend ? 'is-trending' : ''}" data-plan-card="${escapeHtml(plan.id)}">
          <div>
            <div class="plan-badges">
              ${isTrend ? '<span class="badge-trending">Most Trending Package</span>' : `<span class="badge-views">${escapeHtml(plan.duration)}</span>`}
              <span class="badge-views">${escapeHtml(plan.event_scope)}</span>
            </div>
            <h3>${escapeHtml(plan.name)}</h3>
            <p class="plan-desc">${escapeHtml(plan.tagline)}</p>
            <div class="plan-price-row">
              <span class="price-final">${formatINR(finalPrice)}</span>
              ${hasOffer ? `<span class="price-old">${formatINR(base)}</span><span class="price-save">Save ${formatINR(savings)}</span>` : ''}
            </div>
            <p style="font-size:0.86rem;color:var(--muted);margin:0 0 14px;">
              <strong>Ideal Venue:</strong> ${escapeHtml(plan.event_scope)} · <strong>Duration:</strong> ${escapeHtml(plan.duration)}
            </p>
            <ul class="plan-features">
              ${plan.deliverables.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
            </ul>
          </div>
          <div class="plan-card-actions">
            <a class="btn btn-primary" href="#/booking?plan=${encodeURIComponent(plan.id)}">Book This Package</a>
          </div>
        </article>`;
    })
    .join('');

  const addonsSection = addons.length
    ? `
      <section class="linen-chapter">
        <div class="container">
          <div class="chapter-rail">
            <span>Optional Decor &amp; Entry Add-Ons</span>
            <span>Add any extra to your package on the Booking page</span>
          </div>
          <div class="chapter-head reveal">
            <div>
              <h2 class="display-lg">Signature entry effects &amp; custom upgrades</h2>
              <p>Mix and match any of these upgrades with your chosen package—live total calculates automatically.</p>
            </div>
            <a class="btn btn-primary" href="#/booking">Build Your Estimate</a>
          </div>
          <div class="addons-grid">
            ${addons
              .map(
                (a) => `
                <article class="addon-card reveal">
                  <div>
                    <h3>${escapeHtml(a.name)}</h3>
                    <p>${escapeHtml(a.note)}</p>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:10px;border-top:1px solid var(--line-light);">
                    <span class="addon-price">+${formatINR(a.price)}</span>
                    <a class="btn btn-ghost-light btn-sm" href="#/booking?addon=${encodeURIComponent(a.id)}">Add to Booking</a>
                  </div>
                </article>`
              )
              .join('')}
          </div>
        </div>
      </section>`
    : '';

  return `
    <section class="sub-hero">
      <img class="sub-hero-bg" src="${escapeHtml(headerPhoto.src)}" alt="" />
      <div class="sub-hero-scrim" aria-hidden="true"></div>
      <div class="container sub-hero-inner">
        <h1 class="display-xl" aria-label="Event Packages & Booking Details">${splitWordsMarkup('Event Packages & Booking Details')}</h1>
        <p class="lead-copy">
          Honest starting rates with real stage sizes, fresh florals, lighting, and crew details spelled out upfront. Select any package to check availability for your date.
        </p>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container">
        ${offerCard}
        <div class="plans-grid">${cardsHtml}</div>
      </div>
    </section>

    ${addonsSection}

    <section class="silk-chapter">
      <div class="container-narrow">
        <div class="chapter-rail">
          <span>Booking Policies &amp; Common Questions</span>
          <span>Clear terms before you lock your venue date</span>
        </div>
        <h2 class="display-lg reveal" style="margin-bottom:26px;">How bookings, setup, and customization work</h2>
        <div class="accordion-list" id="plans-accordion">
          ${PLAN_FAQS.map(
            (item, idx) => `
            <div class="acc-item ${idx === 0 ? 'is-open' : ''}">
              <button type="button" class="acc-trigger" aria-expanded="${idx === 0}">
                <span>${escapeHtml(item.q)}</span>
                <svg class="acc-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <div class="acc-body">
                <div class="acc-body-inner"><p>${escapeHtml(item.a)}</p></div>
              </div>
            </div>`
          ).join('')}
        </div>

        <div class="next-page-bar reveal">
          <div>
            <span style="font-size:0.84rem;color:var(--muted);">Ready to check your date?</span>
            <h3 class="display-md">Open the Interactive Booking &amp; Estimate Page</h3>
          </div>
          <a class="btn btn-primary" href="#/booking">Book Your Event</a>
        </div>
      </div>
    </section>
  `;
}

function hydratePlansPage(rootEl) {
  const cards = Array.from(rootEl.querySelectorAll('[data-plan-card]'));
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          trackPulse({ planId: entry.target.dataset.planCard });
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.35 }
  );
  cards.forEach((c) => io.observe(c));

  const acc = rootEl.querySelector('#plans-accordion');
  const onAccClick = (e) => {
    const trig = e.target.closest('.acc-trigger');
    if (!trig) return;
    const item = trig.parentElement;
    const willOpen = !item.classList.contains('is-open');
    item.classList.toggle('is-open', willOpen);
    trig.setAttribute('aria-expanded', String(willOpen));
  };
  acc.addEventListener('click', onAccClick);

  return () => {
    io.disconnect();
    acc.removeEventListener('click', onAccClick);
  };
}

/* ==========================================================================
   PAGE 5: EVENT BOOKING & LIVE DATE AVAILABILITY (#/booking)
   ========================================================================== */
function renderBookingPage(query) {
  const { studio, plans, addons, trendingPlanId } = siteData;
  const gallery = getGalleryItems();
  const headerPhoto = gallery.find((g) => g.category === 'Floral Entry') || gallery[0];
  const prePlanId = query.get('plan') || trendingPlanId || plans[0].id;
  const validPlan = plans.find((p) => p.id === prePlanId) ? prePlanId : plans[0].id;
  const preAddon = query.get('addon') || '';
  const preStyle = query.get('style') || '';
  const minDate = todayISO();

  return `
    <section class="sub-hero">
      <img class="sub-hero-bg" src="${escapeHtml(headerPhoto.src)}" alt="" />
      <div class="sub-hero-scrim" aria-hidden="true"></div>
      <div class="container sub-hero-inner">
        <h1 class="display-xl" aria-label="Check Date & Book Your Event">${splitWordsMarkup('Check Date & Book Your Event')}</h1>
        <p class="lead-copy">
          Select your package, optional add-ons, venue details, and event date to see live availability and your estimated total—then send your complete booking brief directly to ${escapeHtml(studio.name)} on WhatsApp.
        </p>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container booking-layout">
        <form class="booking-form-card" id="booking-form" novalidate>
          <div class="form-block">
            <label class="form-label">1. Select Event Package</label>
            <div class="plan-picker-grid" id="plan-picker">
              ${plans
                .map((p) => {
                  const { finalPrice } = getPlanPricing(p);
                  const sel = p.id === validPlan;
                  return `
                    <button type="button" class="plan-pick-btn ${sel ? 'is-selected' : ''}" data-pick-plan="${escapeHtml(p.id)}" aria-pressed="${sel}">
                      <strong>${escapeHtml(p.name)}</strong>
                      <span>${formatINR(finalPrice)} · ${escapeHtml(p.duration.split('(')[0].trim())}</span>
                    </button>`;
                })
                .join('')}
            </div>
          </div>

          ${
            addons.length
              ? `
          <div class="form-block">
            <label class="form-label">
              2. Optional Decor &amp; Entry Add-Ons
              <span class="form-hint">Tap to include any extras in your estimate</span>
            </label>
            <div class="addon-toggle-list" id="addon-picker">
              ${addons
                .map((a) => {
                  const sel = a.id === preAddon;
                  return `
                    <button type="button" class="addon-toggle-btn ${sel ? 'is-selected' : ''}" data-pick-addon="${escapeHtml(a.id)}" aria-pressed="${sel}">
                      <div>
                        <strong>${escapeHtml(a.name)}</strong>
                        <span>+${formatINR(a.price)}</span>
                      </div>
                      <span class="addon-check" aria-hidden="true">${sel ? '✓' : ''}</span>
                    </button>`;
                })
                .join('')}
            </div>
          </div>`
              : ''
          }

          <div class="form-block field-row-2">
            <div>
              <label class="form-label" for="bk-name">3. Your Full Name *</label>
              <input class="text-input" id="bk-name" type="text" placeholder="e.g. Amit &amp; Neha Verma" autocomplete="name" required />
            </div>
            <div>
              <label class="form-label" for="bk-phone">Mobile Number (Optional)</label>
              <input class="text-input" id="bk-phone" type="tel" placeholder="e.g. 98765 43210" autocomplete="tel" />
            </div>
          </div>

          <div class="form-block field-row-2">
            <div>
              <label class="form-label" for="bk-type">4. Event Type *</label>
              <select class="text-input" id="bk-type">
                ${EVENT_TYPES.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="form-label" for="bk-guests">Approx. Guests (Optional)</label>
              <select class="text-input" id="bk-guests">
                <option value="Under 100 Guests">Under 100 Guests (Home / Intimate)</option>
                <option value="100 – 250 Guests" selected>100 – 250 Guests</option>
                <option value="250 – 500 Guests">250 – 500 Guests</option>
                <option value="500 – 1,000+ Guests">500 – 1,000+ Guests (Grand Lawn)</option>
              </select>
            </div>
          </div>

          <div class="form-block field-row-2">
            <div>
              <label class="form-label" for="bk-date">
                5. Event Date *
                <span class="form-hint">Live availability checks automatically</span>
              </label>
              <input class="text-input" id="bk-date" type="date" min="${minDate}" required />
              <div id="date-avail-chip" class="date-status-chip is-open">Date looks open — confirm on WhatsApp</div>
            </div>
            <div>
              <label class="form-label" for="bk-time">
                6. Event Start Time *
                <span class="form-hint">Setup completes before this time</span>
              </label>
              <input class="text-input" id="bk-time" type="time" value="19:00" required />
            </div>
          </div>

          <div class="form-block">
            <label class="form-label">Event Shift / Slot</label>
            <div class="shift-grid" id="shift-picker">
              ${SHIFTS.map(
                (s, i) => `
                <button type="button" class="shift-btn ${i === 2 ? 'is-selected' : ''}" data-shift="${escapeHtml(s.id)}" data-default-time="${s.defaultTime}" aria-pressed="${i === 2}">
                  <strong>${escapeHtml(s.label)}</strong>
                  <span>${escapeHtml(s.range)}</span>
                </button>`
              ).join('')}
            </div>
          </div>

          <div class="form-block">
            <label class="form-label" for="bk-venue">Venue / Lawn / Colony Name (Optional)</label>
            <input class="text-input" id="bk-venue" type="text" placeholder="e.g. Awas Vikas Guest House, Fatehgarh Road Lawn" />
          </div>

          <div class="form-block" style="margin-bottom:0;">
            <label class="form-label" for="bk-notes">Decor Theme or Special Requests (Optional)</label>
            <textarea class="text-area" id="bk-notes" placeholder="e.g. White mogra &amp; emerald mandap theme, Haldi morning + Night wedding">${preStyle ? `Interested in decor style: ${escapeHtml(preStyle)}` : ''}</textarea>
          </div>

          <div id="bk-error" class="field-error" role="alert" aria-live="polite"></div>
        </form>

        <aside class="booking-slip" aria-label="Live Event Estimate">
          <div class="slip-head">
            <h3>Event Booking Slip</h3>
            <p>Sends directly to ${escapeHtml(studio.name)} (${escapeHtml(studio.phone)})</p>
          </div>

          <div class="slip-rows">
            <div class="slip-row"><span>Customer</span><strong id="slip-name">Enter your name</strong></div>
            <div class="slip-row"><span>Event</span><strong id="slip-type">Wedding · 100 – 250 Guests</strong></div>
            <div class="slip-row"><span>Package</span><strong id="slip-plan">—</strong></div>
            <div class="slip-row" id="slip-addons-row" style="display:none;"><span>Add-Ons</span><strong id="slip-addons">—</strong></div>
            <div class="slip-row"><span>Event Date</span><strong id="slip-date">—</strong></div>
            <div class="slip-row"><span>Shift &amp; Time</span><strong id="slip-time">Evening / Night · 7:00 PM</strong></div>
            <div class="slip-row" id="slip-offer-row"><span>Live Offer</span><strong style="color:var(--brass);" id="slip-offer">—</strong></div>
          </div>

          <div class="slip-total">
            <span style="color:var(--mist);font-size:0.9rem;">Estimated Total</span>
            <strong id="slip-total">₹0</strong>
          </div>

          <div style="font-size:0.78rem;color:var(--mist);margin-bottom:8px;">WhatsApp Message Preview</div>
          <div class="slip-preview-msg" id="slip-msg-preview"></div>

          <div class="slip-actions">
            <a id="bk-whatsapp-btn" class="btn btn-brass" href="#" target="_blank" rel="noopener noreferrer">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span>Book Event on WhatsApp</span>
            </a>
            <button type="button" id="bk-copy-btn" class="btn btn-ghost-dark">Copy Booking Message</button>
          </div>

          <div id="bk-toast" class="booking-toast" hidden></div>
        </aside>
      </div>
    </section>
  `;
}

function hydrateBookingPage(rootEl, query) {
  const { studio, plans, addons, bookedDates, offer, trendingPlanId } = siteData;
  const prePlanId = query.get('plan') || trendingPlanId || plans[0].id;
  let selectedPlanId = plans.find((p) => p.id === prePlanId) ? prePlanId : plans[0].id;
  let selectedShift = 'Evening / Night';
  const selectedAddonIds = new Set();
  const preAddon = query.get('addon');
  if (preAddon && addons.some((a) => a.id === preAddon)) selectedAddonIds.add(preAddon);

  trackPulse({ planId: selectedPlanId });

  const planPicker = rootEl.querySelector('#plan-picker');
  const addonPicker = rootEl.querySelector('#addon-picker');
  const shiftPicker = rootEl.querySelector('#shift-picker');
  const nameInput = rootEl.querySelector('#bk-name');
  const phoneInput = rootEl.querySelector('#bk-phone');
  const typeSelect = rootEl.querySelector('#bk-type');
  const guestsSelect = rootEl.querySelector('#bk-guests');
  const dateInput = rootEl.querySelector('#bk-date');
  const timeInput = rootEl.querySelector('#bk-time');
  const venueInput = rootEl.querySelector('#bk-venue');
  const notesInput = rootEl.querySelector('#bk-notes');
  const availChip = rootEl.querySelector('#date-avail-chip');
  const errEl = rootEl.querySelector('#bk-error');

  const slipName = rootEl.querySelector('#slip-name');
  const slipType = rootEl.querySelector('#slip-type');
  const slipPlan = rootEl.querySelector('#slip-plan');
  const slipAddonsRow = rootEl.querySelector('#slip-addons-row');
  const slipAddons = rootEl.querySelector('#slip-addons');
  const slipDate = rootEl.querySelector('#slip-date');
  const slipTime = rootEl.querySelector('#slip-time');
  const slipOffer = rootEl.querySelector('#slip-offer');
  const slipOfferRow = rootEl.querySelector('#slip-offer-row');
  const slipTotal = rootEl.querySelector('#slip-total');
  const slipPreview = rootEl.querySelector('#slip-msg-preview');
  const waBtn = rootEl.querySelector('#bk-whatsapp-btn');
  const copyBtn = rootEl.querySelector('#bk-copy-btn');
  const toastEl = rootEl.querySelector('#bk-toast');

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 21);
  dateInput.value = `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}`;

  function updateDateAvailability() {
    const val = dateInput.value;
    const match = bookedDates.find((d) => d.event_date === val);
    availChip.classList.remove('is-open', 'is-limited', 'is-booked');
    if (match && match.status === 'booked') {
      availChip.classList.add('is-booked');
      availChip.textContent = 'Peak date marked Fully Booked — message on WhatsApp to check alternate timing or backup crew.';
    } else if (match && match.status === 'limited') {
      availChip.classList.add('is-limited');
      availChip.textContent = 'Limited crew slots left for this date — send your inquiry early to lock.';
    } else {
      availChip.classList.add('is-open');
      availChip.textContent = 'Date is open on our calendar — send WhatsApp brief to reserve.';
    }
  }

  function calcTotals() {
    const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
    const pkg = getPlanPricing(plan);
    const chosenAddons = addons.filter((a) => selectedAddonIds.has(a.id));
    const addonsSum = chosenAddons.reduce((s, a) => s + Number(a.price || 0), 0);
    return { plan, pkg, chosenAddons, addonsSum, grandTotal: pkg.finalPrice + addonsSum };
  }

  function buildMessage() {
    const { plan, pkg, chosenAddons, addonsSum, grandTotal } = calcTotals();
    const custName = nameInput.value.trim() || '[Your Name]';
    const custPhone = phoneInput.value.trim();
    const evType = typeSelect.value;
    const guests = guestsSelect.value;
    const niceDate = formatDateNice(dateInput.value);
    const niceTime = formatTime12h(timeInput.value);
    const venue = venueInput.value.trim();
    const notes = notesInput.value.trim();

    return [
      `Namaste ${studio.name}!`,
      `I would like to check availability and book an event setup:`,
      ``,
      `Name: ${custName}`,
      ...(custPhone ? [`Phone: ${custPhone}`] : []),
      `Event Type: ${evType} (${guests})`,
      `Package: ${plan.name} (${formatINR(pkg.finalPrice)}${pkg.hasOffer ? ` — ${offer.percent}% ${offer.title} applied` : ''})`,
      ...(chosenAddons.length ? [`Add-Ons: ${chosenAddons.map((a) => `${a.name} (+${formatINR(a.price)})`).join(', ')}`] : []),
      `Estimated Total: ${formatINR(grandTotal)}`,
      `Event Date: ${niceDate}`,
      `Shift & Time: ${selectedShift} (Start around ${niceTime})`,
      ...(venue ? [`Venue / Lawn: ${venue}`] : []),
      ...(notes ? [`Theme / Notes: ${notes}`] : []),
      ``,
      `Please confirm availability and next steps.`
    ].join('\n');
  }

  function syncSummary() {
    updateDateAvailability();
    const { plan, pkg, chosenAddons, addonsSum, grandTotal } = calcTotals();

    slipName.textContent = nameInput.value.trim() || 'Enter your name';
    slipType.textContent = `${typeSelect.value} · ${guestsSelect.value}`;
    slipPlan.textContent = plan.name;
    slipDate.textContent = formatDateNice(dateInput.value);
    slipTime.textContent = `${selectedShift} · ${formatTime12h(timeInput.value)}`;
    slipTotal.textContent = formatINR(grandTotal);

    if (chosenAddons.length) {
      slipAddonsRow.style.display = '';
      slipAddons.textContent = `${chosenAddons.length} selected (+${formatINR(addonsSum)})`;
    } else {
      slipAddonsRow.style.display = 'none';
    }

    if (pkg.hasOffer) {
      slipOfferRow.style.display = '';
      slipOffer.textContent = `-${formatINR(pkg.savings)} (${offer.percent}% Off)`;
    } else {
      slipOfferRow.style.display = 'none';
    }

    const msg = buildMessage();
    slipPreview.textContent = msg;
    waBtn.href = `https://wa.me/${studio.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  const onPlanPick = (e) => {
    const btn = e.target.closest('[data-pick-plan]');
    if (!btn) return;
    selectedPlanId = btn.dataset.pickPlan;
    trackPulse({ planId: selectedPlanId });
    Array.from(planPicker.querySelectorAll('.plan-pick-btn')).forEach((b) => {
      const sel = b === btn;
      b.classList.toggle('is-selected', sel);
      b.setAttribute('aria-pressed', String(sel));
    });
    syncSummary();
  };

  const onAddonPick = (e) => {
    const btn = e.target.closest('[data-pick-addon]');
    if (!btn) return;
    const aid = btn.dataset.pickAddon;
    if (selectedAddonIds.has(aid)) selectedAddonIds.delete(aid);
    else selectedAddonIds.add(aid);
    const on = selectedAddonIds.has(aid);
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-pressed', String(on));
    const chk = btn.querySelector('.addon-check');
    if (chk) chk.textContent = on ? '✓' : '';
    syncSummary();
  };

  const onShiftPick = (e) => {
    const btn = e.target.closest('[data-shift]');
    if (!btn) return;
    selectedShift = btn.dataset.shift;
    if (btn.dataset.defaultTime) timeInput.value = btn.dataset.defaultTime;
    Array.from(shiftPicker.querySelectorAll('.shift-btn')).forEach((b) => {
      const sel = b === btn;
      b.classList.toggle('is-selected', sel);
      b.setAttribute('aria-pressed', String(sel));
    });
    syncSummary();
  };

  const onWaClick = (e) => {
    const custName = nameInput.value.trim();
    if (custName.length < 2) {
      e.preventDefault();
      errEl.textContent = 'Please enter your full name before opening WhatsApp.';
      nameInput.focus();
      return;
    }
    if (!dateInput.value) {
      e.preventDefault();
      errEl.textContent = 'Please select your event date.';
      dateInput.focus();
      return;
    }
    if (!timeInput.value) {
      e.preventDefault();
      errEl.textContent = 'Please select your event start time.';
      timeInput.focus();
      return;
    }
    errEl.textContent = '';
    syncSummary();
    sendBookingRecord({
      planId: selectedPlanId,
      addonIds: Array.from(selectedAddonIds),
      customerName: custName,
      customerPhone: phoneInput.value.trim(),
      eventType: typeSelect.value,
      eventDate: dateInput.value,
      eventShift: selectedShift,
      eventTime: timeInput.value,
      venue: venueInput.value.trim(),
      guestCount: guestsSelect.value,
      notes: notesInput.value.trim()
    });
    toastEl.hidden = false;
    toastEl.textContent = `Event inquiry logged. Opening WhatsApp for ${studio.name}...`;
  };

  const onCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(buildMessage());
      toastEl.hidden = false;
      toastEl.textContent = 'Booking brief copied. Paste it directly into WhatsApp.';
    } catch (_) {
      toastEl.hidden = false;
      toastEl.textContent = 'Copy blocked by browser—tap Book Event on WhatsApp above.';
    }
  };

  planPicker.addEventListener('click', onPlanPick);
  if (addonPicker) addonPicker.addEventListener('click', onAddonPick);
  shiftPicker.addEventListener('click', onShiftPick);
  nameInput.addEventListener('input', syncSummary);
  phoneInput.addEventListener('input', syncSummary);
  typeSelect.addEventListener('change', syncSummary);
  guestsSelect.addEventListener('change', syncSummary);
  dateInput.addEventListener('change', syncSummary);
  timeInput.addEventListener('change', syncSummary);
  venueInput.addEventListener('input', syncSummary);
  notesInput.addEventListener('input', syncSummary);
  waBtn.addEventListener('click', onWaClick);
  copyBtn.addEventListener('click', onCopyClick);

  syncSummary();

  return () => {
    planPicker.removeEventListener('click', onPlanPick);
    if (addonPicker) addonPicker.removeEventListener('click', onAddonPick);
    shiftPicker.removeEventListener('click', onShiftPick);
    nameInput.removeEventListener('input', syncSummary);
    phoneInput.removeEventListener('input', syncSummary);
    typeSelect.removeEventListener('change', syncSummary);
    guestsSelect.removeEventListener('change', syncSummary);
    dateInput.removeEventListener('change', syncSummary);
    timeInput.removeEventListener('change', syncSummary);
    venueInput.removeEventListener('input', syncSummary);
    notesInput.removeEventListener('input', syncSummary);
    waBtn.removeEventListener('click', onWaClick);
    copyBtn.removeEventListener('click', onCopyClick);
  };
}

/* ==========================================================================
   CUSTOM 404 ARCHITECTURAL ARCH PAGE
   ========================================================================== */
function renderNotFoundPage(badPath) {
  return `
    <section class="page-404">
      <div class="arch-404-box">
        <div class="mandala-ring" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4B26A" stroke-width="1.6"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <p class="code-404">404</p>
        <h1>This courtyard page was not found.</h1>
        <p>
          We could not find <strong>${escapeHtml(badPath || '/unknown')}</strong> in the Usha Event Planner archive. Browse our wedding decor setups or check date availability below.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a class="btn btn-brass" href="#/">Return Home</a>
          <a class="btn btn-ghost-dark" href="#/gallery">Decor Gallery</a>
          <a class="btn btn-ghost-dark" href="#/booking">Book an Event</a>
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   TWO-STAGE DIRECTIONAL HASH ROUTER
   ========================================================================== */
const viewRoot = document.getElementById('view-root');
const routeBar = document.getElementById('route-bar');

let currentPath = null;
let currentCleanup = null;
let navTimer = 0;
let idleTimer = 0;
let renderSeq = 0;

function parseHash() {
  const raw = window.location.hash || '#/';
  const cleaned = raw.startsWith('#') ? raw.slice(1) : raw;
  const [pathPart, queryPart] = cleaned.split('?');
  const path = pathPart ? (pathPart.startsWith('/') ? pathPart : '/' + pathPart) : '/';
  return { path: path === '' ? '/' : path, query: new URLSearchParams(queryPart || '') };
}

function updateActiveNav(path) {
  document.querySelectorAll('[data-route]').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.route === path);
  });
}

function triggerRouteBar() {
  routeBar.classList.remove('is-sweeping');
  void routeBar.offsetWidth;
  routeBar.classList.add('is-sweeping');
}

function mountRoute(path, query, animate = true) {
  const seq = ++renderSeq;
  const prevIdx = PAGE_ORDER.indexOf(currentPath);
  const nextIdx = PAGE_ORDER.indexOf(path);
  const dir = prevIdx !== -1 && nextIdx !== -1 && nextIdx < prevIdx ? 'bwd' : 'fwd';

  clearTimeout(navTimer);
  clearTimeout(idleTimer);
  setDrawer(false);

  const performSwap = async () => {
    if (seq !== renderSeq) return;
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }

    currentPath = path;
    updateActiveNav(path);
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (path === '/admin') {
      document.title = 'Admin Command Center — Usha Event Planner';
      viewRoot.innerHTML = `<section class="admin-login-wrap"><p style="color:var(--mist);">Loading Event Command Center...</p></section>`;
      viewRoot.className = 'view-shell is-idle';
      try {
        const mod = await import('./admin.js?v=1');
        if (seq !== renderSeq) return;
        const admCleanup = await mod.mountAdminApp(viewRoot, {
          onDataChanged: () => { syncFromServer(); }
        });
        if (seq !== renderSeq) {
          if (admCleanup) admCleanup();
          return;
        }
        currentCleanup = admCleanup;
      } catch (_) {
        viewRoot.innerHTML = renderNotFoundPage('/admin');
      }
      return;
    }

    let html = '';
    let hydrate = null;

    if (path === '/' || path === '/home') {
      html = renderHomePage();
      hydrate = hydrateHomePage;
      document.title = 'Usha Event Planner Farrukhabad — Wedding Decor, Mandaps & Event Planning';
    } else if (path === '/gallery') {
      html = renderGalleryPage(query);
      hydrate = hydrateGalleryPage;
      document.title = 'Decor Gallery — Usha Event Planner Farrukhabad';
    } else if (path === '/about') {
      html = renderAboutPage();
      hydrate = hydrateAboutPage;
      document.title = 'About Us — Usha Event Planner Farrukhabad';
    } else if (path === '/plans') {
      html = renderPlansPage();
      hydrate = hydratePlansPage;
      document.title = 'Event Packages & Add-Ons — Usha Event Planner Farrukhabad';
    } else if (path === '/booking') {
      html = renderBookingPage(query);
      hydrate = hydrateBookingPage;
      document.title = 'Check Date & Book Event — Usha Event Planner Farrukhabad';
    } else {
      html = renderNotFoundPage(path);
      document.title = '404 Page Not Found — Usha Event Planner Farrukhabad';
    }

    viewRoot.innerHTML = html;
    const motionCleanup = setupMotion(viewRoot);
    const pageCleanup = hydrate ? hydrate(viewRoot, query) : null;
    currentCleanup = () => {
      motionCleanup();
      if (pageCleanup) pageCleanup();
    };

    if (animate) {
      viewRoot.className = `view-shell enter-${dir}`;
      idleTimer = setTimeout(() => {
        viewRoot.className = 'view-shell is-idle';
      }, 450);
    } else {
      viewRoot.className = 'view-shell is-idle';
    }
  };

  if (!animate || currentPath === null) {
    performSwap();
  } else {
    triggerRouteBar();
    viewRoot.className = `view-shell exit-${dir}`;
    navTimer = setTimeout(performSwap, 140);
  }
}

export function navigate(targetHash) {
  window.location.hash = targetHash.startsWith('#') ? targetHash : '#' + targetHash;
}

window.addEventListener('hashchange', () => {
  const { path, query } = parseHash();
  mountRoute(path, query, true);
});

(async function boot() {
  await syncFromServer();
  updateShellBranding();
  const initial = parseHash();
  mountRoute(initial.path, initial.query, false);
})();
