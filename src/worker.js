/* ==========================================================================
   Usha Event Planner Farrukhabad — Hardened Cloudflare Worker + D1 Backend
   Same-origin hidden API (/api/v1/*), HMAC-SHA256 HttpOnly sessions,
   timingSafeEqual auth, IP + global lockouts, CSRF checks, server-side
   package + add-on pricing, Date Availability Calendar, Reviews, Bookings
   Pipeline, Studio Settings, and edge-cached /m/:id media delivery.
   ========================================================================== */

const APP_VERSION = '1.0.0';
const COOKIE_NAME = '__Host-usha_adm';
const DEV_COOKIE_NAME = 'usha_adm';
const SESSION_TTL_SEC = 60 * 60 * 12;
const MAX_JSON_BYTES = 32 * 1024;
const MAX_UPLOAD_JSON_BYTES = 440 * 1024;
const MAX_DECODED_IMAGE_BYTES = 280 * 1024;

const ALLOWED_SLOTS = new Set(['home_hero', 'home_signature', 'about_craft', 'gallery']);
const ALLOWED_CATEGORIES = new Set([
  'Mandap & Stage',
  'Haldi & Mehendi',
  'Floral Entry',
  'Reception & Dining',
  'Birthday & Events',
  'Planning'
]);
const ALLOWED_SHIFTS = new Set(['Morning', 'Afternoon', 'Evening / Night', 'Full Day']);
const ALLOWED_EVENT_TYPES = new Set([
  'Wedding',
  'Haldi & Mehendi',
  'Engagement / Ring Ceremony',
  'Reception',
  'Birthday / Anniversary',
  'Corporate / Private Event'
]);
const ALLOWED_DATE_STATUS = new Set(['booked', 'limited']);
const ALLOWED_BOOKING_STATUS = new Set(['new', 'called', 'confirmed', 'completed']);

const DEFAULT_STUDIO = {
  name: 'Usha Event Planner',
  city: 'Farrukhabad & Fatehgarh, UP',
  whatsapp: '917705007229',
  phone: '+91 77050 07229',
  hours: 'Daily · 10:00 AM to 9:00 PM',
  instagram: 'https://www.instagram.com/',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Usha+event+planner+Farrukhabad'
};

const DEFAULT_OFFER = {
  active: true,
  title: 'Shaadi Season Offer',
  percent: 10,
  note: 'Flat 10% off on full Wedding Mandap & Reception setups booked 30+ days ahead',
  validTill: '31 Dec 2026'
};

const SEED_PLANS = [
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
    sort_order: 1,
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
    sort_order: 2,
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
    sort_order: 3,
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
    sort_order: 4,
    views: 0,
    bookings: 0
  }
];

const SEED_ADDONS = [
  { id: 'addon-floral-chadar', name: 'Bridal Floral Chadar & Entry Coordination', price: 4500, note: 'Fresh jasmine & rose phoolon ki chadar with lantern pathway cues', sort_order: 1 },
  { id: 'addon-cold-pyro', name: '8 Cold Pyro Sparkler Shots (Varmala)', price: 3800, note: 'Smokeless indoor/outdoor safe cold spark fountains synced to Jaimala', sort_order: 2 },
  { id: 'addon-low-fog', name: 'Low-Lying Cloud Fog Machine', price: 4200, note: 'Dry-ice floor cloud effect for couple entry and first dance', sort_order: 3 },
  { id: 'addon-bulb-canopy', name: 'Warm Vintage Bulb & Drape Canopy', price: 9500, note: 'Overhead warm tungsten string bulbs with emerald & ivory fabric swags', sort_order: 4 },
  { id: 'addon-birthday-arch', name: 'Milestone Cake & Brass Ring Photo Corner', price: 6500, note: 'Circular brass floral arch with linen dessert table and hurricane candles', sort_order: 5 }
];

const SEED_MEDIA = [
  { id: 'hero-1', slot: 'home_hero', category: 'Mandap & Stage', title: 'Twilight Floral Mandap Pavilion', location: 'Courtyard Mandap · Fresh Mogra & Brass Bells', src: '/assets/photos/01-hero-mandap-pavilion.webp', wide: 1, sort_order: 1 },
  { id: 'hero-2', slot: 'home_hero', category: 'Mandap & Stage', title: 'Royal Sandstone Varmala Stage', location: 'Varmala Stage · White Roses & Chandeliers', src: '/assets/photos/02-stage-royal-varmala.webp', wide: 1, sort_order: 2 },
  { id: 'hero-3', slot: 'home_hero', category: 'Floral Entry', title: 'Jasmine & Lantern Entry Tunnel', location: 'Walkway Entry · 40ft Illuminated Arch', src: '/assets/photos/06-entry-jasmine-walkway.webp', wide: 1, sort_order: 3 },
  { id: 'hero-4', slot: 'home_hero', category: 'Reception & Dining', title: 'Candlelit Emerald Banquet Courtyard', location: 'Evening Reception · Warm Bulb Canopy', src: '/assets/photos/07-reception-banquet.webp', wide: 1, sort_order: 4 },
  { id: 'home-sig-main', slot: 'home_signature', category: 'Reception & Dining', title: 'Concentric Brass Arch Ring Stage', location: 'Engagement & Reception Signature', src: '/assets/photos/08-stage-ring-arch.webp', wide: 0, sort_order: 1 },
  { id: 'about-craft-main', slot: 'about_craft', category: 'Planning', title: 'Venue Floor Plans & Material Board', location: 'Usha Event Planner · Farrukhabad Studio', src: '/assets/photos/10-planner-blueprints.webp', wide: 1, sort_order: 1 },
  { id: 'gal-1', slot: 'gallery', category: 'Mandap & Stage', title: 'Twilight Floral Mandap Pavilion', location: 'Four-Pillar Courtyard Mandap', src: '/assets/photos/01-hero-mandap-pavilion.webp', wide: 1, sort_order: 1 },
  { id: 'gal-2', slot: 'gallery', category: 'Mandap & Stage', title: 'Royal Sandstone Varmala Stage', location: 'Symmetrical Arch Stage & Chandeliers', src: '/assets/photos/02-stage-royal-varmala.webp', wide: 1, sort_order: 2 },
  { id: 'gal-3', slot: 'gallery', category: 'Mandap & Stage', title: 'Sheer Silk & Jasmine Phera Mandap', location: 'Intimate Havan Kund & Diya Platform', src: '/assets/photos/03-mandap-silk-jasmine.webp', wide: 0, sort_order: 3 },
  { id: 'gal-4', slot: 'gallery', category: 'Haldi & Mehendi', title: 'Marigold Courtyard Haldi Swing', location: 'Daytime Floral Curtains & Brass Urlis', src: '/assets/photos/04-haldi-marigold-swing.webp', wide: 1, sort_order: 4 },
  { id: 'gal-5', slot: 'gallery', category: 'Haldi & Mehendi', title: 'Botanical Emerald Mehendi Lounge', location: 'Cane Sofa, Hanging Lanterns & Jute Rugs', src: '/assets/photos/05-mehendi-botanical.webp', wide: 0, sort_order: 5 },
  { id: 'gal-6', slot: 'gallery', category: 'Floral Entry', title: 'Jasmine & Brass Lantern Walkway', location: 'Illuminated Bridal & Baraat Entry', src: '/assets/photos/06-entry-jasmine-walkway.webp', wide: 1, sort_order: 6 },
  { id: 'gal-7', slot: 'gallery', category: 'Reception & Dining', title: 'Candlelit Banquet Courtyard', location: 'Emerald & Ivory Silk Drapes + Candelabras', src: '/assets/photos/07-reception-banquet.webp', wide: 1, sort_order: 7 },
  { id: 'gal-8', slot: 'gallery', category: 'Reception & Dining', title: 'Concentric Brass Ring Ceremony Stage', location: 'White Hydrangeas & Ivory Velvet Sofa', src: '/assets/photos/08-stage-ring-arch.webp', wide: 0, sort_order: 8 },
  { id: 'gal-9', slot: 'gallery', category: 'Birthday & Events', title: 'Milestone Garden Arch & Dessert Table', location: 'Anniversary & Private Lawn Celebration', src: '/assets/photos/09-birthday-garden-arch.webp', wide: 1, sort_order: 9 }
];

const SEED_REVIEWS = [
  {
    id: 'rev-1',
    family_name: 'Srivastava Family · Fatehgarh',
    event_type: 'Complete Wedding Mandap & Stage',
    quote: 'The floral mandap and candlelit entry walkway looked better in real life than in the sketches. Their crew finished setup two hours before Baraat arrival with zero last-minute stress.',
    sort_order: 1
  },
  {
    id: 'rev-2',
    family_name: 'Gupta Family · Awas Vikas Colony',
    event_type: 'Haldi & Mehendi Courtyard',
    quote: 'Fresh marigold curtains and brass urlis turned our home terrace into a magazine setup. Every relative asked who planned the decor.',
    sort_order: 2
  },
  {
    id: 'rev-3',
    family_name: 'Tiwari Family · Barhpur',
    event_type: 'Engagement & Ring Ceremony',
    quote: 'Transparent pricing from day one—no surprise lighting charges at night, and the concentric brass arch stage photographed cleanly from every angle.',
    sort_order: 3
  }
];

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration TEXT NOT NULL,
    event_scope TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    views INTEGER NOT NULL DEFAULT 0,
    bookings INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS addons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS booked_dates (
    event_date TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'booked',
    note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    slot TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    src TEXT NOT NULL,
    wide INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS media_blobs (
    id TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data_b64 TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    family_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    quote TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    addon_names TEXT NOT NULL DEFAULT '',
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '',
    event_type TEXT NOT NULL DEFAULT 'Wedding',
    event_date TEXT NOT NULL,
    event_shift TEXT NOT NULL,
    event_time TEXT NOT NULL,
    venue TEXT NOT NULL DEFAULT '',
    guest_count TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    quoted_price INTEGER NOT NULL,
    offer_applied TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    k TEXT PRIMARY KEY,
    v TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ratelimits (
    k TEXT PRIMARY KEY,
    cnt INTEGER NOT NULL,
    ws INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS fails (
    ip TEXT PRIMARY KEY,
    cnt INTEGER NOT NULL,
    until INTEGER NOT NULL
  )`
];

let schemaReady = false;
let lastPruneMs = 0;

/* ---------- Security Headers & Response Helpers ---------- */
function buildSecurityHeaders(extra = {}) {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy':
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://esm.sh; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self' https://esm.sh; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';",
    ...extra
  };
}

function jsonRes(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildSecurityHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...extraHeaders
    })
  });
}

/* ---------- Sanitization & Crypto Helpers ---------- */
function T(v, max = 160) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function slugifyId(text, prefix = 'item') {
  const base = T(text, 60)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  const rand = crypto.randomUUID().slice(0, 6);
  return base ? `${base}-${rand}` : `${prefix}-${rand}`;
}

function getClientIp(request) {
  return T(request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0.0.0.0', 64);
}

function isHttps(request) {
  try {
    return new URL(request.url).protocol === 'https:';
  } catch (_) {
    return true;
  }
}

function activeCookieName(request) {
  return isHttps(request) ? COOKIE_NAME : DEV_COOKIE_NAME;
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const map = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    map[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return map;
}

function bytesToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(str) {
  const norm = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 ? '='.repeat(4 - (norm.length % 4)) : '';
  const bin = atob(norm + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function sha256Bytes(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

function timingSafeEqualBytes(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length !== b.length) return false;
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(a, b);
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacSign(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToHex(sig);
}

/* ---------- CSRF & JSON Body Guards ---------- */
function checkCsrf(request) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return null;

  const sfs = (request.headers.get('Sec-Fetch-Site') || '').toLowerCase();
  if (sfs && sfs !== 'same-origin' && sfs !== 'none') {
    return jsonRes({ error: 'Cross-site request blocked.' }, 403);
  }

  const origin = request.headers.get('Origin');
  if (origin) {
    const reqOrigin = new URL(request.url).origin;
    if (origin !== reqOrigin) {
      return jsonRes({ error: 'Origin mismatch.' }, 403);
    }
  }
  return null;
}

async function readJsonBody(request, maxBytes = MAX_JSON_BYTES) {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return { error: jsonRes({ error: 'Expected application/json.' }, 415) };
  }
  const lenHeader = Number(request.headers.get('Content-Length') || 0);
  if (lenHeader > maxBytes) {
    return { error: jsonRes({ error: 'Payload too large.' }, 413) };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { error: jsonRes({ error: 'Payload too large.' }, 413) };
  }
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { error: jsonRes({ error: 'Invalid JSON object.' }, 400) };
    }
    return { data };
  } catch (_) {
    return { error: jsonRes({ error: 'Malformed JSON body.' }, 400) };
  }
}

/* ---------- D1 Schema Bootstrap & Auto-Seed ---------- */
async function ensureSchema(env) {
  if (schemaReady) return;
  if (!env.DB) throw new Error('D1 database binding DB is missing.');

  await env.DB.batch(SCHEMA_STATEMENTS.map((sql) => env.DB.prepare(sql)));

  const now = Date.now();
  const [planC, addonC, mediaC, revC, pepRow] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS c FROM plans').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM addons').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM media').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM reviews').first(),
    env.DB.prepare("SELECT v FROM settings WHERE k='secret_pepper'").first()
  ]);

  if (!planC || Number(planC.c) === 0) {
    await env.DB.batch(
      SEED_PLANS.map((p) =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO plans(id,name,tagline,price,duration,event_scope,deliverables,sort_order,active,views,bookings,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,1,?,?,?,?)'
        ).bind(
          p.id,
          p.name,
          p.tagline,
          p.price,
          p.duration,
          p.event_scope,
          JSON.stringify(p.deliverables),
          p.sort_order,
          p.views,
          p.bookings,
          now,
          now
        )
      )
    );
  }

  if (!addonC || Number(addonC.c) === 0) {
    await env.DB.batch(
      SEED_ADDONS.map((a) =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO addons(id,name,price,note,active,sort_order,created_at) VALUES(?,?,?,?,1,?,?)'
        ).bind(a.id, a.name, a.price, a.note, a.sort_order, now)
      )
    );
  }

  if (!mediaC || Number(mediaC.c) === 0) {
    await env.DB.batch(
      SEED_MEDIA.map((m) =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO media(id,slot,category,title,location,src,wide,sort_order,created_at) VALUES(?,?,?,?,?,?,?,?,?)'
        ).bind(m.id, m.slot, m.category, m.title, m.location, m.src, m.wide, m.sort_order, now)
      )
    );
  }

  if (!revC || Number(revC.c) === 0) {
    await env.DB.batch(
      SEED_REVIEWS.map((r) =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO reviews(id,family_name,event_type,quote,sort_order,created_at) VALUES(?,?,?,?,?,?)'
        ).bind(r.id, r.family_name, r.event_type, r.quote, r.sort_order, now)
      )
    );
  }

  if (!pepRow) {
    const rand = new Uint8Array(32);
    crypto.getRandomValues(rand);
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('secret_pepper', ?)").bind(bytesToHex(rand)),
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('admin_ver', '1')"),
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('offer', ?)").bind(JSON.stringify(DEFAULT_OFFER)),
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('studio', ?)").bind(JSON.stringify(DEFAULT_STUDIO)),
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('category_views', '{}')")
    ]);
  }

  schemaReady = true;
}

async function maybePrune(env) {
  const now = Date.now();
  if (now - lastPruneMs < 1000 * 60 * 15) return;
  lastPruneMs = now;
  const oldRl = now - 1000 * 60 * 60 * 24;
  try {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM ratelimits WHERE ws < ?').bind(oldRl),
      env.DB.prepare('DELETE FROM fails WHERE until > 0 AND until < ?').bind(now)
    ]);
  } catch (_) {}
}

async function getSettingJson(env, key, fallback) {
  const row = await env.DB.prepare('SELECT v FROM settings WHERE k=?').bind(key).first();
  if (!row || !row.v) return fallback;
  try {
    return { ...fallback, ...JSON.parse(row.v) };
  } catch (_) {
    return fallback;
  }
}

async function getPepper(env) {
  if (env.SESSION_SECRET && String(env.SESSION_SECRET).length >= 16) {
    return String(env.SESSION_SECRET);
  }
  const row = await env.DB.prepare("SELECT v FROM settings WHERE k='secret_pepper'").first();
  return (row && row.v) || 'usha-fallback-pepper';
}

async function getAdminVer(env) {
  const row = await env.DB.prepare("SELECT v FROM settings WHERE k='admin_ver'").first();
  return String((row && row.v) || '1');
}

async function checkRateLimit(env, key, limit, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT cnt, ws FROM ratelimits WHERE k=?').bind(key).first();
  if (!row || now - Number(row.ws) >= windowMs) {
    await env.DB.prepare('INSERT OR REPLACE INTO ratelimits(k,cnt,ws) VALUES(?,1,?)').bind(key, now).run();
    return { allowed: true, count: 1 };
  }
  const next = Number(row.cnt) + 1;
  if (next > limit) return { allowed: false, count: next };
  await env.DB.prepare('UPDATE ratelimits SET cnt=? WHERE k=?').bind(next, key).run();
  return { allowed: true, count: next };
}

/* ---------- Admin Session Auth ---------- */
async function createAdminCookie(request, env) {
  const pepper = await getPepper(env);
  const ver = await getAdminVer(env);
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = b64urlEncode(JSON.stringify({ r: 'admin', v: ver, e: exp }));
  const sig = await hmacSign(pepper + ':usha-adm-sess', payload);
  const securePart = isHttps(request) ? 'Secure; ' : '';
  return `${activeCookieName(request)}=${payload}.${sig}; HttpOnly; ${securePart}SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SEC}`;
}

function clearAdminCookie(request) {
  const securePart = isHttps(request) ? 'Secure; ' : '';
  return `${activeCookieName(request)}=; HttpOnly; ${securePart}SameSite=Strict; Path=/; Max-Age=0`;
}

async function verifyAdminSession(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[activeCookieName(request)];
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || sig.length !== 64) return false;

  const pepper = await getPepper(env);
  const expectedSig = await hmacSign(pepper + ':usha-adm-sess', payload);
  const sigOk = timingSafeEqualBytes(
    new TextEncoder().encode(sig),
    new TextEncoder().encode(expectedSig)
  );
  if (!sigOk) return false;

  try {
    const parsed = JSON.parse(b64urlDecode(payload));
    if (parsed.r !== 'admin') return false;
    if (!parsed.e || Number(parsed.e) < Math.floor(Date.now() / 1000)) return false;
    const currentVer = await getAdminVer(env);
    if (String(parsed.v) !== currentVer) return false;
    return true;
  } catch (_) {
    return false;
  }
}

/* ---------- Domain Helpers ---------- */
function parsePlanRow(row) {
  let deliverables = [];
  try {
    const parsed = JSON.parse(row.deliverables || '[]');
    if (Array.isArray(parsed)) deliverables = parsed.map((d) => T(String(d), 180)).filter(Boolean);
  } catch (_) {}
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    price: Number(row.price),
    duration: row.duration,
    event_scope: row.event_scope,
    deliverables,
    sort_order: Number(row.sort_order || 1),
    views: Number(row.views || 0),
    bookings: Number(row.bookings || 0)
  };
}

function computeTrendingPlanId(plans) {
  if (!plans.length) return '';
  let best = plans[0];
  let bestScore = -1;
  for (const p of plans) {
    const score = p.bookings * 6 + p.views;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  if (bestScore === 0) {
    const sig = plans.find((p) => p.id === 'wedding-mandap-signature');
    if (sig) return sig.id;
  }
  return best.id;
}

function computeDiscountedPrice(basePrice, offer) {
  const pct = offer && offer.active ? Math.max(0, Math.min(75, Number(offer.percent || 0))) : 0;
  if (pct <= 0) return { finalPrice: basePrice, savings: 0, offerLabel: '' };
  const finalPrice = Math.round((basePrice * (100 - pct)) / 100);
  return {
    finalPrice,
    savings: basePrice - finalPrice,
    offerLabel: `${pct}% ${T(offer.title || 'Event Offer', 60)}`
  };
}

async function fetchPublicPayload(env, includePrivateNotes = false) {
  const [plansRes, addonsRes, datesRes, mediaRes, revRes, offer, studio] = await Promise.all([
    env.DB.prepare('SELECT * FROM plans WHERE active=1 ORDER BY sort_order ASC, created_at ASC').all(),
    env.DB.prepare('SELECT * FROM addons WHERE active=1 ORDER BY sort_order ASC, created_at ASC').all(),
    env.DB.prepare('SELECT * FROM booked_dates ORDER BY event_date ASC').all(),
    env.DB.prepare('SELECT * FROM media ORDER BY sort_order ASC, created_at ASC').all(),
    env.DB.prepare('SELECT * FROM reviews ORDER BY sort_order ASC, created_at DESC').all(),
    getSettingJson(env, 'offer', DEFAULT_OFFER),
    getSettingJson(env, 'studio', DEFAULT_STUDIO)
  ]);

  const plans = (plansRes.results || []).map(parsePlanRow);
  const addons = (addonsRes.results || []).map((a) => ({
    id: a.id,
    name: a.name,
    price: Number(a.price),
    note: a.note,
    sort_order: Number(a.sort_order || 1)
  }));
  const bookedDates = (datesRes.results || []).map((d) =>
    includePrivateNotes
      ? { event_date: d.event_date, status: d.status, note: d.note }
      : { event_date: d.event_date, status: d.status }
  );
  const media = (mediaRes.results || []).map((m) => ({
    id: m.id,
    slot: m.slot,
    category: m.category,
    title: m.title,
    location: m.location,
    src: m.src,
    wide: Boolean(m.wide),
    sort_order: Number(m.sort_order || 1)
  }));
  const reviews = (revRes.results || []).map((r) => ({
    id: r.id,
    family_name: r.family_name,
    event_type: r.event_type,
    quote: r.quote,
    sort_order: Number(r.sort_order || 1)
  }));

  return {
    studio,
    offer,
    plans,
    addons,
    bookedDates,
    media,
    reviews,
    trendingPlanId: computeTrendingPlanId(plans),
    version: APP_VERSION
  };
}

/* ---------- Main Worker Handler ---------- */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (path.includes('..') || path.includes('\\')) {
      return jsonRes({ error: 'Invalid path.' }, 400);
    }

    // 1. Edge-cached uploaded decor photos (/m/:id)
    if (method === 'GET' && path.startsWith('/m/')) {
      const id = path.slice(3).trim();
      if (!/^[a-zA-Z0-9_-]{6,64}$/.test(id)) {
        return new Response('Not found', { status: 404, headers: buildSecurityHeaders() });
      }
      try {
        await ensureSchema(env);
        const blob = await env.DB.prepare('SELECT mime, data_b64 FROM media_blobs WHERE id=?').bind(id).first();
        if (!blob) {
          return new Response('Not found', { status: 404, headers: buildSecurityHeaders() });
        }
        const binStr = atob(blob.data_b64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        return new Response(bytes, {
          status: 200,
          headers: buildSecurityHeaders({
            'Content-Type': blob.mime,
            'Cache-Control': 'public, max-age=31536000, immutable'
          })
        });
      } catch (_) {
        return new Response('Media unavailable', { status: 500, headers: buildSecurityHeaders() });
      }
    }

    // 2. Hidden Same-Origin API Namespace (/api/v1/*)
    if (path.startsWith('/api/v1/')) {
      const csrfErr = checkCsrf(request);
      if (csrfErr) return csrfErr;

      try {
        await ensureSchema(env);
        ctx.waitUntil(maybePrune(env));
      } catch (_) {
        return jsonRes({ error: 'Database unavailable.' }, 503);
      }

      // Health check
      if (method === 'GET' && path === '/api/v1/health') {
        return jsonRes({
          ok: true,
          version: APP_VERSION,
          db: Boolean(env.DB),
          admin: Boolean(env.ADMIN_PASSWORD)
        });
      }

      // Public site data bootstrap
      if (method === 'GET' && path === '/api/v1/bootstrap') {
        return jsonRes(await fetchPublicPayload(env, false));
      }

      // Atomic debounced visit pulse (tracks both plan views and decor style views)
      if (method === 'POST' && path === '/api/v1/pulse') {
        const parsed = await readJsonBody(request, 2048);
        if (parsed.error) return parsed.error;

        const ip = getClientIp(request);
        const burst = await checkRateLimit(env, `pb:${ip}`, 25, 60 * 1000);
        if (!burst.allowed) return jsonRes({ ok: true, counted: false });

        const planId = T(parsed.data.planId || '', 64);
        const category = T(parsed.data.category || '', 40);

        if (planId && /^[a-zA-Z0-9_-]{2,64}$/.test(planId)) {
          const dedupe = await checkRateLimit(env, `pv:${ip}:${planId}`, 1, 60 * 60 * 1000);
          if (dedupe.allowed) {
            await env.DB.prepare('UPDATE plans SET views = views + 1 WHERE id=? AND active=1').bind(planId).run();
            return jsonRes({ ok: true, counted: true });
          }
          return jsonRes({ ok: true, counted: false });
        }

        if (category && ALLOWED_CATEGORIES.has(category)) {
          const dedupe = await checkRateLimit(env, `cv:${ip}:${category}`, 1, 60 * 60 * 1000);
          if (dedupe.allowed) {
            const cur = await getSettingJson(env, 'category_views', {});
            cur[category] = Number(cur[category] || 0) + 1;
            await env.DB.prepare("INSERT OR REPLACE INTO settings(k,v) VALUES('category_views', ?)")
              .bind(JSON.stringify(cur))
              .run();
            return jsonRes({ ok: true, counted: true });
          }
          return jsonRes({ ok: true, counted: false });
        }

        return jsonRes({ error: 'Invalid pulse target.' }, 400);
      }

      // Public event booking log (server-side recomputes package + add-ons + live offer)
      if (method === 'POST' && path === '/api/v1/book') {
        const ip = getClientIp(request);
        const rl = await checkRateLimit(env, `bk:${ip}`, 10, 10 * 60 * 1000);
        if (!rl.allowed) {
          return jsonRes({ error: 'Too many booking requests. Please wait a few minutes.' }, 429);
        }

        const parsed = await readJsonBody(request, 8192);
        if (parsed.error) return parsed.error;
        const b = parsed.data;

        const planId = T(b.planId || '', 64);
        const customerName = T(b.customerName || '', 80);
        const customerPhone = T(b.customerPhone || '', 24).replace(/[^0-9+\-\s]/g, '');
        const eventType = T(b.eventType || 'Wedding', 40);
        const eventDate = T(b.eventDate || '', 16);
        const eventShift = T(b.eventShift || '', 32);
        const eventTime = T(b.eventTime || '', 12);
        const venue = T(b.venue || '', 120);
        const guestCount = T(String(b.guestCount || ''), 24);
        const notes = T(b.notes || '', 400);
        const rawAddonIds = Array.isArray(b.addonIds) ? b.addonIds.map((x) => T(String(x), 64)).slice(0, 10) : [];

        if (customerName.length < 2) return jsonRes({ error: 'Please enter your full name.' }, 400);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return jsonRes({ error: 'Please choose a valid event date.' }, 400);
        if (!ALLOWED_SHIFTS.has(eventShift)) return jsonRes({ error: 'Please select a valid event shift.' }, 400);
        if (!/^\d{2}:\d{2}$/.test(eventTime)) return jsonRes({ error: 'Please select a valid start time.' }, 400);

        const safeEventType = ALLOWED_EVENT_TYPES.has(eventType) ? eventType : 'Wedding';

        const planRow = await env.DB.prepare('SELECT * FROM plans WHERE id=? AND active=1').bind(planId).first();
        if (!planRow) return jsonRes({ error: 'Selected package was not found.' }, 404);

        const [offer, allAddonsRes] = await Promise.all([
          getSettingJson(env, 'offer', DEFAULT_OFFER),
          env.DB.prepare('SELECT id, name, price FROM addons WHERE active=1').all()
        ]);

        const addonMap = new Map((allAddonsRes.results || []).map((a) => [a.id, a]));
        let addonsTotal = 0;
        const chosenAddonNames = [];
        for (const aid of new Set(rawAddonIds)) {
          const found = addonMap.get(aid);
          if (found) {
            addonsTotal += Number(found.price || 0);
            chosenAddonNames.push(found.name);
          }
        }

        const { finalPrice: pkgFinal, offerLabel } = computeDiscountedPrice(Number(planRow.price), offer);
        const grandTotal = pkgFinal + addonsTotal;
        const now = Date.now();

        await env.DB.batch([
          env.DB.prepare('UPDATE plans SET bookings = bookings + 1 WHERE id=?').bind(planId),
          env.DB.prepare(
            'INSERT INTO bookings(plan_id,plan_name,addon_names,customer_name,customer_phone,event_type,event_date,event_shift,event_time,venue,guest_count,notes,quoted_price,offer_applied,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
          ).bind(
            planId,
            planRow.name,
            chosenAddonNames.join(', '),
            customerName,
            customerPhone,
            safeEventType,
            eventDate,
            eventShift,
            eventTime,
            venue,
            guestCount,
            notes,
            grandTotal,
            offerLabel,
            'new',
            now
          )
        ]);

        return jsonRes({ ok: true, quotedPrice: grandTotal, offerApplied: offerLabel });
      }

      // Admin session check
      if (method === 'GET' && path === '/api/v1/event-auth/session') {
        const authed = await verifyAdminSession(request, env);
        return jsonRes({ authenticated: authed, adminConfigured: Boolean(env.ADMIN_PASSWORD) });
      }

      // Admin login (SHA-256 + timingSafeEqual + per-IP & global lockouts)
      if (method === 'POST' && path === '/api/v1/event-auth/login') {
        if (!env.ADMIN_PASSWORD) {
          return jsonRes({ error: 'ADMIN_PASSWORD secret is not set on Cloudflare yet.' }, 503);
        }
        const ip = getClientIp(request);
        const now = Date.now();

        const [ipFail, globalFail] = await Promise.all([
          env.DB.prepare('SELECT cnt, until FROM fails WHERE ip=?').bind(ip).first(),
          env.DB.prepare("SELECT cnt, until FROM fails WHERE ip='__global__'").first()
        ]);
        if ((ipFail && Number(ipFail.until) > now) || (globalFail && Number(globalFail.until) > now)) {
          return jsonRes({ error: 'Access temporarily locked. Try again later.' }, 429);
        }

        const parsed = await readJsonBody(request, 2048);
        if (parsed.error) return parsed.error;
        const pass = typeof parsed.data.password === 'string' ? parsed.data.password : '';

        const pepper = await getPepper(env);
        const [givenHash, targetHash] = await Promise.all([
          sha256Bytes(`${pepper}:usha-adm:${pass}`),
          sha256Bytes(`${pepper}:usha-adm:${String(env.ADMIN_PASSWORD)}`)
        ]);

        if (!timingSafeEqualBytes(givenHash, targetHash)) {
          const nextIpCnt = (ipFail ? Number(ipFail.cnt) : 0) + 1;
          const nextIpUntil = nextIpCnt >= 5 ? now + 15 * 60 * 1000 : 0;
          const nextGlobalCnt = (globalFail ? Number(globalFail.cnt) : 0) + 1;
          const nextGlobalUntil = nextGlobalCnt >= 25 ? now + 10 * 60 * 1000 : 0;

          await env.DB.batch([
            env.DB.prepare('INSERT OR REPLACE INTO fails(ip,cnt,until) VALUES(?,?,?)').bind(ip, nextIpCnt, nextIpUntil),
            env.DB.prepare("INSERT OR REPLACE INTO fails(ip,cnt,until) VALUES('__global__',?,?)").bind(
              nextGlobalCnt,
              nextGlobalUntil
            )
          ]);
          return jsonRes({ error: 'Invalid credentials.' }, 401);
        }

        await env.DB.prepare('DELETE FROM fails WHERE ip=?').bind(ip).run();
        const setCookie = await createAdminCookie(request, env);
        return jsonRes({ ok: true }, 200, { 'Set-Cookie': setCookie });
      }

      // Admin logout (revokes all devices via admin_ver epoch bump)
      if (method === 'POST' && path === '/api/v1/event-auth/logout') {
        const authed = await verifyAdminSession(request, env);
        if (authed) {
          await env.DB.prepare("INSERT OR REPLACE INTO settings(k,v) VALUES('admin_ver', ?)")
            .bind(String(Date.now()))
            .run();
        }
        return jsonRes({ ok: true }, 200, { 'Set-Cookie': clearAdminCookie(request) });
      }

      // ---- Protected CMS Endpoints (/api/v1/event-cms/*) ----
      if (path.startsWith('/api/v1/event-cms/')) {
        const authed = await verifyAdminSession(request, env);
        if (!authed) return jsonRes({ error: 'Unauthorized.' }, 401);

        // Full Admin Overview
        if (method === 'GET' && path === '/api/v1/event-cms/overview') {
          const [pub, bookingsRes, catViews] = await Promise.all([
            fetchPublicPayload(env, true),
            env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 60').all(),
            getSettingJson(env, 'category_views', {})
          ]);
          let totalViews = 0;
          let totalBookings = 0;
          for (const p of pub.plans) {
            totalViews += p.views;
            totalBookings += p.bookings;
          }
          let topDecorStyle = 'Mandap & Stage';
          let topDecorCount = -1;
          for (const [k, v] of Object.entries(catViews)) {
            if (Number(v) > topDecorCount) {
              topDecorCount = Number(v);
              topDecorStyle = k;
            }
          }
          const conversionRate = totalViews > 0 ? Number(((totalBookings / totalViews) * 100).toFixed(1)) : 0;
          return jsonRes({
            ...pub,
            analytics: {
              totalViews,
              totalBookings,
              conversionRate,
              trendingPlanId: pub.trendingPlanId,
              topDecorStyle,
              categoryViews: catViews
            },
            recentBookings: bookingsRes.results || []
          });
        }

        // Create / Edit Package Plan
        if (method === 'POST' && path === '/api/v1/event-cms/plans') {
          const parsed = await readJsonBody(request, MAX_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const p = parsed.data;

          const name = T(p.name, 90);
          const tagline = T(p.tagline, 260);
          const price = Math.round(Number(p.price));
          const duration = T(p.duration, 80);
          const eventScope = T(p.event_scope || p.team || 'Wedding Venue', 120);
          const sortOrder = Math.max(1, Math.min(99, Math.round(Number(p.sort_order || 5))));
          const deliverables = (Array.isArray(p.deliverables) ? p.deliverables : [])
            .map((d) => T(String(d), 180))
            .filter(Boolean)
            .slice(0, 12);

          if (name.length < 3 || tagline.length < 6) {
            return jsonRes({ error: 'Package name and description are required.' }, 400);
          }
          if (!Number.isFinite(price) || price < 1000 || price > 5000000) {
            return jsonRes({ error: 'Price must be between ₹1,000 and ₹50,00,000.' }, 400);
          }
          if (!deliverables.length) {
            return jsonRes({ error: 'Add at least one included decor item.' }, 400);
          }

          const now = Date.now();
          const existingId = T(p.id || '', 64);

          if (existingId && /^[a-zA-Z0-9_-]{2,64}$/.test(existingId)) {
            const found = await env.DB.prepare('SELECT id FROM plans WHERE id=?').bind(existingId).first();
            if (found) {
              await env.DB.prepare(
                'UPDATE plans SET name=?, tagline=?, price=?, duration=?, event_scope=?, deliverables=?, sort_order=?, updated_at=? WHERE id=?'
              )
                .bind(name, tagline, price, duration || '1 Function', eventScope, JSON.stringify(deliverables), sortOrder, now, existingId)
                .run();
              return jsonRes({ ok: true, id: existingId });
            }
          }

          const newId = slugifyId(name, 'pkg');
          await env.DB.prepare(
            'INSERT INTO plans(id,name,tagline,price,duration,event_scope,deliverables,sort_order,active,views,bookings,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,1,0,0,?,?)'
          )
            .bind(newId, name, tagline, price, duration || '1 Function', eventScope, JSON.stringify(deliverables), sortOrder, now, now)
            .run();
          return jsonRes({ ok: true, id: newId });
        }

        // Delete Package Plan
        if (method === 'DELETE' && path.startsWith('/api/v1/event-cms/plans/')) {
          const id = T(path.slice('/api/v1/event-cms/plans/'.length), 64);
          if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id)) return jsonRes({ error: 'Invalid plan ID.' }, 400);
          const countRow = await env.DB.prepare('SELECT COUNT(*) AS c FROM plans WHERE active=1').first();
          if (countRow && Number(countRow.c) <= 1) {
            return jsonRes({ error: 'Keep at least one active package on the website.' }, 400);
          }
          await env.DB.prepare('DELETE FROM plans WHERE id=?').bind(id).run();
          return jsonRes({ ok: true });
        }

        // Create / Edit Decor Add-On
        if (method === 'POST' && path === '/api/v1/event-cms/addons') {
          const parsed = await readJsonBody(request, MAX_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const a = parsed.data;
          const name = T(a.name, 90);
          const price = Math.round(Number(a.price));
          const note = T(a.note || '', 180);
          const sortOrder = Math.max(1, Math.min(99, Math.round(Number(a.sort_order || 5))));

          if (name.length < 3) return jsonRes({ error: 'Add-on name is required.' }, 400);
          if (!Number.isFinite(price) || price < 200 || price > 1000000) {
            return jsonRes({ error: 'Add-on price must be between ₹200 and ₹10,00,000.' }, 400);
          }

          const existingId = T(a.id || '', 64);
          if (existingId && /^[a-zA-Z0-9_-]{2,64}$/.test(existingId)) {
            const found = await env.DB.prepare('SELECT id FROM addons WHERE id=?').bind(existingId).first();
            if (found) {
              await env.DB.prepare('UPDATE addons SET name=?, price=?, note=?, sort_order=? WHERE id=?')
                .bind(name, price, note, sortOrder, existingId)
                .run();
              return jsonRes({ ok: true, id: existingId });
            }
          }

          const newId = slugifyId(name, 'addon');
          await env.DB.prepare(
            'INSERT INTO addons(id,name,price,note,active,sort_order,created_at) VALUES(?,?,?,?,1,?,?)'
          )
            .bind(newId, name, price, note, sortOrder, Date.now())
            .run();
          return jsonRes({ ok: true, id: newId });
        }

        // Delete Decor Add-On
        if (method === 'DELETE' && path.startsWith('/api/v1/event-cms/addons/')) {
          const id = T(path.slice('/api/v1/event-cms/addons/'.length), 64);
          if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id)) return jsonRes({ error: 'Invalid add-on ID.' }, 400);
          await env.DB.prepare('DELETE FROM addons WHERE id=?').bind(id).run();
          return jsonRes({ ok: true });
        }

        // Update Live Offer
        if (method === 'PUT' && path === '/api/v1/event-cms/offer') {
          const parsed = await readJsonBody(request, MAX_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const o = parsed.data;
          const percent = Math.max(0, Math.min(75, Math.round(Number(o.percent || 0))));
          const nextOffer = {
            active: Boolean(o.active) && percent > 0,
            title: T(o.title || 'Shaadi Season Offer', 70) || 'Shaadi Season Offer',
            percent,
            note: T(o.note || '', 220),
            validTill: T(o.validTill || '', 40)
          };
          await env.DB.prepare("INSERT OR REPLACE INTO settings(k,v) VALUES('offer', ?)")
            .bind(JSON.stringify(nextOffer))
            .run();
          return jsonRes({ ok: true, offer: nextOffer });
        }

        // Mark Event Date Booked / Limited
        if (method === 'POST' && path === '/api/v1/event-cms/dates') {
          const parsed = await readJsonBody(request, MAX_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const eventDate = T(parsed.data.event_date || '', 16);
          const status = T(parsed.data.status || 'booked', 16);
          const note = T(parsed.data.note || '', 140);

          if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
            return jsonRes({ error: 'Enter a valid date (YYYY-MM-DD).' }, 400);
          }
          if (!ALLOWED_DATE_STATUS.has(status)) {
            return jsonRes({ error: 'Status must be booked or limited.' }, 400);
          }
          await env.DB.prepare(
            'INSERT OR REPLACE INTO booked_dates(event_date,status,note,created_at) VALUES(?,?,?,?)'
          )
            .bind(eventDate, status, note, Date.now())
            .run();
          return jsonRes({ ok: true, event_date: eventDate });
        }

        // Re-open Event Date (Delete from booked_dates)
        if (method === 'DELETE' && path.startsWith('/api/v1/event-cms/dates/')) {
          const eventDate = T(path.slice('/api/v1/event-cms/dates/'.length), 16);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return jsonRes({ error: 'Invalid date.' }, 400);
          await env.DB.prepare('DELETE FROM booked_dates WHERE event_date=?').bind(eventDate).run();
          return jsonRes({ ok: true });
        }

        // Upload / Replace / Edit Decor Media Photo
        if (method === 'POST' && path === '/api/v1/event-cms/media') {
          const parsed = await readJsonBody(request, MAX_UPLOAD_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const m = parsed.data;

          const slot = T(m.slot || 'gallery', 24);
          const category = T(m.category || 'Mandap & Stage', 32);
          const title = T(m.title || '', 90);
          const location = T(m.location || '', 90);
          const wide = m.wide ? 1 : 0;
          const sortOrder = Math.max(1, Math.min(99, Math.round(Number(m.sort_order || 10))));
          const existingId = T(m.id || '', 64);

          if (!ALLOWED_SLOTS.has(slot)) return jsonRes({ error: 'Invalid page slot.' }, 400);
          if (!ALLOWED_CATEGORIES.has(category)) return jsonRes({ error: 'Invalid decor category.' }, 400);
          if (title.length < 2) return jsonRes({ error: 'Please provide a photo title.' }, 400);

          const now = Date.now();
          let newSrc = null;
          let blobId = null;

          if (typeof m.imageData === 'string' && m.imageData.length > 0) {
            const match = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(m.imageData.trim());
            if (!match) return jsonRes({ error: 'Only WebP, JPEG, or PNG images are accepted.' }, 400);
            const mime = match[1];
            const b64 = match[2];
            const approxBytes = Math.floor((b64.length * 3) / 4);
            if (approxBytes > MAX_DECODED_IMAGE_BYTES || approxBytes < 64) {
              return jsonRes({ error: 'Image must be under 280 KB after compression.' }, 400);
            }
            const hashHex = bytesToHex(await sha256Bytes(b64 + ':' + now)).slice(0, 16);
            blobId = `img_${hashHex}`;
            await env.DB.prepare(
              'INSERT OR REPLACE INTO media_blobs(id,mime,data_b64,size_bytes,created_at) VALUES(?,?,?,?,?)'
            )
              .bind(blobId, mime, b64, approxBytes, now)
              .run();
            newSrc = `/m/${blobId}`;
          }

          const targetId =
            slot === 'home_signature'
              ? 'home-sig-main'
              : slot === 'about_craft'
                ? 'about-craft-main'
                : existingId;

          if (targetId && /^[a-zA-Z0-9_-]{2,64}$/.test(targetId)) {
            const prev = await env.DB.prepare('SELECT id, src FROM media WHERE id=?').bind(targetId).first();
            if (prev) {
              const finalSrc = newSrc || prev.src;
              await env.DB.prepare(
                'UPDATE media SET slot=?, category=?, title=?, location=?, src=?, wide=?, sort_order=? WHERE id=?'
              )
                .bind(slot, category, title, location || 'Usha Event Planner', finalSrc, wide, sortOrder, targetId)
                .run();
              if (newSrc && prev.src && prev.src.startsWith('/m/')) {
                const oldBlobId = prev.src.slice(3);
                if (oldBlobId !== blobId) {
                  await env.DB.prepare('DELETE FROM media_blobs WHERE id=?').bind(oldBlobId).run();
                }
              }
              return jsonRes({ ok: true, id: targetId, src: finalSrc });
            }
          }

          if (!newSrc) return jsonRes({ error: 'Please select a photo file to upload.' }, 400);

          const mediaId = slugifyId(title, 'decor');
          await env.DB.prepare(
            'INSERT INTO media(id,slot,category,title,location,src,wide,sort_order,created_at) VALUES(?,?,?,?,?,?,?,?,?)'
          )
            .bind(mediaId, slot, category, title, location || 'Usha Event Planner', newSrc, wide, sortOrder, now)
            .run();
          return jsonRes({ ok: true, id: mediaId, src: newSrc });
        }

        // Delete Media Item
        if (method === 'DELETE' && path.startsWith('/api/v1/event-cms/media/')) {
          const id = T(path.slice('/api/v1/event-cms/media/'.length), 64);
          if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id)) return jsonRes({ error: 'Invalid media ID.' }, 400);
          const item = await env.DB.prepare('SELECT * FROM media WHERE id=?').bind(id).first();
          if (!item) return jsonRes({ error: 'Photo not found.' }, 404);

          if (item.slot === 'home_signature' || item.slot === 'about_craft') {
            return jsonRes({ error: 'Replace this primary slot image instead of deleting it so no slot goes empty.' }, 400);
          }
          const sameSlotCount = await env.DB.prepare('SELECT COUNT(*) AS c FROM media WHERE slot=?').bind(item.slot).first();
          if (sameSlotCount && Number(sameSlotCount.c) <= 1) {
            return jsonRes({ error: 'Keep at least one image in this section.' }, 400);
          }

          await env.DB.prepare('DELETE FROM media WHERE id=?').bind(id).run();
          if (item.src && item.src.startsWith('/m/')) {
            await env.DB.prepare('DELETE FROM media_blobs WHERE id=?').bind(item.src.slice(3)).run();
          }
          return jsonRes({ ok: true });
        }

        // Add / Edit Family Testimonial Review
        if (method === 'POST' && path === '/api/v1/event-cms/reviews') {
          const parsed = await readJsonBody(request, MAX_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const r = parsed.data;
          const familyName = T(r.family_name || '', 80);
          const eventType = T(r.event_type || '', 80);
          const quote = T(r.quote || '', 320);

          if (familyName.length < 2 || quote.length < 10) {
            return jsonRes({ error: 'Family name and review quote are required.' }, 400);
          }
          const id = slugifyId(familyName, 'rev');
          await env.DB.prepare(
            'INSERT INTO reviews(id,family_name,event_type,quote,sort_order,created_at) VALUES(?,?,?,?,1,?)'
          )
            .bind(id, familyName, eventType || 'Wedding Decor', quote, Date.now())
            .run();
          return jsonRes({ ok: true, id });
        }

        // Delete Family Review
        if (method === 'DELETE' && path.startsWith('/api/v1/event-cms/reviews/')) {
          const id = T(path.slice('/api/v1/event-cms/reviews/'.length), 64);
          if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id)) return jsonRes({ error: 'Invalid review ID.' }, 400);
          await env.DB.prepare('DELETE FROM reviews WHERE id=?').bind(id).run();
          return jsonRes({ ok: true });
        }

        // Update Lead Status (new -> called -> confirmed -> completed)
        if (method === 'PATCH' && path.startsWith('/api/v1/event-cms/bookings/')) {
          const id = Number(path.slice('/api/v1/event-cms/bookings/'.length));
          if (!Number.isInteger(id) || id <= 0) return jsonRes({ error: 'Invalid booking ID.' }, 400);
          const parsed = await readJsonBody(request, 2048);
          if (parsed.error) return parsed.error;
          const status = T(parsed.data.status || '', 20);
          if (!ALLOWED_BOOKING_STATUS.has(status)) return jsonRes({ error: 'Invalid lead status.' }, 400);
          await env.DB.prepare('UPDATE bookings SET status=? WHERE id=?').bind(status, id).run();
          return jsonRes({ ok: true, status });
        }

        // Delete Booking Lead
        if (method === 'DELETE' && path.startsWith('/api/v1/event-cms/bookings/')) {
          const id = Number(path.slice('/api/v1/event-cms/bookings/'.length));
          if (!Number.isInteger(id) || id <= 0) return jsonRes({ error: 'Invalid booking ID.' }, 400);
          await env.DB.prepare('DELETE FROM bookings WHERE id=?').bind(id).run();
          return jsonRes({ ok: true });
        }

        // Update Studio Profile Settings
        if (method === 'PUT' && path === '/api/v1/event-cms/studio') {
          const parsed = await readJsonBody(request, MAX_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const s = parsed.data;
          const current = await getSettingJson(env, 'studio', DEFAULT_STUDIO);
          const rawWa = T(s.whatsapp || current.whatsapp, 20).replace(/[^0-9]/g, '');
          const cleanWa = rawWa.length === 10 ? '91' + rawWa : rawWa.length >= 11 ? rawWa : current.whatsapp;
          const ig = T(s.instagram || current.instagram, 200);
          const maps = T(s.mapsUrl || current.mapsUrl, 240);

          const nextStudio = {
            name: T(s.name || current.name, 70) || current.name,
            city: T(s.city || current.city, 120) || current.city,
            whatsapp: cleanWa,
            phone: T(s.phone || current.phone, 28) || current.phone,
            hours: T(s.hours || current.hours, 80) || current.hours,
            instagram: /^https?:\/\//i.test(ig) ? ig : current.instagram,
            mapsUrl: /^https?:\/\//i.test(maps) ? maps : current.mapsUrl
          };
          await env.DB.prepare("INSERT OR REPLACE INTO settings(k,v) VALUES('studio', ?)")
            .bind(JSON.stringify(nextStudio))
            .run();
          return jsonRes({ ok: true, studio: nextStudio });
        }

        return jsonRes({ error: 'Endpoint not found.' }, 404);
      }

      return jsonRes({ error: 'Endpoint not found.' }, 404);
    }

    // 3. Static Assets Serving + No-Store HTML + Custom 404
    if (!env.ASSETS) {
      return new Response('Assets binding missing.', { status: 500, headers: buildSecurityHeaders() });
    }

    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status === 404) {
      const nfUrl = new URL('/404.html', request.url);
      const nfRes = await env.ASSETS.fetch(new Request(nfUrl, { method: 'GET' }));
      const nfHeaders = new Headers(nfRes.headers);
      for (const [k, v] of Object.entries(buildSecurityHeaders({ 'Cache-Control': 'no-store, no-cache, must-revalidate' }))) {
        nfHeaders.set(k, v);
      }
      return new Response(nfRes.body, { status: 404, headers: nfHeaders });
    }

    const headers = new Headers(assetRes.headers);
    const isHtml =
      path === '/' ||
      path.endsWith('.html') ||
      (headers.get('Content-Type') || '').includes('text/html');

    for (const [k, v] of Object.entries(buildSecurityHeaders())) {
      headers.set(k, v);
    }
    if (isHtml) {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else if (path.startsWith('/assets/photos/')) {
      headers.set('Cache-Control', 'public, max-age=604800');
    }

    return new Response(assetRes.body, {
      status: assetRes.status,
      statusText: assetRes.statusText,
      headers
    });
  }
};
