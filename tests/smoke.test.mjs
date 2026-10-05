// End-to-end smoke tests: boot the real server against a throwaway data
// directory, then exercise auth, access control, and the /music room over HTTP.
// Run with `npm test`. Uses only Node built-ins.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN = { codename: 'K-M', passphrase: 'smoke-test-only' };

let server, dataDir, cookie = '';

async function req(path, { method = 'GET', body, headers = {}, auth = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(auth && cookie ? { cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { /* html or empty */ }
  return { status: res.status, headers: res.headers, text, json };
}

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'black-library-smoke-'));
  server = spawn(process.execPath, ['--no-warnings', 'server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir,
      SESSION_SECRET: 'smoke', ADMIN_NAME: ADMIN.codename, ADMIN_PASS: ADMIN.passphrase },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', d => { log += d; });
  server.stderr.on('data', d => { log += d; });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${BASE}/api/auth/me`)).ok) return; } catch { /* not up yet */ }
    if (server.exitCode !== null) break;
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error(`server did not start:\n${log}`);
});

after(() => {
  server?.kill();
  // sql.js flushes on a timer; give Windows a moment to release the file.
  try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* temp dir */ }
});

// ── the Black Library ─────────────────────────────────────────
test('health check reports no session when signed out', async () => {
  const r = await req('/api/auth/me');
  assert.equal(r.status, 200);
  assert.equal(r.json.codename, null);
});

test('protected routes reject anonymous requests', async () => {
  for (const path of ['/api/library', '/api/hall', '/api/souls', '/api/admin/users']) {
    assert.equal((await req(path)).status, 401, path);
  }
});

test('bad credentials are refused', async () => {
  const r = await req('/api/auth/login', { method: 'POST', body: { codename: ADMIN.codename, passphrase: 'nope' } });
  assert.equal(r.status, 401);
});

test('curator bootstrap: ADMIN_PASS creates a working admin account', async () => {
  const r = await req('/api/auth/login', { method: 'POST', body: ADMIN });
  assert.equal(r.status, 200);
  assert.equal(r.json.is_admin, true);
  cookie = r.headers.get('set-cookie').split(';')[0];
  const me = await req('/api/auth/me', { auth: true });
  assert.equal(me.json.codename, ADMIN.codename);
});

test('signed-in curator can load the Hall, library, and admin desk', async () => {
  for (const path of ['/api/hall', '/api/library', '/api/souls', '/api/admin/users']) {
    assert.equal((await req(path, { auth: true })).status, 200, path);
  }
});

test('boot seeders populate the Index of Souls', async () => {
  const r = await req('/api/souls', { auth: true });
  const list = Array.isArray(r.json) ? r.json : r.json.souls;
  assert.ok(list.length > 0, 'expected seeded souls');
});

test('the main site never links to the hidden music room', async () => {
  const home = await req('/');
  assert.equal(home.status, 200);
  assert.doesNotMatch(home.text, /\/music|elegy/i);
});

// ── Elegy (/music) ───────────────────────────────────────────
test('/music redirects to its trailing-slash form and serves the app', async () => {
  const r = await req('/music');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), '/music/');
  const page = await req('/music/');
  assert.equal(page.status, 200);
  assert.match(page.text, /<title>Elegy<\/title>/);
  assert.match(page.headers.get('x-robots-tag'), /noindex/);
});

test('/music writes require a listener', async () => {
  const r = await req('/music/api/playlists', { method: 'POST', body: { title: 'x' } });
  assert.equal(r.status, 400);
});

test('/music full song lifecycle: playlist → song → cry → forever → delete', async () => {
  const alice = { 'x-listener': 'alice' }, tracy = { 'x-listener': 'tracy' };

  const pl = await req('/music/api/playlists', { method: 'POST', headers: alice,
    body: { title: 'Smoke', brief: 'test brief' } });
  assert.equal(pl.status, 201);

  const song = await req(`/music/api/playlists/${pl.json.id}/songs`, { method: 'POST', headers: tracy,
    body: { title: 'Hurt', artist: 'Johnny Cash', url: 'https://youtu.be/8AHCfZTRGiI',
      tags: ['mortality', 'not-a-tag'], cry: 'almost' } });
  assert.equal(song.status, 201);
  assert.deepEqual(song.json.tags, ['mortality'], 'unknown tags are dropped');
  assert.deepEqual(song.json.cry, { alice: 'none', tracy: 'almost' });
  assert.match(song.json.thumb, /i\.ytimg\.com\/vi\/8AHCfZTRGiI/);

  // Each person can only set their own cry meter.
  const cried = await req(`/music/api/songs/${song.json.id}`, { method: 'PATCH', headers: alice, body: { cry: 'cried' } });
  assert.deepEqual(cried.json.cry, { alice: 'cried', tracy: 'almost' });

  const forever = await req('/music/api/forever');
  assert.ok(forever.json.some(s => s.id === song.json.id), 'cried song appears in Forever');

  const del = await req(`/music/api/playlists/${pl.json.id}`, { method: 'DELETE', headers: alice });
  assert.equal(del.status, 200);
  assert.equal((await req(`/music/api/playlists/${pl.json.id}`)).status, 404);
  assert.ok(!(await req('/music/api/forever')).json.some(s => s.id === song.json.id), 'songs cascade');
});
