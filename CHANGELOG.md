# 📜 Patch Notes: The Black Library

*What is known is never lost, and neither is what changed.*

Each patch below covers one release day. Hashes link to the commits.

---

## Patch 2.3: *"Under Test"*
**October 5, 2026**

**✨ New**
- An unlisted room has been added. It's reachable only by those who know the way, and the site never links to it. ([`d14b771`](https://github.com/AliceMasters/blackarchive/commit/d14b771))

**🛡️ Quality**
- **End-to-end smoke suite.** It starts the real server against a throwaway database and tests sign-in, rejection of signed-out requests, wrong passwords, admin account setup, startup content and every main area of the site over HTTP. Run it with `npm test`. ([`8458829`](https://github.com/AliceMasters/blackarchive/commit/8458829))
- **Privacy regression test.** The public page is checked on every run to make sure it never mentions the unlisted room. ([`8458829`](https://github.com/AliceMasters/blackarchive/commit/8458829))
- **CI is online for the first time:** a syntax check and the full suite on Node 22 and 24, on every push. ([`3c04047`](https://github.com/AliceMasters/blackarchive/commit/3c04047))

**🔧 Changes**
- The server's Node version goes from 20 to 24.
- **Fixed:** `engines.node` claimed Node 18 was supported, but the database layer needs Node 22.13 or newer.

**📖 Docs**
- The README is now a project showcase, with screenshots of the Hall, the reader and the Index of Souls, plus a Quality section. ([`3deada3`](https://github.com/AliceMasters/blackarchive/commit/3deada3), [`bc4d18f`](https://github.com/AliceMasters/blackarchive/commit/bc4d18f))
- **Fixed:** the README promised a backups folder that never existed. Backups are now listed honestly as a known gap. ([`d289aa0`](https://github.com/AliceMasters/blackarchive/commit/d289aa0))

---

## Patch 2.2.1: *"Housekeeping"*
**October 3, 2026**
- Added `.editorconfig` so formatting stays consistent across editors. ([`b85e543`](https://github.com/AliceMasters/blackarchive/commit/b85e543))

---

## Patch 2.2: *"The Record Grows"*
**July 22–23, 2026**

**✨ New**
- **The Hall:** a new landing page after sign-in. Each section card shows a peek at its latest activity and links through to the rest. ([`83d2e1a`](https://github.com/AliceMasters/blackarchive/commit/83d2e1a))
- **Index of Souls:** a shared dossier for every character the House has met. ([`83d2e1a`](https://github.com/AliceMasters/blackarchive/commit/83d2e1a))
- **The Boards:** the in-character Notice Board (writs tagged SEEK / WATCH / VERIFY) and the out-of-character Antechamber. ([`3b7b72f`](https://github.com/AliceMasters/blackarchive/commit/3b7b72f))
- **Scribe's tools:** insert buttons for sections, breaks and lists, a "Marks" cheatsheet, and a live preview that matches the reader exactly. ([`3b7b72f`](https://github.com/AliceMasters/blackarchive/commit/3b7b72f))
- Reader: `##` section headings and `---` ornamental breaks. ([`bea7037`](https://github.com/AliceMasters/blackarchive/commit/bea7037))
- *The Princes of Oblivion*, a curator's reference text, added to the Master Archive. ([`6809f42`](https://github.com/AliceMasters/blackarchive/commit/6809f42), [`bea7037`](https://github.com/AliceMasters/blackarchive/commit/bea7037))

**🔧 Changes**
- Soul records are now editable by any member, with Hold, Organizations and Profession fields. ([`ce35027`](https://github.com/AliceMasters/blackarchive/commit/ce35027))
- Groundwork tables were added for linking souls to the reports that mention them. ([`d053874`](https://github.com/AliceMasters/blackarchive/commit/d053874))

---

## Patch 2.1: *"Catchment"*
**July 19, 2026**
- Added a seeded Temple Watch account and its first incident report, *The Ma'jirr Catchment*, waiting for the curator to adopt it. ([`a056bc7`](https://github.com/AliceMasters/blackarchive/commit/a056bc7))

---

## Patch 2.0: *"Behind Closed Doors"*
**July 12, 2026**

**✨ New**
- **Invite-only access.** Self-registration has been removed, and the curator now issues every account. ([`1e90aa5`](https://github.com/AliceMasters/blackarchive/commit/1e90aa5))
- **Per-member libraries:** each member sees what they wrote and what they've been lent. ([`1e90aa5`](https://github.com/AliceMasters/blackarchive/commit/1e90aa5))
- **The Master Archive:** the curator adopts members' works, then checks copies out to others. ([`aed6050`](https://github.com/AliceMasters/blackarchive/commit/aed6050))
- Curator tools for account deletion and password resets. ([`8ce2e4f`](https://github.com/AliceMasters/blackarchive/commit/8ce2e4f))
- A "Not Adopted" section in the library. ([`611a479`](https://github.com/AliceMasters/blackarchive/commit/611a479))

**🎨 Polish**
- Two legibility passes: book titles moved off blackletter, greys brightened, higher contrast throughout, and a title sheen and glitter added to covers. ([`9d983bb`](https://github.com/AliceMasters/blackarchive/commit/9d983bb), [`64b1209`](https://github.com/AliceMasters/blackarchive/commit/64b1209))

**⏪ Reverted**
- An experimental re-theme into *The Arcanaeum* and a public book catalogue were tried, then rolled back so the Black Library keeps its own identity. ([`5117557`](https://github.com/AliceMasters/blackarchive/commit/5117557), [`c0c4f39`](https://github.com/AliceMasters/blackarchive/commit/c0c4f39) → [`45de9cf`](https://github.com/AliceMasters/blackarchive/commit/45de9cf))

---

## Patch 1.0: *"First Light"*
**July 4, 2026**

**✨ Launch**
- The Black Library opens: tomes and parchments, a page-turning reader with true text pagination, and permanent share links. ([`b174cf5`](https://github.com/AliceMasters/blackarchive/commit/b174cf5), [`758ec89`](https://github.com/AliceMasters/blackarchive/commit/758ec89))
- A reusable library seeder and curated starter content. ([`0b3d8b7`](https://github.com/AliceMasters/blackarchive/commit/0b3d8b7))

**🐛 Fixes**
- The reader's page counter showed `[object Object]` when a book was opened. ([`924557c`](https://github.com/AliceMasters/blackarchive/commit/924557c))
- Pages leaked below the book in the reader. It now clips correctly and starts up more reliably. ([`9ddb43a`](https://github.com/AliceMasters/blackarchive/commit/9ddb43a))
- Removed the auto-seeded placeholder account. ([`ec23c0b`](https://github.com/AliceMasters/blackarchive/commit/ec23c0b))

**📖 Docs**
- Documented the persistent-volume requirement. Without it, every deploy wipes the database. ([`4030cc3`](https://github.com/AliceMasters/blackarchive/commit/4030cc3))
