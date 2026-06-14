# ChromaDB Dashboard — Design Spec

## Overview

Lightweight ChromaDB admin dashboard using Bun, HTMX, Hono, daisyUI, and the official ChromaDB TypeScript SDK. Provides collection management, record browsing, and text query capabilities.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Hono (JSX templates)
- **Frontend:** HTMX + daisyUI (Tailwind CSS v4)
- **Database Client:** `chromadb` (official TS SDK)
- **Theme:** daisyUI `dracula` (dark default), stored in `sessionStorage`

## Project Structure

```
chromadb-dashboard/
├── src/
│   ├── main.ts              — Hono server entry, port 4000
│   ├── chroma/
│   │   └── client.ts        — ChromaClient singleton, .env config
│   ├── routes/
│   │   └── pages.tsx        — All HTMX routes
│   ├── templates/
│   │   ├── layout.tsx       — HTML shell, head, scripts
│   │   ├── app.tsx          — Drawer layout + sidebar nav + theme toggle
│   │   ├── collections.tsx  — Collection list page
│   │   ├── records.tsx      — Collection record table w/ pagination
│   │   └── query.tsx        — Query form + results
├── static/
│   ├── htmx.min.js          — HTMX library
│   └── app.js               — Theme toggle, confirm dialogs
├── .env.example             — CHROMA_URL template
├── .env                     — (gitignored) user credentials
├── package.json
├── tsconfig.json
└── build-css.sh             — Tailwind CLI build script
```

## Routes

| Method | Path | HTMX? | Description |
|--------|------|-------|-------------|
| GET | `/` | No | Full page: collection list |
| GET | `/collections/:name` | Yes | Records table with pagination (`?page=N`) |
| POST | `/collections/:name/query` | Yes | Execute text query, show results |
| DELETE | `/collections/:name/records/:id` | Yes | Delete single record |
| DELETE | `/collections/:name` | Yes | Delete entire collection |
| GET | `/collections/:name/rename` | Yes | Show rename form |
| POST | `/collections/:name/rename` | Yes | Submit rename |

## ChromaDB Client

Connects via `CHROMA_URL` env var (default: `http://localhost:8000`). Supports:

- `listCollections()` — get all collections
- `getCollection({name}).count()` — record count
- `getCollection({name}).get({limit, offset, include})` — paginated records
- `getCollection({name}).query({queryTexts, nResults, include})` — text query
- `getCollection({name}).delete({ids})` — delete record
- `client.deleteCollection({name})` — delete collection

## HTMX Patterns (Basho-aligned)

- **Full page load:** `Layout > App > Page` — renders complete HTML
- **HTMX nav:** `hx-get`, `hx-target="#content"`, `hx-push-url="true"`, `hx-swap="innerHTML"`
- **OOB updates:** return `hx-swap-oob="innerHTML"` for `<title id="page-title">` alongside content swap
- **No SSE** needed — query-based interactions only

## Theme

- Default: `dracula` (dark)
- Toggle via button in navbar → `sessionStorage.setItem('chromadb-theme', theme)`
- JS reads `sessionStorage` on load, applies `data-theme` attribute
- Pattern copied from Basho's `handlers.js`

## .env Configuration

```env
CHROMA_URL=http://localhost:8000
```

No UI for credentials — user sets `.env` file directly.

## Build

```sh
# Compile CSS once
./build-css.sh

# Run
bun start          # bun src/main.ts

# Dev
bun --hot src/main.ts
```

CSS built with `@tailwindcss/cli`: `npx @tailwindcss/cli -i src/templates/app.css -o static/style.css`

## OOB Rendering Fix

When HTMX request: return content fragment + `hx-swap-oob="innerHTML"` element for page title in one response. No orphaned OOB elements — every OOB target must exist in the DOM already (from the initial page load).
