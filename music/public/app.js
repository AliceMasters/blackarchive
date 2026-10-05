'use strict';

/* ═══════════════════════════════════════════════════════════
   ELEGY — client
   ═══════════════════════════════════════════════════════════ */

const PEOPLE = {
  alice: { name: 'Alice', initial: 'A' },
  tracy: { name: 'Tracy', initial: 'T' },
};
const TAGS = ['mortality', 'regret', 'aging', 'loneliness', 'sacrifice',
  'connection', 'grief', 'exhaustion', 'hope', 'heartbreak'];
const CRY = { none: 'Dry-eyed', almost: 'Almost', cried: 'Cried' };

/* ── utilities ─────────────────────────────────────────────── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');
const other = who => (who === 'alice' ? 'tracy' : 'alice');
const isForever = s => s.cry.alice === 'cried' || s.cry.tracy === 'cried';
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } },
};

function ytId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}
function spId(url) {
  const m = String(url || '').match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]+)/i);
  return m ? m[1] : null;
}
const platformOf = url => (ytId(url) ? 'youtube' : spId(url) ? 'spotify' : safeUrl(url) ? 'link' : null);

const fmtDate = ms => {
  const d = new Date(ms), y = new Date().getFullYear();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(d.getFullYear() !== y ? { year: 'numeric' } : {}) });
};
const fmtLong = ms => new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const ago = ms => {
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(ms);
};

/* ── icons ─────────────────────────────────────────────────── */
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
  grip: '<circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
  play: '<path d="M7 4.6v14.8a1 1 0 0 0 1.52.86l12.2-7.4a1 1 0 0 0 0-1.72L8.52 3.74A1 1 0 0 0 7 4.6z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  pencil: '<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevLeft: '<path d="m15 18-6-6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  infinity: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  swap: '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  minus: '<path d="M6 12h12"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  youtube: '<path fill-rule="evenodd" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12z"/>',
  spotify: '<path fill-rule="evenodd" d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm5.04 15.87a.69.69 0 0 1-.94.23c-2.6-1.59-5.86-1.94-9.71-1.07a.69.69 0 1 1-.3-1.34c4.2-.96 7.82-.55 10.72 1.23.32.2.43.62.23.95zm1.35-3a.86.86 0 0 1-1.18.28c-2.97-1.83-7.5-2.36-11.02-1.29a.86.86 0 1 1-.5-1.64c4.02-1.22 9.01-.63 12.42 1.47.4.25.53.78.28 1.18zm.12-3.12C14.95 8.63 9.07 8.43 5.67 9.46a1.03 1.03 0 1 1-.6-1.97c3.9-1.18 10.4-.95 14.5 1.48a1.03 1.03 0 0 1-1.06 1.78z"/>',
};
const FILLED = new Set(['grip', 'play', 'youtube', 'spotify']);
const I = (name, cls = '') => `<svg class="i ${FILLED.has(name) ? 'fill' : ''} ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

/* ── state ─────────────────────────────────────────────────── */
const S = {
  me: PEOPLE[store.get('elegy.me')] ? store.get('elegy.me') : null,
  playlists: [],
  data: null,          // { playlist, songs } for the open playlist
  forever: [],
  route: { name: 'home' },
  filters: { status: 'all', by: 'all', tags: new Set(), q: '' },
  open: new Set(),     // expanded song ids
  playing: new Set(),  // song ids with a live player
  focusSong: null,
  layers: [],
  dragging: false,
};

// API paths are written as "/api/…" and resolved under wherever Elegy is mounted.
const BASE = location.pathname.replace(/[^/]*$/, '');
async function api(method, url, body) {
  const r = await fetch(BASE + url.replace(/^\//, ''), {
    method,
    headers: { 'content-type': 'application/json', 'x-listener': S.me || '' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Something went quiet. Try again.');
  return j;
}

/* ── small render helpers ──────────────────────────────────── */
const orb = (who, size = '') => `<span class="orb ${who} ${size}" title="${PEOPLE[who].name}">${PEOPLE[who].initial}</span>`;
const tagChip = t => `<span class="tag t-${t}">${t}</span>`;
const foreverBadge = () => `<span class="forever-badge" title="Someone cried. Forever favourite.">${I('infinity')}Forever</span>`;
const srcBadge = p => p === 'youtube' ? `<span class="src-badge youtube">${I('youtube')}YouTube</span>`
  : p === 'spotify' ? `<span class="src-badge spotify">${I('spotify')}Spotify</span>`
  : p === 'link' ? `<span class="src-badge link">${I('link')}Link</span>` : '';

function tearChip(s, who, size = 'sm') {
  const v = s.cry[who];
  return `<span class="tear ${v}" title="${PEOPLE[who].name}: ${CRY[v].toLowerCase()}">${orb(who, size)}<span class="drop">${I('drop')}</span></span>`;
}
const tears = (s, size) => `<div class="tears">${tearChip(s, 'alice', size)}${tearChip(s, 'tracy', size)}</div>`;

function statusPill(s) {
  return s.status === 'approved'
    ? `<button class="status approved" data-action="status" title="Approved — click to move back to shortlist">${I('check')}<span class="lbl">Approved</span></button>`
    : `<button class="status shortlist" data-action="status" title="On the shortlist — click to approve"><span class="ring"></span><span class="lbl">Shortlist</span></button>`;
}

function hash(str) { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; }
const HUES = [252, 268, 286, 304, 322, 338, 196, 174, 214, 232];
function artHtml(covers, seed, title) {
  if (covers.length >= 4) return `<div class="art mosaic">${covers.slice(0, 4).map(c => `<img src="${esc(c)}" alt="" loading="lazy">`).join('')}</div>`;
  if (covers.length) return `<div class="art"><img src="${esc(covers[0])}" alt="" loading="lazy"></div>`;
  const h = hash(seed);
  const style = `--h1:${HUES[h % 10]};--h2:${HUES[(h >>> 5) % 10]};--x1:${10 + (h >>> 9) % 40}%;--y1:${(h >>> 13) % 30}%;--x2:${60 + (h >>> 17) % 40}%;--y2:${60 + (h >>> 21) % 40}%`;
  return `<div class="art gen" style="${style}"><span class="glyph">${esc((title || '·').trim().charAt(0))}</span></div>`;
}

/* ── toasts ────────────────────────────────────────────────── */
function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span class="ic">${I(kind === 'err' ? 'x' : kind === 'tear' ? 'drop' : 'check')}</span><span>${esc(msg)}</span>`;
  $('#toasts').append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2600);
}

function tearBurst(x, y) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let k = 0; k < 9; k++) {
    const d = document.createElement('span');
    d.className = 'drip';
    d.innerHTML = I('drop');
    d.style.left = `${x - 6}px`; d.style.top = `${y - 8}px`;
    d.style.setProperty('--dx', `${(Math.random() - .5) * 120}px`);
    d.style.setProperty('--dy', `${50 + Math.random() * 90}px`);
    d.style.animationDelay = `${k * 35}ms`;
    document.body.append(d);
    setTimeout(() => d.remove(), 1500);
  }
}

/* ── layers (sheets + dialogs) ─────────────────────────────── */
function openLayer(html, { center = false } = {}) {
  const back = document.createElement('div');
  back.className = 'backdrop';
  const sheet = document.createElement('div');
  sheet.className = `sheet ${center ? 'center' : ''}`;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.innerHTML = html;
  const layer = { back, sheet };
  back.addEventListener('click', () => closeLayer(layer));
  $('#layer').append(back, sheet);
  S.layers.push(layer);
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('[autofocus]', sheet)?.focus(), 60);
  return layer;
}
function closeLayer(layer = S.layers[S.layers.length - 1]) {
  if (!layer) return;
  S.layers = S.layers.filter(l => l !== layer);
  layer.back.classList.add('out'); layer.sheet.classList.add('out');
  setTimeout(() => { layer.back.remove(); layer.sheet.remove(); }, 280);
  if (!S.layers.length) document.body.style.overflow = '';
  layer.onClose?.();
}

function confirmDialog({ title, body, confirm = 'Delete', danger = true }) {
  return new Promise(resolve => {
    const l = openLayer(`
      <div class="sheet-h"><div><div class="eyebrow">Are you sure</div><h2>${esc(title)}</h2></div></div>
      <div class="sheet-b"><p>${body}</p></div>
      <div class="sheet-f"><span class="sp"></span>
        <button class="btn ghost" data-k="no">Keep it</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" data-k="yes" autofocus>${esc(confirm)}</button>
      </div>`, { center: true });
    let done = false;
    const finish = v => { if (done) return; done = true; resolve(v); };
    l.onClose = () => finish(false);
    $('[data-k="no"]', l.sheet).onclick = () => closeLayer(l);
    $('[data-k="yes"]', l.sheet).onclick = () => { finish(true); closeLayer(l); };
  });
}

/* ═══ GATE ═════════════════════════════════════════════════════ */
function renderGate() {
  $('#root').innerHTML = `
    <section class="gate">
      <div class="gate-inner">
        <div class="eyebrow">A private listening room</div>
        <h1 class="wordmark">Eleg<em>y</em></h1>
        <p class="gate-sub">Songs that undo us, kept by two.</p>
        <div class="eyebrow gate-q">Who's listening?</div>
        <div class="gate-cards">
          ${Object.entries(PEOPLE).map(([k, p]) => `
            <button class="gate-card ${k}" data-action="pick" data-who="${k}">
              <span class="orb ${k}">${p.initial}</span>
              <span class="name">${p.name}</span>
              <span class="enter">Enter ${I('arrow')}</span>
            </button>`).join('')}
        </div>
        <div class="gate-foot">No passwords. Just honesty about what made you cry.</div>
      </div>
    </section>`;
}

/* ═══ SHELL ════════════════════════════════════════════════════ */
function renderShell() {
  $('#root').innerHTML = `
    <div class="shell" id="shell">
      <aside class="sidebar" id="sidebar"></aside>
      <div class="scrim" data-action="drawer"></div>
      <div class="mainwrap">
        <header class="topbar">
          <button class="btn ghost icon" data-action="drawer" aria-label="Menu">${I('menu')}</button>
          <span class="mark">Eleg<em>y</em></span>
          <button data-action="drawer" aria-label="Listener">${orb(S.me, 'lg')}</button>
        </header>
        <main class="main" id="main"></main>
      </div>
    </div>`;
  renderSidebar();
}

function renderSidebar() {
  const el = $('#sidebar'); if (!el) return;
  const r = S.route;
  const total = S.playlists.reduce((a, p) => a + p.counts.forever, 0);
  el.innerHTML = `
    <div class="brand"><span class="mark">Eleg<em>y</em></span><span class="ver">Private</span></div>
    <nav class="nav">
      <a class="nav-item ${r.name === 'home' ? 'on' : ''}" href="#/">${I('grid')}<span class="t">Playlists</span><span class="ct">${S.playlists.length}</span></a>
      <a class="nav-item ${r.name === 'forever' ? 'on' : ''}" href="#/forever">${I('infinity')}<span class="t">Forever</span><span class="ct">${total}</span></a>
    </nav>
    <div class="nav-h"><span class="eyebrow">Playlists</span>
      <button class="btn ghost sm icon" data-action="new-playlist" title="New playlist">${I('plus')}</button></div>
    <div class="nav-scroll"><nav class="nav">
      ${S.playlists.map(p => `
        <a class="nav-item ${r.name === 'playlist' && r.id === p.id ? 'on' : ''}" href="#/p/${p.id}">
          <span class="mini" style="position:relative">${artHtml(p.covers.slice(0, 1), p.id, p.title).replace(' loading="lazy"', '')}</span>
          <span class="t">${esc(p.title)}</span><span class="ct">${p.counts.songs}</span>
        </a>`).join('') || `<div class="nav-item" style="color:var(--text-4);cursor:default">Nothing yet</div>`}
    </nav></div>
    <div class="me-card">
      ${orb(S.me, 'lg')}
      <div class="who"><small>Listening as</small><b>${PEOPLE[S.me].name}</b></div>
      <button class="btn ghost sm icon" data-action="switch" title="Switch to ${PEOPLE[other(S.me)].name}">${I('swap')}</button>
    </div>`;
}

const refreshSidebarSoon = debounce(async () => {
  try { S.playlists = await api('GET', '/api/playlists'); renderSidebar(); } catch { /* next time */ }
}, 900);

/* ═══ ROUTER ═══════════════════════════════════════════════════ */
function parseRoute() {
  const [a, b] = location.hash.replace(/^#\/?/, '').split('/');
  if (a === 'p' && b) return { name: 'playlist', id: b };
  if (a === 'forever') return { name: 'forever' };
  return { name: 'home' };
}

async function go() {
  const prev = S.route;
  S.route = parseRoute();
  $('#shell')?.classList.remove('drawer');
  const main = $('#main');
  if (!main) return;
  S.playing.clear();
  if (!(prev.name === S.route.name && prev.id === S.route.id)) window.scrollTo(0, 0);
  try {
    if (S.route.name === 'playlist') {
      if (S.data?.playlist.id !== S.route.id) {
        S.filters = { status: 'all', by: 'all', tags: new Set(), q: '' };
        if (!S.focusSong) S.open.clear();
        main.innerHTML = skeleton();
      }
      const [data] = await Promise.all([api('GET', `/api/playlists/${S.route.id}`), loadPlaylists()]);
      S.data = data;
      renderPlaylist();
    } else if (S.route.name === 'forever') {
      if (!S.forever.length) main.innerHTML = skeleton(true);
      [S.forever] = await Promise.all([api('GET', '/api/forever'), loadPlaylists()]);
      main.innerHTML = viewForever();
    } else {
      await loadPlaylists();
      main.innerHTML = viewHome();
    }
  } catch (e) {
    main.innerHTML = `<div class="page"><div class="empty" style="margin-top:56px"><h2>Lost the thread.</h2><p>${esc(e.message)}</p><a class="btn" href="#/">Back to playlists</a></div></div>`;
  }
  renderSidebar();
}
async function loadPlaylists() { S.playlists = await api('GET', '/api/playlists'); }

function skeleton(cards) {
  const sk = (w, h, extra = '') => `<div class="skel" style="width:${w};height:${h};${extra}"></div>`;
  return `<div class="page" style="padding-top:56px">
    ${sk('120px', '10px')}${sk('min(420px,80%)', '64px', 'margin:18px 0 28px')}
    ${cards ? `<div class="fv-grid">${sk('100%', '300px').repeat(3)}</div>`
      : Array.from({ length: 5 }, () => sk('100%', '62px', 'margin-bottom:8px')).join('')}
  </div>`;
}

/* ═══ HOME ═════════════════════════════════════════════════════ */
function viewHome() {
  const pl = S.playlists;
  const sum = k => pl.reduce((a, p) => a + p.counts[k], 0);
  const songs = sum('songs'), approved = sum('approved'), forever = sum('forever'), shortlist = sum('shortlist');
  const pct = (a, b) => (b ? Math.max(3, Math.round((a / b) * 100)) : 0);
  const last = pl.length ? Math.max(...pl.map(p => p.updatedAt)) : 0;

  return `<div class="page">
    <header class="page-head">
      <div>
        <div class="eyebrow">Library</div>
        <h1>Playlists <em>for the long night</em></h1>
        <p>Each one starts with a brief. Every song has to earn its place — and somebody's tears.</p>
      </div>
      <button class="btn primary lg" data-action="new-playlist">${I('plus')}New playlist</button>
    </header>

    ${pl.length ? `
    <section class="stats">
      <div class="stat"><div class="eyebrow">Playlists</div><div class="n">${pl.length}</div>
        <div class="hint" style="margin-top:14px">${last ? `Last touched ${ago(last)}` : '—'}</div></div>
      <div class="stat"><div class="eyebrow">Songs</div><div class="n">${songs}</div>
        <div class="hint" style="margin-top:14px">${shortlist} still on the shortlist</div></div>
      <div class="stat"><div class="eyebrow">Approved</div><div class="n">${approved}<small>of ${songs}</small></div>
        <div class="bar" style="--c:linear-gradient(90deg,#4ade80,#86efac)"><i style="width:${pct(approved, songs)}%"></i></div></div>
      <div class="stat"><div class="eyebrow">Forever</div><div class="n">${forever}<small>cried</small></div>
        <div class="bar" style="--c:linear-gradient(90deg,#7dd3fc,#a78bfa,#f0abfc)"><i style="width:${pct(forever, songs)}%"></i></div></div>
    </section>

    <section class="grid">
      ${pl.map((p, i) => `
        <a class="card" href="#/p/${p.id}" style="--i:${i}">
          <div class="cover">${artHtml(p.covers, p.id, p.title)}
            <div class="chips">
              <span class="glass-chip">${I('music')}${p.counts.songs}</span>
              ${p.counts.forever ? `<span class="glass-chip">${I('drop')}${p.counts.forever}</span>` : ''}
            </div>
          </div>
          <div class="body">
            <h3>${esc(p.title)}</h3>
            <p class="brief">${esc(p.brief) || '<span style="color:var(--text-4)">No brief yet.</span>'}</p>
            <div class="foot">
              <span class="orbs">${p.contributors.map(w => orb(w, 'xs')).join('')}</span>
              <span>${p.counts.approved} approved</span>
              <span class="sp">${ago(p.updatedAt)}</span>
            </div>
          </div>
        </a>`).join('')}
      <button class="card new" data-action="new-playlist" style="--i:${pl.length}">
        <span class="plus">${I('plus')}</span>
        <span><span class="serif">Start another</span><br><span class="hint">Write a brief, then go hunting.</span></span>
      </button>
    </section>` : `
    <section class="empty">
      <div class="vinyl"></div>
      <h2>Begin with a brief.</h2>
      <p>A playlist here is a question you're both trying to answer. Name it, say what it's for, then start adding the songs that answer it.</p>
      <button class="btn primary lg" data-action="new-playlist">${I('plus')}Create the first playlist</button>
    </section>`}
  </div>`;
}

/* ═══ PLAYLIST ═════════════════════════════════════════════════ */
function counts() {
  const s = S.data.songs;
  return {
    all: s.length,
    shortlist: s.filter(x => x.status === 'shortlist').length,
    approved: s.filter(x => x.status === 'approved').length,
    forever: s.filter(isForever).length,
  };
}

function filtered() {
  const f = S.filters, q = f.q.trim().toLowerCase();
  return S.data.songs.filter(s =>
    (f.status === 'all' || s.status === f.status) &&
    (f.by === 'all' || s.addedBy === f.by) &&
    (!f.tags.size || s.tags.some(t => f.tags.has(t))) &&
    (!q || `${s.title} ${s.artist} ${s.notes}`.toLowerCase().includes(q)));
}
const filtersActive = () => S.filters.status !== 'all' || S.filters.by !== 'all' || S.filters.tags.size || S.filters.q;

function renderPlaylist() {
  const { playlist: p, songs } = S.data;
  const covers = songs.map(s => s.thumb).filter(Boolean);
  $('#main').innerHTML = `<div class="page">
    <a class="back" href="#/">${I('chevLeft')}Playlists</a>
    <header class="hero">
      ${covers[0] ? `<div class="hero-bg"><img src="${esc(covers[0])}" alt=""></div>` : ''}
      <div class="cover-lg">${artHtml(covers, p.id, p.title)}</div>
      <div>
        <div class="eyebrow">Playlist · started by ${PEOPLE[p.createdBy]?.name || '—'} · ${fmtDate(p.createdAt)}</div>
        <h1>${esc(p.title)}</h1>
        <div class="brief-block">
          <div class="label">The brief</div>
          <p class="${p.brief ? '' : 'empty'}">${esc(p.brief) || 'No brief yet — what are we looking for?'}</p>
        </div>
        <div id="meta-row">${metaRow()}</div>
        <div class="actions">
          <button class="btn primary" data-action="add-song">${I('plus')}Add song<kbd>N</kbd></button>
          <button class="btn" data-action="export" ${songs.length ? '' : 'disabled'}>${I('file')}Export</button>
          <button class="btn ghost" data-action="edit-playlist">${I('pencil')}Edit</button>
        </div>
      </div>
    </header>
    ${songs.length ? `<div class="toolbar" id="toolbar">${toolbar()}</div><div id="list-wrap">${listHtml()}</div>` : `
      <section class="empty slim">
        <div class="vinyl"></div>
        <h2>The first song sets the tone.</h2>
        <p>Paste a YouTube or Spotify link and Elegy fills in the rest. Then tell each other why it hits.</p>
        <button class="btn primary" data-action="add-song">${I('plus')}Add the first song</button>
      </section>`}
  </div>`;
  bindSortable();
  if (S.focusSong) {
    const li = $(`.song[data-id="${S.focusSong}"]`);
    S.focusSong = null;
    if (li) setTimeout(() => { li.scrollIntoView({ behavior: 'smooth', block: 'center' }); li.classList.add('flash'); }, 120);
  }
}

function metaRow() {
  const c = counts();
  const tearsShed = S.data.songs.reduce((a, s) => a + (s.cry.alice !== 'none') + (s.cry.tracy !== 'none'), 0);
  return `<div class="meta-row">
    <span><b>${c.all}</b> songs</span><span class="dot"></span>
    <span><b>${c.approved}</b> approved</span><span class="dot"></span>
    <span><b>${c.shortlist}</b> on the shortlist</span><span class="dot"></span>
    <span>${I('drop')}<b>${tearsShed}</b> ${tearsShed === 1 ? 'tear' : 'tears'} · <b>${c.forever}</b> forever</span>
  </div>`;
}

function toolbar() {
  const c = counts(), f = S.filters;
  const seg = (k, label) => `<button class="${f.status === k ? 'on' : ''}" data-action="f-status" data-v="${k}">${label}<span class="ct">${c[k]}</span></button>`;
  const by = (k, inner) => `<button class="${f.by === k ? 'on' : ''}" data-action="f-by" data-v="${k}">${inner}</button>`;
  return `
    <div class="tb-row">
      <div class="seg">${seg('all', 'All')}${seg('shortlist', 'Shortlist')}${seg('approved', 'Approved')}</div>
      <div class="seg" title="Added by">${by('all', 'Both')}${by('alice', orb('alice', 'xs'))}${by('tracy', orb('tracy', 'xs'))}</div>
      <div class="input-wrap search">${I('search')}<input class="input" id="q" placeholder="Search songs, artists, notes" value="${esc(f.q)}" autocomplete="off"><span class="trail"><kbd>/</kbd></span></div>
    </div>
    <div class="tags-row">
      ${TAGS.map(t => `<button class="tag t-${t} ${f.tags.has(t) ? 'on' : 'off'}" data-action="f-tag" data-v="${t}">${t}</button>`).join('')}
      ${filtersActive() ? `<button class="clear-f" data-action="f-clear">Clear filters</button>` : ''}
    </div>`;
}

function listHtml() {
  const list = filtered();
  if (!list.length) return `<section class="empty slim" style="margin-top:6px"><h2>Nothing matches.</h2><p>Loosen the filters — the right song might be hiding under the wrong tag.</p><button class="btn" data-action="f-clear">Clear filters</button></section>`;
  return `<div class="list">
    <div class="list-head"><div></div><div style="text-align:right">#</div><div>Song</div><div class="c-tags">Tags</div><div>Tears</div><div>Status</div><div class="c-added" style="text-align:right">Added</div></div>
    <ul class="songs" id="songs">${list.map((s, i) => songLi(s, i)).join('')}</ul>
  </div>`;
}

function songLi(s, i) {
  const open = S.open.has(s.id);
  return `<li class="song ${isForever(s) ? 'forever' : ''} ${open ? 'open' : ''}" data-id="${s.id}" style="--i:${Math.min(i, 20)}">
    ${rowMain(s, i)}
    ${open ? detailHtml(s) : ''}
  </li>`;
}

function rowMain(s, i) {
  const more = s.tags.length > 3 ? `<span class="tag more">+${s.tags.length - 3}</span>` : '';
  return `<div class="row-main" data-action="toggle">
    <span class="grip" data-action="noop" title="Drag to reorder">${I('grip')}</span>
    <span class="idx">${pad(i + 1)}</span>
    <div class="song-id">
      <div class="thumb">${s.thumb ? `<img src="${esc(s.thumb)}" alt="" loading="lazy">` : `<span class="ph">${I('music')}</span>`}<span class="play">${I('play')}</span></div>
      <div class="song-t">
        <div class="ttl"><span>${esc(s.title)}</span>${isForever(s) ? foreverBadge() : ''}</div>
        <div class="art-n">${esc(s.artist) || '<span style="color:var(--text-4)">Unknown artist</span>'}</div>
        <div class="sub-m">${tears(s, 'xs')}${s.tags.slice(0, 2).map(tagChip).join('')}</div>
      </div>
    </div>
    <div class="song-tags">${s.tags.slice(0, 3).map(tagChip).join('')}${more}</div>
    ${tears(s)}
    <div class="r-status">${statusPill(s)}</div>
    <div class="added">${orb(s.addedBy, 'xs')}${fmtDate(s.addedAt)}<span class="chev">${I('chevDown')}</span></div>
  </div>`;
}

function detailHtml(s) {
  const p = platformOf(s.url);
  const where = p === 'youtube' ? 'YouTube' : p === 'spotify' ? 'Spotify' : 'source';
  return `<div class="detail">
    <div>
      <div data-slot="player">${playerHtml(s)}</div>
      <div class="player-under">
        <span style="display:inline-flex;align-items:center;gap:8px">${orb(s.addedBy, 'xs')}<span>${PEOPLE[s.addedBy]?.name}<span class="long"> added this</span> · ${fmtDate(s.addedAt)}</span></span>
        ${safeUrl(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">Open on ${where}${I('external')}</a>` : ''}
      </div>
    </div>
    <div class="d-side">
      <div class="d-sec">
        <div class="label">Why it hits <span class="saved" data-saved>${s.notes ? 'Saved' : ''}</span></div>
        <textarea class="textarea notes" data-notes="${s.id}" rows="3" placeholder="Say what it does to you…">${esc(s.notes)}</textarea>
      </div>
      <div class="d-side" data-slot="controls">${controlsHtml(s)}</div>
    </div>
  </div>`;
}

function controlsHtml(s) {
  const row = who => {
    const mine = who === S.me;
    return `<div class="cry-row ${mine ? 'mine' : 'theirs'}">
      ${orb(who, 'sm')}<span class="nm">${PEOPLE[who].name}</span>
      ${mine ? '' : '<span class="yours">their call</span>'}
      <div class="seg">${Object.entries(CRY).map(([v, l]) => `
        <button class="${s.cry[who] === v ? 'on' : ''}" data-action="cry" data-v="${v}" ${mine ? '' : 'tabindex="-1"'}>
          ${v === 'none' ? I('minus') : I('drop')}<span class="t">${l}</span></button>`).join('')}</div>
    </div>`;
  };
  return `
    <div class="d-sec">
      <div class="label">The cry meter <span class="opt">cried = forever favourite</span></div>
      <div class="cry">${row(S.me)}${row(other(S.me))}</div>
    </div>
    <div class="d-sec">
      <div class="label">Tags</div>
      <div class="tag-pick">${TAGS.map(t => `<button class="tag t-${t} ${s.tags.includes(t) ? 'on' : 'off'}" data-action="song-tag" data-v="${t}">${t}</button>`).join('')}</div>
    </div>
    <div class="d-foot">
      <div class="seg">
        <button class="${s.status === 'shortlist' ? 'on' : ''}" data-action="set-status" data-v="shortlist">Shortlist</button>
        <button class="${s.status === 'approved' ? 'on' : ''}" data-action="set-status" data-v="approved">${I('check')}Approved</button>
      </div>
      <span class="sp"></span>
      <button class="btn ghost sm" data-action="edit-song">${I('pencil')}Edit</button>
      <button class="btn ghost sm icon" data-action="delete-song" title="Remove song" style="color:var(--danger)">${I('trash')}</button>
    </div>`;
}

function playerHtml(s) {
  const yt = ytId(s.url), sp = spId(s.url);
  if (yt) return `<div class="player"><div class="facade" data-action="play" data-yt="${yt}">
      <img src="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="">
      <span class="pbtn">${I('play')}</span><span class="src">${srcBadge('youtube')}</span></div></div>`;
  if (sp) return `<div class="player spotify"><iframe src="https://open.spotify.com/embed/track/${sp}?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify player"></iframe></div>`;
  if (safeUrl(s.url)) return `<div class="player nolink"><div>${I('link')}<p style="margin:10px 0 14px">This link can't be embedded.</p><a class="btn sm" href="${esc(s.url)}" target="_blank" rel="noopener">Open it ${I('external')}</a></div></div>`;
  return `<div class="player nolink"><div><p style="margin:0 0 14px">No link yet. Add one to embed a player.</p><button class="btn sm" data-action="edit-song">${I('link')}Add a link</button></div></div>`;
}

/* in-place refresh of one song (keeps any playing player alive) */
function refreshSong(id) {
  const s = songById(id), li = $(`.song[data-id="${id}"]`);
  if (!s || !li) return;
  const idx = $$('.song', $('#songs')).indexOf(li);
  li.classList.toggle('forever', isForever(s));
  $('.row-main', li).outerHTML = rowMain(s, idx);
  const ctl = $('[data-slot="controls"]', li);
  if (ctl) ctl.innerHTML = controlsHtml(s);
  refreshCounts();
}
function refreshCounts() {
  if ($('#meta-row')) $('#meta-row').innerHTML = metaRow();
  const c = counts();
  $$('[data-action="f-status"]').forEach(b => { $('.ct', b).textContent = c[b.dataset.v]; });
}
function renderList() {
  const wrap = $('#list-wrap'); if (!wrap) return;
  S.playing.clear();
  wrap.innerHTML = listHtml();
  bindSortable();
}
function renderToolbar() { const t = $('#toolbar'); if (t) t.innerHTML = toolbar(); }
const songById = id => S.data?.songs.find(s => s.id === id);

/* drag & drop reordering — works within any filtered view */
function bindSortable() {
  const ul = $('#songs');
  if (!ul || !window.Sortable) return;
  Sortable.create(ul, {
    handle: '.grip', animation: 220, easing: 'cubic-bezier(.2,.8,.2,1)',
    ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
    forceFallback: true, fallbackTolerance: 4,
    onStart: () => { S.dragging = true; },
    onEnd: async e => {
      S.dragging = false;
      if (e.oldIndex === e.newIndex) return;
      const visible = $$('.song', ul).map(li => li.dataset.id);
      const vis = new Set(visible);
      const full = S.data.songs.map(s => s.id);
      const slots = full.map((id, i) => (vis.has(id) ? i : -1)).filter(i => i >= 0);
      slots.forEach((slot, k) => { full[slot] = visible[k]; });
      const byId = Object.fromEntries(S.data.songs.map(s => [s.id, s]));
      S.data.songs = full.map(id => byId[id]);
      $$('.song .idx', ul).forEach((el, i) => { el.textContent = pad(i + 1); });
      try { await api('PUT', `/api/playlists/${S.data.playlist.id}/order`, { ids: full }); refreshSidebarSoon(); }
      catch (err) { toast(err.message, 'err'); }
    },
  });
}

/* ── song mutations ────────────────────────────────────────── */
async function patchSong(id, body) {
  const s = songById(id); if (!s) return;
  const prev = structuredClone(s);
  if (body.cry) s.cry[S.me] = body.cry;
  for (const k of ['status', 'tags', 'title', 'artist', 'url', 'notes', 'thumb']) if (k in body) s[k] = body[k];
  refreshSong(id);
  try {
    Object.assign(s, await api('PATCH', `/api/songs/${id}`, body));
    refreshSong(id);
    refreshSidebarSoon();
  } catch (e) {
    Object.assign(s, prev);
    refreshSong(id);
    toast(e.message, 'err');
  }
}

const saveNotes = debounce(async (id, el) => {
  const tag = el.closest('.d-sec')?.querySelector('[data-saved]');
  try {
    await api('PATCH', `/api/songs/${id}`, { notes: el.value });
    if (tag) { tag.textContent = 'Saved'; tag.classList.add('ok'); setTimeout(() => tag.classList.remove('ok'), 1400); }
  } catch (e) { if (tag) tag.textContent = 'Not saved'; toast(e.message, 'err'); }
}, 700);

/* ── add / edit song sheet ─────────────────────────────────── */
function songSheet(existing) {
  const p = S.data.playlist;
  const f = {
    url: existing?.url || '', title: existing?.title || '', artist: existing?.artist || '',
    notes: existing?.notes || '', tags: new Set(existing?.tags || []), status: existing?.status || 'shortlist',
    cry: existing ? existing.cry[S.me] : 'none', thumb: existing?.thumb || '',
    dirty: { title: !!existing, artist: !!existing },
  };
  const l = openLayer(`
    <div class="sheet-h">
      <div><div class="eyebrow">${existing ? 'Edit song' : 'Add to'} · ${esc(p.title)}</div>
        <h2>${existing ? esc(existing.title) : 'A new song'}</h2></div>
      <button class="btn ghost icon" data-k="close" aria-label="Close">${I('x')}</button>
    </div>
    <form class="sheet-b" id="song-form" autocomplete="off">
      <div class="field">
        <label for="f-url">Link <span class="opt">YouTube or Spotify</span></label>
        <div class="input-wrap">${I('link')}<input class="input" id="f-url" placeholder="Paste a link — we'll fill in the rest" value="${esc(f.url)}" ${existing ? '' : 'autofocus'}><span class="trail" id="f-src">${srcBadge(platformOf(f.url))}</span></div>
        <div id="f-preview"></div>
      </div>
      <div class="field"><label for="f-title">Title</label><input class="input serif-in" id="f-title" value="${esc(f.title)}" placeholder="Song title" ${existing ? 'autofocus' : ''}></div>
      <div class="field"><label for="f-artist">Artist</label><input class="input" id="f-artist" value="${esc(f.artist)}" placeholder="Who sings it"></div>
      <div class="field"><label>Tags <span class="opt">pick any</span></label>
        <div class="tag-pick" id="f-tags">${TAGS.map(t => `<button type="button" class="tag t-${t} ${f.tags.has(t) ? 'on' : 'off'}" data-v="${t}">${t}</button>`).join('')}</div></div>
      <div class="field"><label for="f-notes">Why it hits</label>
        <textarea class="textarea notes" id="f-notes" placeholder="The line that gets you. The memory it drags up.">${esc(f.notes)}</textarea></div>
      <div class="row2">
        <div class="field"><label>Status</label>
          <div class="seg wide" id="f-status">
            <button type="button" data-v="shortlist" class="${f.status === 'shortlist' ? 'on' : ''}">Shortlist</button>
            <button type="button" data-v="approved" class="${f.status === 'approved' ? 'on' : ''}">${I('check')}Approved</button></div></div>
        <div class="field"><label>Did you cry? <span class="opt">${PEOPLE[S.me].name}</span></label>
          <div class="seg wide" id="f-cry">${Object.entries(CRY).map(([v, lb]) => `<button type="button" data-v="${v}" class="${f.cry === v ? 'on' : ''}">${lb}</button>`).join('')}</div></div>
      </div>
      <button type="submit" hidden></button>
    </form>
    <div class="sheet-f">
      ${existing ? '' : `<span class="hint">Adding as ${orb(S.me, 'xs')} ${PEOPLE[S.me].name}</span>`}
      <span class="sp"></span>
      <button class="btn ghost" data-k="close">Cancel</button>
      <button class="btn primary" data-k="save">${existing ? 'Save changes' : 'Add to playlist'}<kbd>⌘↵</kbd></button>
    </div>`);
  const sh = l.sheet;
  const urlIn = $('#f-url', sh), titleIn = $('#f-title', sh), artistIn = $('#f-artist', sh);

  const preview = () => {
    const pf = platformOf(f.url);
    $('#f-preview', sh).innerHTML = (pf && (f.thumb || f.title)) ? `
      <div class="link-preview" style="margin-top:4px">
        <div class="thumb">${f.thumb ? `<img src="${esc(f.thumb)}" alt="">` : `<span class="ph">${I('music')}</span>`}</div>
        <div class="lp-t"><b>${esc(f.title || 'Untitled')}</b><span>${esc(f.artist || '—')}</span></div>
        ${srcBadge(pf)}
      </div>` : '';
  };
  if (existing) preview();

  let seq = 0;
  const lookup = debounce(async () => {
    const pf = platformOf(f.url);
    $('#f-src', sh).innerHTML = srcBadge(pf);
    if (pf !== 'youtube' && pf !== 'spotify') { f.thumb = ''; preview(); return; }
    const mine = ++seq;
    $('#f-src', sh).innerHTML = `<span class="spinner"></span>`;
    try {
      const m = await api('GET', `/api/meta?url=${encodeURIComponent(f.url)}`);
      if (mine !== seq) return;
      if (m.title && !f.dirty.title) { f.title = m.title; titleIn.value = m.title; }
      if (m.artist && !f.dirty.artist) { f.artist = m.artist; artistIn.value = m.artist; }
      f.thumb = m.thumb || '';
    } catch { /* still fine — fill by hand */ }
    if (mine === seq) { $('#f-src', sh).innerHTML = srcBadge(pf); preview(); }
  }, 380);

  urlIn.addEventListener('input', () => { f.url = urlIn.value.trim(); lookup(); });
  titleIn.addEventListener('input', () => { f.title = titleIn.value; f.dirty.title = !!titleIn.value; preview(); });
  artistIn.addEventListener('input', () => { f.artist = artistIn.value; f.dirty.artist = !!artistIn.value; preview(); });
  $('#f-notes', sh).addEventListener('input', e => { f.notes = e.target.value; });
  $('#f-tags', sh).addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    f.tags.has(b.dataset.v) ? f.tags.delete(b.dataset.v) : f.tags.add(b.dataset.v);
    b.classList.toggle('on'); b.classList.toggle('off');
  });
  const segPick = (sel, key) => $(sel, sh).addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    f[key] = b.dataset.v;
    $$('button', $(sel, sh)).forEach(x => x.classList.toggle('on', x === b));
  });
  segPick('#f-status', 'status'); segPick('#f-cry', 'cry');

  const save = async () => {
    if (!f.title.trim()) { titleIn.focus(); toast('Every song needs a title.', 'err'); return; }
    const btn = $('[data-k="save"]', sh); btn.disabled = true;
    const body = { url: f.url, title: f.title, artist: f.artist, notes: f.notes, tags: [...f.tags], status: f.status, cry: f.cry, thumb: f.thumb };
    try {
      if (existing) {
        Object.assign(existing, await api('PATCH', `/api/songs/${existing.id}`, body));
        closeLayer(l);
        renderPlaylist();
        toast('Saved.');
      } else {
        const s = await api('POST', `/api/playlists/${p.id}/songs`, body);
        S.data.songs.push(s);
        closeLayer(l);
        S.focusSong = s.id;
        if (filtered().every(x => x.id !== s.id)) S.filters = { status: 'all', by: 'all', tags: new Set(), q: '' };
        renderPlaylist();
        toast(`Added “${s.title}”`);
        if (f.cry === 'cried') toast('Enshrined forever.', 'tear');
      }
      refreshSidebarSoon();
    } catch (e) { btn.disabled = false; toast(e.message, 'err'); }
  };
  $('#song-form', sh).addEventListener('submit', e => { e.preventDefault(); save(); });
  $('[data-k="save"]', sh).onclick = save;
  $$('[data-k="close"]', sh).forEach(b => { b.onclick = () => closeLayer(l); });
  l.submit = save;
  if (f.url && !existing) lookup();
}

/* ── playlist sheet ───────────────────────────────────────── */
function playlistSheet(existing) {
  const l = openLayer(`
    <div class="sheet-h">
      <div><div class="eyebrow">${existing ? 'Edit playlist' : 'New playlist'}</div><h2>${existing ? esc(existing.title) : 'Write the brief'}</h2></div>
      <button class="btn ghost icon" data-k="close" aria-label="Close">${I('x')}</button>
    </div>
    <form class="sheet-b" id="pl-form" autocomplete="off">
      <div class="field"><label for="pl-title">Title</label>
        <input class="input serif-in" id="pl-title" maxlength="120" value="${esc(existing?.title)}" placeholder="Songs for the drive home from the hospital" autofocus></div>
      <div class="field"><label for="pl-brief">The brief <span class="opt">what every song must do</span></label>
        <textarea class="textarea notes" id="pl-brief" rows="6" placeholder="What are we looking for? The feeling, the rules, the one thing a song has to do to make the cut.">${esc(existing?.brief)}</textarea></div>
      ${existing ? `<div class="danger-zone"><div><b>Delete this playlist</b><p>Removes it and all ${S.data.songs.length} songs, for both of you.</p></div>
        <button type="button" class="btn danger sm" data-k="delete">${I('trash')}Delete</button></div>` : ''}
      <button type="submit" hidden></button>
    </form>
    <div class="sheet-f"><span class="sp"></span>
      <button class="btn ghost" data-k="close">Cancel</button>
      <button class="btn primary" data-k="save">${existing ? 'Save' : 'Create playlist'}<kbd>⌘↵</kbd></button>
    </div>`);
  const sh = l.sheet;
  const save = async () => {
    const title = $('#pl-title', sh).value.trim(), brief = $('#pl-brief', sh).value.trim();
    if (!title) { $('#pl-title', sh).focus(); toast('Give it a title.', 'err'); return; }
    try {
      if (existing) {
        S.data.playlist = await api('PATCH', `/api/playlists/${existing.id}`, { title, brief });
        closeLayer(l); renderPlaylist(); toast('Brief updated.');
        refreshSidebarSoon();
      } else {
        const p = await api('POST', '/api/playlists', { title, brief });
        closeLayer(l); location.hash = `#/p/${p.id}`; toast('Playlist created.');
      }
    } catch (e) { toast(e.message, 'err'); }
  };
  $('#pl-form', sh).addEventListener('submit', e => { e.preventDefault(); save(); });
  $('[data-k="save"]', sh).onclick = save;
  $$('[data-k="close"]', sh).forEach(b => { b.onclick = () => closeLayer(l); });
  $('[data-k="delete"]', sh)?.addEventListener('click', async () => {
    if (!await confirmDialog({ title: `Delete “${existing.title}”?`, body: 'Every song, note and tear in it goes too. This can\'t be undone.', confirm: 'Delete playlist' })) return;
    try {
      await api('DELETE', `/api/playlists/${existing.id}`);
      closeLayer(l); S.data = null; location.hash = '#/'; toast('Playlist deleted.');
    } catch (e) { toast(e.message, 'err'); }
  });
  l.submit = save;
}

/* ── export ───────────────────────────────────────────────── */
function exportText(opt) {
  const { playlist: p, songs } = S.data;
  const list = songs.filter(s => opt.scope === 'all' || s.status === opt.scope);
  if (opt.format === 'plain') {
    return list.map((s, i) => `${pad(i + 1)}. ${s.title}${s.artist ? ` — ${s.artist}` : ''}\n    ${s.url || '(no link)'}`).join('\n\n');
  }
  const rule = '━'.repeat(44);
  const cryLine = s => ['alice', 'tracy'].filter(w => s.cry[w] !== 'none').map(w => `${PEOPLE[w].name} ${s.cry[w] === 'cried' ? 'cried' : 'almost cried'}`).join(' · ');
  const head = [
    'E L E G Y', rule, p.title.toUpperCase(),
    ...(p.brief ? ['', ...p.brief.split('\n').map(x => `  ${x}`)] : []), '',
    `${list.length} ${list.length === 1 ? 'song' : 'songs'}${opt.scope !== 'all' ? ` (${opt.scope})` : ''} · exported ${fmtLong(Date.now())} by ${PEOPLE[S.me].name}`,
    rule, '',
  ];
  const body = list.map((s, i) => {
    const lines = [`${pad(i + 1)}  ${s.title}${s.artist ? ` — ${s.artist}` : ''}${isForever(s) ? '   ∞ forever' : ''}`];
    lines.push(`    ${s.url || '(no link)'}`);
    const meta = [s.tags.join(', '), s.status, cryLine(s)].filter(Boolean).join('  ·  ');
    if (meta) lines.push(`    ${meta}`);
    if (opt.notes && s.notes) s.notes.split('\n').forEach((n, k) => lines.push(`    ${k ? ' ' : '“'}${n}${k === s.notes.split('\n').length - 1 ? '”' : ''}`));
    return lines.join('\n');
  });
  return [...head, body.join('\n\n'), '', rule, 'What made us cry, in order.'].join('\n');
}

function exportSheet() {
  const c = counts();
  const opt = { scope: c.approved ? 'approved' : 'all', format: 'detailed', notes: true };
  const l = openLayer(`
    <div class="sheet-h">
      <div><div class="eyebrow">Export · ${esc(S.data.playlist.title)}</div><h2>Take it with you</h2></div>
      <button class="btn ghost icon" data-k="close" aria-label="Close">${I('x')}</button>
    </div>
    <div class="sheet-b">
      <div class="row2">
        <div class="field"><label>Which songs</label><div class="seg wide" data-opt="scope">
          <button data-v="all">All <span class="ct">${c.all}</span></button>
          <button data-v="approved">Approved <span class="ct">${c.approved}</span></button></div></div>
        <div class="field"><label>Format</label><div class="seg wide" data-opt="format">
          <button data-v="detailed">Detailed</button><button data-v="plain">Just links</button></div></div>
      </div>
      <div class="toggle" data-opt-toggle="notes"><span>Include “why it hits” notes</span><span class="sw"></span></div>
      <pre class="export-pre" id="ex-pre"></pre>
    </div>
    <div class="sheet-f"><span class="sp"></span>
      <button class="btn" data-k="copy">${I('copy')}Copy</button>
      <button class="btn primary" data-k="dl">${I('download')}Download .txt</button>
    </div>`);
  const sh = l.sheet;
  const sync = () => {
    $$('[data-opt]', sh).forEach(g => $$('button', g).forEach(b => b.classList.toggle('on', opt[g.dataset.opt] === b.dataset.v)));
    const t = $('[data-opt-toggle]', sh);
    t.classList.toggle('on', opt.notes);
    t.style.display = opt.format === 'plain' ? 'none' : '';
    $('#ex-pre', sh).textContent = exportText(opt);
  };
  $$('[data-opt]', sh).forEach(g => g.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { opt[g.dataset.opt] = b.dataset.v; sync(); } }));
  $('[data-opt-toggle]', sh).onclick = () => { opt.notes = !opt.notes; sync(); };
  $('[data-k="close"]', sh).onclick = () => closeLayer(l);
  $('[data-k="copy"]', sh).onclick = async () => {
    const text = exportText(opt);
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast('Copied to clipboard.');
  };
  $('[data-k="dl"]', sh).onclick = () => {
    const blob = new Blob([exportText(opt)], { type: 'text/plain;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `${S.data.playlist.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'playlist'}.txt`,
    });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Downloaded.');
  };
  sync();
}

/* ═══ FOREVER ══════════════════════════════════════════════════ */
function viewForever() {
  const list = S.forever;
  return `<div class="page">
    <header class="page-head">
      <div>
        <div class="eyebrow">${I('infinity')} Forever</div>
        <h1>The ones that <em>got us</em></h1>
        <p>Every song that made one of you actually cry. Once it's here, it stays — favourites for life.</p>
      </div>
    </header>
    ${list.length ? `<section class="fv-grid">${list.map((s, i) => `
      <article class="fv" data-action="open-song" data-pl="${s.playlistId}" data-id="${s.id}" style="--i:${i}" tabindex="0">
        <div class="img">${s.thumb ? `<img src="${esc(s.thumb)}" alt="" loading="lazy">` : artHtml([], s.id, s.title)}
          ${foreverBadge()}${tears(s)}</div>
        <div class="bd">
          <h3>${esc(s.title)}</h3>
          <div class="by">${esc(s.artist) || 'Unknown artist'}</div>
          ${s.notes ? `<blockquote>${esc(s.notes)}</blockquote>` : ''}
          <div class="from">From ${esc(s.playlistTitle)}</div>
        </div>
      </article>`).join('')}</section>` : `
    <section class="empty">
      <div class="tearbig">${I('drop')}</div>
      <h2>No one has cried yet.</h2>
      <p>When a song finally breaks one of you, mark it “cried” and it'll be enshrined here.</p>
      <a class="btn" href="#/">Go find one</a>
    </section>`}
  </div>`;
}

/* ═══ EVENTS ═══════════════════════════════════════════════════ */
const actions = {
  pick(el) {
    const who = el.dataset.who;
    $('.gate')?.classList.add('leaving');
    setTimeout(() => { S.me = who; store.set('elegy.me', who); renderShell(); go(); toast(`Welcome back, ${PEOPLE[who].name}.`); }, 450);
  },
  switch() { S.me = null; store.set('elegy.me', null); S.data = null; renderGate(); },
  drawer() { $('#shell')?.classList.toggle('drawer'); },
  'new-playlist'() { playlistSheet(null); },
  'edit-playlist'() { playlistSheet(S.data.playlist); },
  'add-song'() { songSheet(null); },
  export() { exportSheet(); },
  noop() {},
  toggle(el) {
    const li = el.closest('.song'), id = li.dataset.id, s = songById(id);
    if (S.open.has(id)) {
      S.open.delete(id); S.playing.delete(id);
      li.classList.remove('open'); $('.detail', li)?.remove();
    } else {
      S.open.add(id);
      li.classList.add('open'); li.insertAdjacentHTML('beforeend', detailHtml(s));
    }
  },
  status(el) {
    const id = el.closest('.song').dataset.id, s = songById(id);
    patchSong(id, { status: s.status === 'approved' ? 'shortlist' : 'approved' });
  },
  'set-status'(el) { patchSong(el.closest('.song').dataset.id, { status: el.dataset.v }); },
  cry(el, e) {
    const id = el.closest('.song').dataset.id, s = songById(id), v = el.dataset.v;
    if (s.cry[S.me] === v) return;
    patchSong(id, { cry: v });
    if (v === 'cried') { tearBurst(e.clientX, e.clientY); toast('Enshrined forever.', 'tear'); }
  },
  'song-tag'(el) {
    const id = el.closest('.song').dataset.id, s = songById(id), t = el.dataset.v;
    patchSong(id, { tags: s.tags.includes(t) ? s.tags.filter(x => x !== t) : [...s.tags, t] });
  },
  'edit-song'(el) { songSheet(songById(el.closest('.song').dataset.id)); },
  async 'delete-song'(el) {
    const id = el.closest('.song').dataset.id, s = songById(id);
    if (!await confirmDialog({ title: `Remove “${s.title}”?`, body: 'It comes off the playlist for both of you, along with its notes and tears.', confirm: 'Remove song' })) return;
    try {
      await api('DELETE', `/api/songs/${id}`);
      S.data.songs = S.data.songs.filter(x => x.id !== id);
      S.open.delete(id);
      if (S.data.songs.length) { renderList(); renderToolbar(); refreshCounts(); } else renderPlaylist();
      toast('Removed.');
      refreshSidebarSoon();
    } catch (e) { toast(e.message, 'err'); }
  },
  play(el) {
    const li = el.closest('.song');
    S.playing.add(li.dataset.id);
    el.closest('.player').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${el.dataset.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="YouTube player"></iframe>`;
  },
  'f-status'(el) { S.filters.status = el.dataset.v; renderToolbar(); renderList(); },
  'f-by'(el) { S.filters.by = el.dataset.v; renderToolbar(); renderList(); },
  'f-tag'(el) {
    const t = el.dataset.v, f = S.filters.tags;
    f.has(t) ? f.delete(t) : f.add(t);
    renderToolbar(); renderList();
  },
  'f-clear'() { S.filters = { status: 'all', by: 'all', tags: new Set(), q: '' }; renderToolbar(); renderList(); },
  'open-song'(el) { S.focusSong = el.dataset.id; S.open.add(el.dataset.id); location.hash = `#/p/${el.dataset.pl}`; },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || !actions[el.dataset.action]) return;
  if (el.tagName === 'BUTTON' || el.dataset.action !== 'toggle') e.stopPropagation();
  actions[el.dataset.action](el, e);
});

document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.filters.q = e.target.value; renderList(); refreshClear(); }
  const nid = e.target.dataset?.notes;
  if (nid) {
    const s = songById(nid); if (!s) return;
    s.notes = e.target.value;
    const tag = e.target.closest('.d-sec')?.querySelector('[data-saved]');
    if (tag) { tag.textContent = 'Saving…'; tag.classList.remove('ok'); }
    saveNotes(nid, e.target);
  }
});
function refreshClear() {
  const row = $('.tags-row'); if (!row) return;
  const has = !!$('.clear-f', row);
  if (filtersActive() && !has) row.insertAdjacentHTML('beforeend', `<button class="clear-f" data-action="f-clear">Clear filters</button>`);
  if (!filtersActive() && has) $('.clear-f', row).remove();
}

document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (e.key === 'Escape') {
    if (S.layers.length) { closeLayer(); return; }
    if ($('#shell.drawer')) { actions.drawer(); return; }
    if (typing) document.activeElement.blur();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && S.layers.length) { e.preventDefault(); S.layers[S.layers.length - 1].submit?.(); return; }
  if (e.key === 'Enter' && e.target.classList?.contains('fv')) { e.target.click(); return; }
  if (typing || S.layers.length || e.metaKey || e.ctrlKey || e.altKey || !S.me) return;
  if (e.key === '/' && $('#q')) { e.preventDefault(); $('#q').focus(); }
  else if ((e.key === 'n' || e.key === 'N') && S.route.name === 'playlist' && S.data) { e.preventDefault(); songSheet(null); }
});

window.addEventListener('hashchange', () => { if (S.me) go(); });

/* ── gentle sync: pick up the other person's changes ──────── */
async function sync() {
  if (!S.me || document.hidden || S.layers.length || S.dragging) return;
  if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
  try {
    if (S.route.name === 'playlist' && S.data) {
      const fresh = await api('GET', `/api/playlists/${S.data.playlist.id}`);
      if (JSON.stringify(fresh) === JSON.stringify(S.data)) return;
      if ($('.player iframe')) {
        // a player is live — update songs in place, leave structure alone
        const sameShape = fresh.songs.map(s => s.id).join() === S.data.songs.map(s => s.id).join();
        if (!sameShape) return;
        S.data = fresh;
        fresh.songs.forEach(s => refreshSong(s.id));
      } else {
        const y = window.scrollY;
        S.data = fresh; renderPlaylist(); window.scrollTo(0, y);
      }
    } else if (S.route.name === 'home') {
      const fresh = await api('GET', '/api/playlists');
      if (JSON.stringify(fresh) === JSON.stringify(S.playlists)) return;
      S.playlists = fresh; $('#main').innerHTML = viewHome(); renderSidebar();
    }
  } catch { /* offline for a moment */ }
}
setInterval(sync, 15000);
window.addEventListener('focus', sync);

/* ── boot ─────────────────────────────────────────────────── */
if (S.me) { renderShell(); go(); } else renderGate();
