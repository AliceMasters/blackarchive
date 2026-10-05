'use strict';

// Node's built-in SQLite — a real file on disk, no native build, no extra deps.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Shares the Black Library's data directory (the Railway volume in production).
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'elegy.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS playlists (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    brief       TEXT NOT NULL DEFAULT '',
    created_by  TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS songs (
    id           TEXT PRIMARY KEY,
    playlist_id  TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    artist       TEXT NOT NULL DEFAULT '',
    url          TEXT NOT NULL DEFAULT '',
    thumb        TEXT NOT NULL DEFAULT '',
    notes        TEXT NOT NULL DEFAULT '',
    tags         TEXT NOT NULL DEFAULT '[]',
    status       TEXT NOT NULL DEFAULT 'shortlist',
    cry_alice    TEXT NOT NULL DEFAULT 'none',
    cry_tracy    TEXT NOT NULL DEFAULT 'none',
    position     INTEGER NOT NULL DEFAULT 0,
    added_by     TEXT NOT NULL,
    added_at     INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS songs_by_playlist ON songs(playlist_id, position);
`);

function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

module.exports = { db, tx };
