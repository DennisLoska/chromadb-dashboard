# ChromaDB Dashboard

Web UI for browsing and searching ChromaDB collections. Bun + Hono + HTMX + daisyUI.

## Quick Start

```bash
cp .env.example .env      # configure connection
bun install               # install deps
bun run build:css         # build tailwind + daisyui
bun start                 # open http://localhost:4000
```

## Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `CHROMA_URL` | `http://localhost:8000` | ChromaDB server address |
| `EMBEDDING_API_URL` | _(optional)_ | OpenAI-compatible embedding API (LM Studio, vLLM, OpenAI) |
| `EMBEDDING_MODEL` | _(optional)_ | Model name for embedding API |

**Embeddings:** For text search to work, set `EMBEDDING_API_URL` + `EMBEDDING_MODEL` to an OpenAI-compatible endpoint that matches your collection's embedding dimension. Falls back to built-in 384-dim embedding function when unset.

## Features

- Browse collections with record count
- Paginated record viewer with resizable columns
- Similarity search via text query
- Record detail modal with copy-to-clipboard
- Delete records inline
- Dark/light theme toggle (persisted in sessionStorage)

## Project Structure

```
src/
  chroma/client.ts    — ChromaDB client + embedding wrapper
  routes/pages.tsx    — Hono route handlers
  templates/          — JSX templates (layout, collections, records, query)
static/
  app.js             — client-side JS (theme, column resize, modals, copy)
  style.css          — built Tailwind + daisyUI CSS
```

## Scripts

| Command | Description |
|---|---|
| `bun start` | Start production server on port 4000 |
| `bun run dev` | Start with hot-reload (`bun --hot`) |
| `bun run build:css` | Rebuild Tailwind + daisyUI CSS |

Built with [Bun](https://bun.sh), [Hono](https://hono.dev), [HTMX](https://htmx.org), [daisyUI](https://daisyui.com), and [ChromaDB](https://www.trychroma.com/).
