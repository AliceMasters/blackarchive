# The Black Library

**An invite-only manuscript archive and records system for the House Mournstar roleplay community.**

[![CI](https://github.com/AliceMasters/blackarchive/actions/workflows/ci.yml/badge.svg)](https://github.com/AliceMasters/blackarchive/actions/workflows/ci.yml)

The Black Library is the shared record of House Mournstar, an in-character information house in a Skyrim roleplay setting. Members write and read illustrated manuscripts in a page-turning reader, keep dossiers on the people of Skyrim, and coordinate through in-character and out-of-character boards. A single curator runs the archive: they issue accounts, adopt members' work into a master archive, and lend copies back out.

| | |
|---|---|
| **Production** | https://theblacklibrary.ink |
| **Runtime** | Node.js 24 · Express 4 |
| **Storage** | SQLite (sql.js), single file on a persistent volume |
| **Hosting** | Railway (Docker build) |
| **Access** | Invite-only. No public browsing, no self-registration |

---

## Contents

- [Capabilities](#capabilities)
- [Architecture](#architecture)
- [Access model](#access-model)
- [Data model](#data-model)
- [Configuration](#configuration)
- [Operations](#operations)
- [Testing](#testing)
- [API reference](#api-reference)
- [Known limitations](#known-limitations)
- [Repository layout](#repository-layout)

---

## Capabilities

| Area | What it does |
|---|---|
| **The Hall** | Landing page after sign-in. A grid of section cards, each showing the latest activity and linking through to the full section. All of it loads in one request. |
| **The Stacks** | The manuscript library. Two formats: **tomes** (multi-entry books shown in a realistic page-flip reader with true text pagination) and **parchments** (single-sheet documents). |
| **Scribe's tools** | Every editor supports light markup: `##` section headings, `---` ornamental breaks and `-` lists. A live preview renders exactly as the reader will. |
| **Index of Souls** | A shared dossier index of characters: name, race, status, hold, organisations, profession and free-form notes. Any member can add or amend a record. |
| **The Boards** | Threaded discussion in two rooms. The **Notice Board** is in character and tags posts as `SEEK` / `WATCH` / `VERIFY` / `NOTICE`. **The Antechamber** is out of character. |
| **Curator's Desk** | The admin console: create and remove accounts, reset passphrases, adopt works into the Master Archive and check copies out to members. |
| **Sharing** | Every work has a stable link (`/?work=<id>`). Opening it requires a signed-in member who has access to that work. |

---

## Architecture

```
            Browser (single-page app, public/index.html)
                         │  JSON over HTTPS, cookie session
                         ▼
 ┌──────────────────────────── server.js (Express) ────────────────────────────┐
 │  express.json · cookie-parser · express-session                             │
 │  requireAuth / requireAdmin guards                                          │
 │  /api/auth  /api/hall  /api/library  /api/works  /api/souls  /api/board     │
 │  /api/admin/*                                                               │
 │  static public/ · SPA fallback (*)                                          │
 └──────────────────────────────────┬──────────────────────────────────────────┘
                                    ▼
             db.js: sql.js (SQLite compiled to WebAssembly)
             in-memory database, flushed to $DATA_DIR/archive.db
                                    ▼
             Railway volume mounted at /app/data
```

**Key design decisions**

- **Single-file SQLite through sql.js.** It's pure JavaScript and WebAssembly, so the build needs no native compilation. The database lives in memory and is written to disk shortly after each change (debounced to at most one write every 2 seconds). For a small, trusted community this keeps operations to one service and one file.
- **Single-page front end with no build step.** The whole client is one HTML file. What's in the repository is exactly what's served.
- **Content seeding at boot.** Reference content and lore records are applied by idempotent seeders on every start (see [Boot sequence](#boot-sequence)), so a fresh volume comes up fully populated.

---

## Access model

The archive is closed. Every API route except sign-in and session lookup requires an authenticated session.

| Role | Can do |
|---|---|
| **Member (scribe)** | Read works they wrote and works checked out to them. Create, edit and delete their own works. Read and amend the Index of Souls. Post on both boards and delete their own posts. |
| **Curator (admin)** | Everything a member can, plus: see every work, manage accounts, adopt works into or release them from the Master Archive, check works out to members, and delete any board post. |

**The Master Archive workflow:** a member writes a personal work → the curator **adopts** it into the Master Archive → the curator **checks out** copies to other members. Only adopted works can be checked out.

**Curator bootstrap.** On boot the server makes sure an admin account exists under `ADMIN_NAME` (default `K-M`). If that account exists, it is promoted to admin if it isn't already. If it doesn't exist, it is created only when `ADMIN_PASS` is set. The passphrase is reset only when `ADMIN_RESET=1` is also set.

Passphrases are hashed with bcrypt. Sessions are signed with `SESSION_SECRET` and use `httpOnly`, `sameSite=lax` cookies with a 7-day lifetime.

---

## Data model

| Table | Purpose | Key columns |
|---|---|---|
| `scribes` | Member accounts | `codename` (unique), `passphrase` (bcrypt), `is_admin` |
| `works` | Tomes and parchments | `scribe_id`, `type` (`book` \| `parchment`), `title`, `author`, `subtitle`, `meta` (JSON), `archived` (in the Master Archive) |
| `entries` | Ordered content blocks of a work | `work_id`, `position`, `title`, `date_line`, `body` |
| `holdings` | Checked-out copies | `scribe_id`, `work_id` (unique pair), `assigned_by` |
| `souls` | Index of Souls dossiers | `name`, `race`, `status`, `hold`, `organizations`, `profession`, `known` |
| `posts` | Board threads and replies | board, author, tag, parent thread |
| `mentions` | *Reserved:* links between souls and the works that cite them | — |
| `investigations` | *Reserved:* unrecorded names found in reports, kept as leads | — |

All primary keys are UUIDs. Schema changes are applied additively at startup (`CREATE TABLE IF NOT EXISTS` plus guarded `ALTER TABLE` migrations), so existing data is never rebuilt.

---

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SESSION_SECRET` | **Yes (production)** | development placeholder | Signs session cookies. Must be a long random value in production. |
| `DATA_DIR` | No | `./data` | Directory containing `archive.db`. Must be a persistent volume in production. |
| `PORT` | No | `3000` | Listen port. Railway sets this automatically. |
| `ADMIN_NAME` | No | `K-M` | Codename of the curator account. |
| `ADMIN_PASS` | First boot only | — | Creates the curator account if it doesn't exist yet. |
| `ADMIN_RESET` | No | — | Set to `1` together with `ADMIN_PASS` to rotate the curator's passphrase. |
| `PAUSE_PASS` | No | — | Passphrase for the seeded *Pause* account that owns the bundled incident report. |

In production, secrets are set as Railway service variables. `.env` is git-ignored, and `.env.example` documents the expected keys.

---

## Operations

### Running locally

```bash
npm install
cp .env.example .env      # set SESSION_SECRET; set ADMIN_PASS to bootstrap a local curator
npm run dev               # http://localhost:3000, restarts on file changes
```

Requires Node.js 22.13 or later. Production runs Node 24.

### Deployment

The service builds from the repository `Dockerfile` (`node:24-alpine`) and is configured by `railway.toml` (start command, health check on `/api/auth/me`, restart on failure).

```bash
railway up
```

After deploying, confirm the new build is serving before treating the release as done. In rare cases an upload is accepted but the new build never goes live, so check the live site rather than trusting the CLI's confirmation alone.

### Persistence

The database at `$DATA_DIR/archive.db` must sit on a persistent volume, or all data is lost on redeploy. The production service has a Railway volume mounted at `/app/data`.

> The `[[volumes]]` block in `railway.toml` documents the intended mount but does **not** create a volume. A new environment needs one attached explicitly: `railway volume add --mount-path /app/data`. Verify it with `railway volume list`.

**Backups:** there is no automated backup. Copy `archive.db` off the volume periodically, especially before schema changes.

### Boot sequence

Each start runs the following steps in order. Every seeder is idempotent and safe to re-run.

1. **Schema init and migrations** (`db.js`)
2. **Curator bootstrap**: `ensureAdmin` (see [Access model](#access-model))
3. **`scripts/report-catchment.js`**: an incident-report book plus the account that authored it
4. **`scripts/princes-textbook.js`**: *The Princes of Oblivion* reference text, attached to the curator in the Master Archive. Versioned by `SEED_VERSION`; raising it rewrites the content in place on the next deploy.
5. **`scripts/souls-seed.js`**: baseline lore records for the Index of Souls
6. **HTTP listener** starts

`scripts/seed.mjs` is a separate, older seeder that runs over HTTP. It needs to be updated for the invite-only API before it can be used again (see [Known limitations](#known-limitations)).

---

## Testing

```bash
npm test
```

`tests/smoke.test.mjs` boots the real server against a throwaway data directory and exercises it over HTTP. It uses Node's built-in test runner and needs no extra dependencies. It covers:

- session handling, anonymous rejection on protected routes, and refused credentials
- curator bootstrap from `ADMIN_PASS`, and admin access to the Hall, library, Index of Souls and Curator's Desk
- boot seeders populating the Index of Souls

GitHub Actions (`.github/workflows/ci.yml`) runs a syntax check and the suite on Node 22 and 24 for every push and pull request.

---

## API reference

Every request and response body is JSON. 🔒 = signed-in member. 👑 = curator.

**Session**

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Sign in with `{ codename, passphrase }` |
| `POST` | `/api/auth/logout` | — | End the session |
| `GET` | `/api/auth/me` | — | Current session (also the health check) |

**Library and works**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/hall` | 🔒 | Combined Hall data: recent souls, tomes, notices, roster |
| `GET` | `/api/library` | 🔒 | Works visible to the caller |
| `GET` | `/api/works/:id` | 🔒 | A work and its entries |
| `POST` | `/api/works` | 🔒 | Create a work |
| `PUT` | `/api/works/:id` | 🔒 | Update a work (owner) |
| `DELETE` | `/api/works/:id` | 🔒 | Delete a work (owner) |

**Index of Souls**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/souls` | 🔒 | List dossiers (`?q=` search) |
| `GET` | `/api/souls/:id` | 🔒 | One dossier |
| `POST` | `/api/souls` | 🔒 | Record a new soul (names are unique) |
| `PUT` | `/api/souls/:id` | 🔒 | Amend a dossier |

**Boards** (`:board` is the in-character Notice Board or the out-of-character Antechamber)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/board/:board` | 🔒 | Threads with replies |
| `POST` | `/api/board/:board` | 🔒 | Start a thread |
| `POST` | `/api/board/:board/reply` | 🔒 | Reply to a thread |
| `DELETE` | `/api/board/post/:id` | 🔒 | Delete a post (author or curator) |

**Curator's Desk**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | 👑 | List accounts |
| `POST` | `/api/admin/users` | 👑 | Create an account |
| `POST` | `/api/admin/users/:id/passphrase` | 👑 | Reset an account's passphrase |
| `DELETE` | `/api/admin/users/:id` | 👑 | Remove an account |
| `GET` | `/api/admin/users/:id/holdings` | 👑 | Works checked out to an account |
| `GET` | `/api/admin/works` | 👑 | Every work |
| `GET` | `/api/admin/archive` | 👑 | Master Archive contents |
| `GET` | `/api/admin/pending` | 👑 | Works not yet adopted |
| `POST` | `/api/admin/adopt` | 👑 | Adopt a work into the Master Archive |
| `POST` | `/api/admin/release` | 👑 | Release a work from the Master Archive |
| `POST` | `/api/admin/assign` | 👑 | Check out an archived work to a member |
| `POST` | `/api/admin/unassign` | 👑 | Return a checked-out copy |

---

## Known limitations

| Limitation | Impact | Remedy |
|---|---|---|
| Sessions are held in memory (`MemoryStore`) | Every deploy or restart signs everyone out | Move to a persistent session store backed by SQLite |
| No self-service passphrase recovery | Members who forget their passphrase need the curator to reset it | Curator reset exists; a self-service flow isn't planned |
| Writes to disk are debounced | A crash can lose up to about 2 seconds of changes | Acceptable at this scale; a native SQLite driver would remove it |
| `scripts/seed.mjs` targets the removed registration endpoint | The HTTP seeder no longer runs | Port it to `/api/admin/users`, or rely on the boot seeders |
| No automated database backups | Losing the volume means losing all data | Schedule a copy of `archive.db` to off-site storage |
| `mentions` / `investigations` aren't wired up yet | Souls aren't automatically cross-referenced from reports | Planned: scan works for known names and collect unknown names as leads |

---

## Repository layout

```
server.js            Express app: middleware, auth guards, all API routes, boot sequence
db.js                sql.js setup, schema, migrations, query helpers, persistence
public/index.html    The single-page client (UI, reader, editors, Curator's Desk)
scripts/             Boot-time seeders and the legacy HTTP seeder
tests/               End-to-end smoke tests (npm test)
.github/workflows/   CI
Dockerfile           Production image (node:24-alpine)
railway.toml         Railway build and deploy settings
.env.example         Documented configuration keys
```
