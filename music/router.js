'use strict';

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { db, tx } = require('./db');

const PEOPLE = ['alice', 'tracy'];
const TAGS = ['mortality', 'regret', 'aging', 'loneliness', 'sacrifice',
  'connection', 'grief', 'exhaustion', 'hope', 'heartbreak'];
const CRY = ['none', 'almost', 'cried'];
const STATUS = ['shortlist', 'approved'];

// Elegy lives under /music. Everything below is handled inside this router.
const app = express.Router();
app.use(express.json({ limit: '256kb' }));
app.use((req, res, next) => { res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });

// ── helpers ────────────────────────────────────────────────
const now = () => Date.now();
const uid = () => crypto.randomUUID();
const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function listener(req, res) {
  const who = String(req.get('x-listener') || '').toLowerCase();
  if (!PEOPLE.includes(who)) { res.status(400).json({ error: 'Pick who you are first.' }); return null; }
  return who;
}

function youtubeId(url) {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}
function spotifyId(url) {
  const m = String(url).match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]+)/i);
  return m ? m[1] : null;
}
function thumbFor(song) {
  const yt = youtubeId(song.url);
  return yt ? `https://i.ytimg.com/vi/${yt}/mqdefault.jpg` : (song.thumb || '');
}

function shapeSong(r) {
  return {
    id: r.id, playlistId: r.playlist_id, title: r.title, artist: r.artist,
    url: r.url, thumb: thumbFor(r), notes: r.notes, tags: JSON.parse(r.tags || '[]'),
    status: r.status, cry: { alice: r.cry_alice, tracy: r.cry_tracy },
    position: r.position, addedBy: r.added_by, addedAt: r.added_at, updatedAt: r.updated_at,
    ...(r.playlist_title !== undefined ? { playlistTitle: r.playlist_title } : {}),
  };
}
function shapePlaylist(p) {
  return { id: p.id, title: p.title, brief: p.brief, createdBy: p.created_by,
    createdAt: p.created_at, updatedAt: p.updated_at };
}

const q = {
  playlists: db.prepare('SELECT * FROM playlists ORDER BY updated_at DESC'),
  playlist: db.prepare('SELECT * FROM playlists WHERE id = ?'),
  songsOf: db.prepare('SELECT * FROM songs WHERE playlist_id = ? ORDER BY position, added_at'),
  song: db.prepare('SELECT * FROM songs WHERE id = ?'),
  stats: db.prepare(`SELECT playlist_id,
      COUNT(*) AS songs,
      SUM(status = 'approved') AS approved,
      SUM(status = 'shortlist') AS shortlist,
      SUM(cry_alice = 'cried' OR cry_tracy = 'cried') AS forever,
      SUM(cry_alice != 'none') + SUM(cry_tracy != 'none') AS tears
    FROM songs GROUP BY playlist_id`),
  maxPos: db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM songs WHERE playlist_id = ?'),
  touch: db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?'),
  forever: db.prepare(`SELECT s.*, p.title AS playlist_title FROM songs s
    JOIN playlists p ON p.id = s.playlist_id
    WHERE s.cry_alice = 'cried' OR s.cry_tracy = 'cried'
    ORDER BY s.updated_at DESC`),
};

// ── playlists ──────────────────────────────────────────────
app.get('/api/playlists', (req, res) => {
  const stats = Object.fromEntries(q.stats.all().map(s => [s.playlist_id, s]));
  const out = q.playlists.all().map(p => {
    const s = stats[p.id] || {};
    const songs = q.songsOf.all(p.id);
    return {
      ...shapePlaylist(p),
      counts: { songs: s.songs || 0, approved: s.approved || 0, shortlist: s.shortlist || 0,
        forever: s.forever || 0, tears: s.tears || 0 },
      covers: songs.map(thumbFor).filter(Boolean).slice(0, 4),
      contributors: [...new Set(songs.map(x => x.added_by).concat(p.created_by))],
    };
  });
  res.json(out);
});

app.post('/api/playlists', (req, res) => {
  const who = listener(req, res); if (!who) return;
  const title = str(req.body.title, 120);
  if (!title) return res.status(400).json({ error: 'A playlist needs a title.' });
  const id = uid(), t = now();
  db.prepare('INSERT INTO playlists (id, title, brief, created_by, created_at, updated_at) VALUES (?,?,?,?,?,?)')
    .run(id, title, str(req.body.brief, 4000), who, t, t);
  res.status(201).json(shapePlaylist(q.playlist.get(id)));
});

app.get('/api/playlists/:id', (req, res) => {
  const p = q.playlist.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Playlist not found.' });
  res.json({ playlist: shapePlaylist(p), songs: q.songsOf.all(p.id).map(shapeSong) });
});

app.patch('/api/playlists/:id', (req, res) => {
  const who = listener(req, res); if (!who) return;
  const p = q.playlist.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Playlist not found.' });
  const title = req.body.title !== undefined ? str(req.body.title, 120) : p.title;
  if (!title) return res.status(400).json({ error: 'A playlist needs a title.' });
  const brief = req.body.brief !== undefined ? str(req.body.brief, 4000) : p.brief;
  db.prepare('UPDATE playlists SET title = ?, brief = ?, updated_at = ? WHERE id = ?').run(title, brief, now(), p.id);
  res.json(shapePlaylist(q.playlist.get(p.id)));
});

app.delete('/api/playlists/:id', (req, res) => {
  const who = listener(req, res); if (!who) return;
  tx(() => {
    db.prepare('DELETE FROM songs WHERE playlist_id = ?').run(req.params.id);
    db.prepare('DELETE FROM playlists WHERE id = ?').run(req.params.id);
  });
  res.json({ ok: true });
});

app.put('/api/playlists/:id/order', (req, res) => {
  const who = listener(req, res); if (!who) return;
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const set = db.prepare('UPDATE songs SET position = ? WHERE id = ? AND playlist_id = ?');
  tx(() => { ids.forEach((id, i) => set.run(i, String(id), req.params.id)); q.touch.run(now(), req.params.id); });
  res.json({ ok: true });
});

// ── songs ──────────────────────────────────────────────────
function cleanTags(v) { return Array.isArray(v) ? [...new Set(v.filter(t => TAGS.includes(t)))] : []; }

app.post('/api/playlists/:id/songs', (req, res) => {
  const who = listener(req, res); if (!who) return;
  const p = q.playlist.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Playlist not found.' });
  const b = req.body, title = str(b.title, 200);
  if (!title) return res.status(400).json({ error: 'A song needs a title.' });
  const id = uid(), t = now();
  const cry = { alice: 'none', tracy: 'none' };
  if (CRY.includes(b.cry)) cry[who] = b.cry;
  db.prepare(`INSERT INTO songs (id, playlist_id, title, artist, url, thumb, notes, tags, status,
      cry_alice, cry_tracy, position, added_by, added_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, p.id, title, str(b.artist, 200), str(b.url, 500), str(b.thumb, 500), str(b.notes, 8000),
      JSON.stringify(cleanTags(b.tags)), STATUS.includes(b.status) ? b.status : 'shortlist',
      cry.alice, cry.tracy, q.maxPos.get(p.id).m + 1, who, t, t);
  q.touch.run(t, p.id);
  res.status(201).json(shapeSong(q.song.get(id)));
});

app.patch('/api/songs/:id', (req, res) => {
  const who = listener(req, res); if (!who) return;
  const s = q.song.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Song not found.' });
  const b = req.body, f = {};
  if (b.title !== undefined) { f.title = str(b.title, 200); if (!f.title) return res.status(400).json({ error: 'A song needs a title.' }); }
  if (b.artist !== undefined) f.artist = str(b.artist, 200);
  if (b.url !== undefined) f.url = str(b.url, 500);
  if (b.thumb !== undefined) f.thumb = str(b.thumb, 500);
  if (b.notes !== undefined) f.notes = str(b.notes, 8000);
  if (b.tags !== undefined) f.tags = JSON.stringify(cleanTags(b.tags));
  if (STATUS.includes(b.status)) f.status = b.status;
  // You can only speak for your own tears.
  if (CRY.includes(b.cry)) f[`cry_${who}`] = b.cry;
  const keys = Object.keys(f);
  if (keys.length) {
    const t = now();
    db.prepare(`UPDATE songs SET ${keys.map(k => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
      .run(...keys.map(k => f[k]), t, s.id);
    q.touch.run(t, s.playlist_id);
  }
  res.json(shapeSong(q.song.get(s.id)));
});

app.delete('/api/songs/:id', (req, res) => {
  const who = listener(req, res); if (!who) return;
  db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/forever', (req, res) => res.json(q.forever.all().map(shapeSong)));

// ── link metadata (YouTube / Spotify oEmbed) ───────────────
function tidyYouTube(rawTitle = '', author = '') {
  let title = rawTitle
    .replace(/\s*[([][^)\]]*(official|lyric|audio|video|visuali[sz]er|\bhd\b|4k|remaster|\bmv\b)[^)\]]*[)\]]/gi, '')
    .replace(/\s+/g, ' ').trim();
  let artist = author.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').replace(/\s*Official$/i, '').trim();
  const m = title.match(/^(.+?)\s+[-–—|]\s+(.+)$/);
  if (m) { artist = m[1].trim(); title = m[2].trim(); }
  title = title.replace(/^["'“‘]+|["'”’]+$/g, '').trim();
  return { title, artist };
}

app.get('/api/meta', async (req, res) => {
  const url = str(req.query.url, 500);
  const yt = youtubeId(url), sp = spotifyId(url);
  try {
    if (yt) {
      const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${yt}`)}`,
        { signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error('oembed');
      const j = await r.json();
      return res.json({ platform: 'youtube', ...tidyYouTube(j.title, j.author_name),
        thumb: `https://i.ytimg.com/vi/${yt}/mqdefault.jpg` });
    }
    if (sp) {
      const r = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${sp}`)}`,
        { signal: AbortSignal.timeout(6000) });
      const j = r.ok ? await r.json() : {};
      let artist = '';
      try {
        const html = await (await fetch(`https://open.spotify.com/track/${sp}`,
          { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Elegy/1.0)' } })).text();
        const og = html.match(/<meta property="og:description" content="([^"]+)"/);
        if (og) artist = og[1].split(' · ')[0].replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'");
      } catch { /* artist stays blank */ }
      return res.json({ platform: 'spotify', title: j.title || '', artist, thumb: j.thumbnail_url || '' });
    }
    res.json({ platform: null });
  } catch {
    res.json({ platform: yt ? 'youtube' : sp ? 'spotify' : null, title: '', artist: '',
      thumb: yt ? `https://i.ytimg.com/vi/${yt}/mqdefault.jpg` : '' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ── static app ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, file) => { if (file.endsWith('.html')) res.set('Cache-Control', 'no-cache'); },
}));
app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

module.exports = function mount(parent, base = '/music') {
  parent.use(base, (req, res, next) => {
    // Relative asset/API URLs need the trailing slash.
    if (req.originalUrl.split('?')[0] === base) return res.redirect(301, base + '/');
    next();
  }, app);
};
