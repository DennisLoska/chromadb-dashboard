# ChromaDB Dashboard

Web UI for browsing and searching ChromaDB collections. View records, run similarity searches, and manage collection data.

<img width="2560" height="1440" alt="screenshot-2026-06-14_16-39-18" src="https://github.com/user-attachments/assets/95df53f3-6b9e-412d-afc8-d1bbc69a8770" />

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Hono](https://hono.dev) |
| Frontend | [HTMX](https://htmx.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [DaisyUI 5](https://daisyui.com) |
| Templates | Hono JSX |
| Database | [ChromaDB](https://www.trychroma.com/) |
| Bundler | Bun (native) |

## Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.2
- ChromaDB server running (default: `http://localhost:8000`)

### Installation

```bash
git clone <repo-url> chromadb-dashboard
cd chromadb-dashboard
bun install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `CHROMA_URL` | `http://localhost:8000` | ChromaDB server address |
| `EMBEDDING_API_URL` | _(optional)_ | OpenAI-compatible embedding API (LM Studio, vLLM, OpenAI) |
| `EMBEDDING_MODEL` | _(optional)_ | Model name for embedding API |

**Embeddings:** Text search requires `EMBEDDING_API_URL` + `EMBEDDING_MODEL` matching your collection's embedding dimension. Falls back to built-in 384-dim embedding when unset.

### Building CSS

The project uses Tailwind CSS v4 with DaisyUI. The CSS must be built before running:

```bash
bun run build:css
```

This compiles `src/templates/app.css` -> `static/style.css`.

### Running

```bash
# Development (hot reload)
bun run dev

# Production
bun run start
```

Server starts at **http://0.0.0.0:4000**.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun run dev` | Hot-reload development server |
| `start` | `bun run start` | Production server |
| `build:css` | `bun run build:css` | Compile Tailwind + DaisyUI into `static/style.css` |

## Environment

- **Port:** `4000` (hardcoded)
- **Host:** `0.0.0.0` (all interfaces)
- **ChromaDB:** Default `http://localhost:8000` (configurable via `CHROMA_URL`)
- **Embedding:** OpenAI-compatible API for text search queries (optional)

## Features

- **Collection Browser** — List all collections with record counts
- **Paginated Records** — Browse records with resizable columns
- **Similarity Search** — Query collections by text with semantic search
- **Record Detail** — Modal viewer with copy-to-clipboard
- **Delete Records** — Inline record removal
- **Theme Toggle** — Dark/light mode with session persistence

## Architecture

```
src/
  main.ts              -- Entry point, Hono app bootstrap on port 4000
  chroma/
    client.ts          -- ChromaDB client wrapper with embedding support
  routes/
    pages.tsx          -- Hono route handlers (collections, records, query)
  templates/
    app.css            -- Tailwind CSS source with DaisyUI
    app.tsx            -- App layout shell
    layout.tsx         -- HTML document wrapper
    collections.tsx    -- Collection list view
    records.tsx        -- Record browser with pagination
    query.tsx          -- Similarity search view
static/
  app.js               -- Client-side JS (theme, modals, column resize, copy)
  style.css            -- Built CSS (generated)
```
