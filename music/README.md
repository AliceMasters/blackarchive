# Elegy (`/music`)

A private listening room inside the Black Library, where Alice and Tracy co-curate playlists of songs that undo them.

The site has no link to it on purpose. You get there by typing `/music/` after the site address. The page also tells search engines not to index it (`noindex`).

## Features

- **Playlists**: each has a title and a brief, meaning what every song has to do to earn its place.
- **Songs**: paste a YouTube or Spotify link and the title, artist and artwork fill in automatically. Each song has an embedded player.
- **Why it hits**: per-song notes that save as you type.
- **Tags**: mortality, regret, aging, loneliness, sacrifice, connection, grief, exhaustion, hope, heartbreak. You can filter by them.
- **Cry meter**: each person rates every song *dry-eyed*, *almost* or *cried*. You can only set your own. A "cried" song becomes a **Forever** favourite and shows up on the Forever page.
- **Shortlist / Approved** status, drag-and-drop ordering, search, and an added-by filter.
- **Export**: a text list with links, either detailed or links only. You can copy it or download it as a `.txt` file.
- **Light sync**: each screen picks up the other person's changes every 15 seconds.

## Identity

There are no accounts. The first screen asks *Alice* or *Tracy*, and the choice is remembered on that device. Requests carry an `x-listener` header, and the server refuses changes without one.

## How it's wired

| File | Role |
| --- | --- |
| `router.js` | Express router with the API and static files, mounted at `/music` by the main `server.js` |
| `db.js` | Built-in `node:sqlite`. Stored at `$DATA_DIR/elegy.db`, which is the same Railway volume as the Black Library |
| `public/` | Single-page app: `index.html`, `app.css`, `app.js`. Vanilla JS with SortableJS from cdnjs |

Elegy's routes come before the Black Library's session and auth middleware, so the two apps don't interact.

### API

```
GET    /music/api/playlists              list with counts + cover thumbs
POST   /music/api/playlists              { title, brief }
GET    /music/api/playlists/:id          playlist + songs
PATCH  /music/api/playlists/:id          { title?, brief? }
DELETE /music/api/playlists/:id
PUT    /music/api/playlists/:id/order    { ids: [...] }
POST   /music/api/playlists/:id/songs    { title, artist, url, tags, notes, status, cry }
PATCH  /music/api/songs/:id              any of the above (cry = your own)
DELETE /music/api/songs/:id
GET    /music/api/forever                every song someone cried to
GET    /music/api/meta?url=              YouTube / Spotify title + artist lookup
```

## Not yet

- Automated tests (parked)
