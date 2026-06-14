# ChromaDB Dashboard Implementation Plan

> **For agentic workers:** Tasks execute sequentially. Steps use checkbox syntax.

**Goal:** Build a lightweight ChromaDB admin dashboard on port 4000 with collection browsing, record pagination, and text query.

**Architecture:** Hono server with JSX templates. HTMX for SPA-like navigation (swap `#content` + OOB title). ChromaDB TS SDK configured via `.env`. daisyUI `dracula` (dark default) with sessionStorage theme toggle.

**Tech Stack:** Bun, Hono, HTMX, daisyUI/Tailwind CSS v4, chromadb (TS SDK v3.x)

---

### Task 1: Project setup — dependencies, configs, build script

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `build-css.sh`
- Create: `.env.example`

- [ ] **Step 1: Update package.json**

```json
{
  "name": "chromadb-dashboard",
  "module": "src/main.ts",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bun --hot src/main.ts",
    "build:css": "./build-css.sh",
    "start": "bun src/main.ts"
  },
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "dependencies": {
    "@tailwindcss/cli": "^4.2.2",
    "chromadb": "^3.4.3",
    "daisyui": "^5.5.19",
    "hono": "^4.12.9",
    "tailwindcss": "^4.2.2"
  }
}
```

- [ ] **Step 2: Update tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create build-css.sh**

```bash
#!/usr/bin/env bash
npx @tailwindcss/cli -i src/templates/app.css -o static/style.css
```

```bash
chmod +x build-css.sh
```

- [ ] **Step 4: Create .env.example**

```env
# ChromaDB connection
CHROMA_URL=http://localhost:8000
```

- [ ] **Step 5: Install dependencies**

Run: `bun install`

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json build-css.sh .env.example bun.lock && git commit -m "chore: project setup with deps and configs"
```

---

### Task 2: ChromaDB client wrapper

**Files:**
- Create: `src/chroma/client.ts`

- [ ] **Step 1: Create client.ts**

```typescript
import { ChromaClient, DefaultEmbeddingFunction } from "chromadb";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const PAGE_SIZE = 20;

let _client: ChromaClient | null = null;

function getClient(): ChromaClient {
  if (!_client) {
    _client = new ChromaClient({ path: CHROMA_URL });
  }
  return _client;
}

const embFn = new DefaultEmbeddingFunction();

export type ChromaCollection = {
  name: string;
  count: number;
};

export type ChromaRecord = {
  id: string;
  document: string | null;
  metadata: Record<string, unknown> | null;
  embedding: number[] | null;
  distance?: number;
};

export async function listCollections(): Promise<ChromaCollection[]> {
  const client = getClient();
  const collections = await client.listCollections();
  const result: ChromaCollection[] = [];
  for (const col of collections) {
    const c = await client.getCollection({ name: col.name, embeddingFunction: embFn });
    const count = await c.count();
    result.push({ name: col.name, count });
  }
  return result;
}

export async function getRecords(
  collectionName: string,
  page: number,
): Promise<{ records: ChromaRecord[]; total: number }> {
  const client = getClient();
  const collection = await client.getCollection({ name: collectionName, embeddingFunction: embFn });
  const total = await collection.count();
  const offset = (page - 1) * PAGE_SIZE;
  const limit = PAGE_SIZE;
  const response = await collection.get({
    limit,
    offset,
    include: ["documents", "metadatas", "embeddings"],
  });
  const records: ChromaRecord[] = response.ids.map((id, i) => ({
    id,
    document: response.documents?.[i] ?? null,
    metadata: (response.metadatas?.[i] as Record<string, unknown>) ?? null,
    embedding: (response.embeddings?.[i] as number[]) ?? null,
  }));
  return { records, total };
}

export async function queryCollection(
  collectionName: string,
  queryText: string,
  nResults = 10,
): Promise<ChromaRecord[]> {
  const client = getClient();
  const collection = await client.getCollection({ name: collectionName, embeddingFunction: embFn });
  const response = await collection.query({
    queryTexts: [queryText],
    nResults,
    include: ["documents", "metadatas", "distances"],
  });
  const ids = response.ids?.[0] ?? [];
  const docs = response.documents?.[0] ?? [];
  const metas = response.metadatas?.[0] ?? [];
  const dists = response.distances?.[0] ?? [];
  return ids.map((id, i) => ({
    id,
    document: docs?.[i] ?? null,
    metadata: (metas?.[i] as Record<string, unknown>) ?? null,
    embedding: null,
    distance: dists?.[i],
  }));
}

export async function deleteRecord(collectionName: string, recordId: string): Promise<void> {
  const client = getClient();
  const collection = await client.getCollection({ name: collectionName, embeddingFunction: embFn });
  await collection.delete({ ids: [recordId] });
}

export async function deleteCollection(collectionName: string): Promise<void> {
  const client = getClient();
  await client.deleteCollection({ name: collectionName });
}

export async function renameCollection(oldName: string, newName: string): Promise<void> {
  const client = getClient();
  const embFn = new DefaultEmbeddingFunction();
  const old = await client.getCollection({ name: oldName, embeddingFunction: embFn });
  const response = await old.get({ include: ["documents", "embeddings", "metadatas"] });
  const newCol = await client.createCollection({ name: newName, embeddingFunction: embFn });
  if (response.ids.length > 0) {
    const docs = (response.documents ?? []) as string[];
    const embs = (response.embeddings ?? []) as number[][];
    const metas = (response.metadatas ?? []) as Record<string, unknown>[];
    await newCol.add({ ids: response.ids, documents: docs, embeddings: embs, metadatas: metas });
  }
  await client.deleteCollection({ name: oldName });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/chroma/client.ts && git commit -m "feat: chromadb client wrapper"
```

---

### Task 3: CSS entry point

**Files:**
- Create: `src/templates/app.css`

- [ ] **Step 1: Create app.css**

```css
@import "tailwindcss";
@plugin "daisyui";
```

- [ ] **Step 2: Build CSS**

Run: `./build-css.sh`

- [ ] **Step 3: Commit**

```bash
git add src/templates/app.css static/style.css && git commit -m "feat: tailwind + daisyui css"
```

---

### Task 4: Layout and App templates

**Files:**
- Create: `src/templates/layout.tsx`
- Create: `src/templates/app.tsx`

- [ ] **Step 1: Create layout.tsx**

```typescript
import type { Child } from "hono/jsx";

export const Layout = ({ children }: { children: Child }) => (
  <html lang="en" data-theme="dracula">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <title id="page-title">ChromaDB Dashboard</title>
      <link href="/static/style.css" rel="stylesheet" />
      <script src="/static/htmx.min.js" />
      <script defer src="/static/app.js" />
    </head>
    <body>{children}</body>
  </html>
);
```

- [ ] **Step 2: Create app.tsx**

```typescript
import type { Child } from "hono/jsx";

interface AppProps {
  children: Child;
  title?: string;
}

export const App = ({ children, title }: AppProps) => (
  <>
    <div className="drawer lg:drawer-open min-h-screen bg-base-100">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <header className="navbar bg-base-200/80 backdrop-blur-sm px-4 shadow-sm z-10">
          <div className="flex-none">
            <label htmlFor="main-drawer" className="btn btn-ghost btn-circle btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </label>
          </div>
          <div className="flex-1">
            <h1 id="page-title" className="text-xl font-bold">
              {title ?? "ChromaDB Dashboard"}
            </h1>
          </div>
          <div className="flex-none">
            <button id="theme-toggle" className="btn btn-ghost btn-circle btn-sm" onclick="toggleTheme()">
              <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <svg id="theme-icon-moon" className="h-5 w-5 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4">
          <div id="content" className="min-h-[400px]">
            {children}
          </div>
        </main>
      </div>
      <aside className="drawer-side z-20">
        <label htmlFor="main-drawer" className="drawer-overlay" />
        <div className="bg-base-200 border-r border-base-300 flex flex-col items-start min-h-full w-64">
          <a
            href="/"
            hx-get="/"
            hx-target="#content"
            hx-swap="innerHTML"
            hx-push-url="true"
            className="flex items-center gap-3 p-4 w-full hover:bg-base-300 transition-colors"
          >
            <span className="text-2xl">🗄️</span>
            <span className="text-xl font-bold text-primary">ChromaDB</span>
          </a>
          <ul className="menu menu-md w-full grow px-2 py-4">
            <li>
              <a
                hx-get="/"
                hx-target="#content"
                hx-swap="innerHTML"
                hx-push-url="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                Collections
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </>
);
```

- [ ] **Step 3: Commit**

```bash
git add src/templates/layout.tsx src/templates/app.tsx && git commit -m "feat: layout and app shell templates"
```

---

### Task 5: Collections template

**Files:**
- Create: `src/templates/collections.tsx`

- [ ] **Step 1: Create collections.tsx**

```typescript
import type { ChromaCollection } from "../chroma/client";

export const CollectionsList = ({ collections }: { collections: ChromaCollection[] }) => (
  <div class="space-y-4">
    <h2 class="text-2xl font-bold mb-4">Collections</h2>
    {collections.length === 0 && (
      <div class="card bg-base-200/60 border border-base-300/50 shadow-xl">
        <div class="card-body text-center text-base-content/60 py-12">
          <p class="text-lg">No collections found</p>
          <p class="text-sm mt-2">
            Connect to a ChromaDB instance with collections to get started.
          </p>
        </div>
      </div>
    )}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((col) => (
        <div class="card bg-base-200/60 border border-base-300/50 shadow-xl hover:shadow-2xl transition-shadow">
          <div class="card-body">
            <h3 class="card-title text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              {col.name}
            </h3>
            <p class="text-sm text-base-content/60">
              {col.count} record{col.count !== 1 ? "s" : ""}
            </p>
            <div class="card-actions justify-end mt-2">
              <a
                href={`/collections/${encodeURIComponent(col.name)}`}
                hx-get={`/collections/${encodeURIComponent(col.name)}`}
                hx-target="#content"
                hx-swap="innerHTML"
                hx-push-url="true"
                class="btn btn-primary btn-sm"
              >
                Browse
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CollectionError = () => (
  <div class="card bg-error/10 border border-error/30 shadow-xl">
    <div class="card-body text-center py-12">
      <p class="text-lg font-semibold text-error">Connection Error</p>
      <p class="text-sm mt-2 text-base-content/60">
        Could not connect to ChromaDB. Check your CHROMA_URL in .env and ensure the server is running.
      </p>
    </div>
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/templates/collections.tsx && git commit -m "feat: collections list template"
```

---

### Task 6: Records template with pagination

**Files:**
- Create: `src/templates/records.tsx`

- [ ] **Step 1: Create records.tsx**

```typescript
import type { ChromaRecord } from "../chroma/client";

interface RecordsTableProps {
  collectionName: string;
  records: ChromaRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export const RecordsTable = ({ collectionName, records, total, page, pageSize }: RecordsTableProps) => {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">{collectionName}</h2>
        <div class="flex items-center gap-2">
          <span class="text-sm text-base-content/60">{total} records</span>
          <a
            href="/"
            hx-get="/"
            hx-target="#content"
            hx-swap="innerHTML"
            hx-push-url="true"
            class="btn btn-ghost btn-sm"
          >
            ← Back
          </a>
        </div>
      </div>

      <div class="card bg-base-200/60 border border-base-300/50 shadow-xl">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Document</th>
                  <th>Metadata</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr>
                    <td class="max-w-[200px]">
                      <span class="truncate block text-xs font-mono" title={r.id}>{r.id}</span>
                    </td>
                    <td>
                      <div class="max-w-md truncate text-sm">{r.document ?? <span class="italic text-base-content/40">null</span>}</div>
                    </td>
                    <td>
                      <div class="max-w-xs truncate text-xs font-mono">
                        {r.metadata ? JSON.stringify(r.metadata) : <span class="italic text-base-content/40">null</span>}
                      </div>
                    </td>
                    <td>
                      <button
                        class="btn btn-error btn-xs"
                        hx-delete={`/collections/${encodeURIComponent(collectionName)}/records/${encodeURIComponent(r.id)}`}
                        hx-target="#content"
                        hx-swap="innerHTML"
                        hx-confirm="Delete this record?"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div class="flex items-center justify-center gap-2">
          <div class="join">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                href={`/collections/${encodeURIComponent(collectionName)}?page=${p}`}
                hx-get={`/collections/${encodeURIComponent(collectionName)}?page=${p}`}
                hx-target="#content"
                hx-swap="innerHTML"
                hx-push-url="true"
                class={`join-item btn btn-sm ${p === page ? "btn-active" : ""}`}
              >
                {p}
              </a>
            ))}
          </div>
        </div>
      )}

      <div class="card bg-base-200/60 border border-base-300/50 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-lg">Query Collection</h3>
          <form
            hx-post={`/collections/${encodeURIComponent(collectionName)}/query`}
            hx-target="#content"
            hx-swap="innerHTML"
            hx-push-url="true"
            class="flex gap-2"
          >
            <input
              type="text"
              name="query"
              placeholder="Enter search text..."
              class="input input-bordered flex-1"
              required
            />
            <button type="submit" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/templates/records.tsx && git commit -m "feat: records table with pagination"
```

---

### Task 7: Query results template

**Files:**
- Create: `src/templates/query.tsx`

- [ ] **Step 1: Create query.tsx**

```typescript
import type { ChromaRecord } from "../chroma/client";

interface QueryResultsProps {
  collectionName: string;
  queryText: string;
  results: ChromaRecord[];
}

export const QueryResults = ({ collectionName, queryText, results }: QueryResultsProps) => (
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Query: "{queryText}"</h2>
      <a
        href={`/collections/${encodeURIComponent(collectionName)}`}
        hx-get={`/collections/${encodeURIComponent(collectionName)}`}
        hx-target="#content"
        hx-swap="innerHTML"
        hx-push-url="true"
        class="btn btn-ghost btn-sm"
      >
        ← Back to {collectionName}
      </a>
    </div>

    <p class="text-sm text-base-content/60">
      Found {results.length} result{results.length !== 1 ? "s" : ""}
    </p>

    {results.length === 0 && (
      <div class="card bg-base-200/60 border border-base-300/50 shadow-xl">
        <div class="card-body text-center text-base-content/60 py-12">
          <p class="text-lg">No matching results</p>
        </div>
      </div>
    )}

    <div class="space-y-3">
      {results.map((r) => (
        <div class="card bg-base-200/60 border border-base-300/50 shadow-xl">
          <div class="card-body">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                {r.distance !== undefined && (
                  <div class="badge badge-outline badge-sm mb-2">
                    Distance: {r.distance.toFixed(4)}
                  </div>
                )}
                <p class="text-sm whitespace-pre-wrap">{r.document ?? <span class="italic text-base-content/40">null</span>}</p>
                {r.metadata && Object.keys(r.metadata).length > 0 && (
                  <details class="mt-2">
                    <summary class="text-xs text-base-content/40 cursor-pointer">Metadata</summary>
                    <pre class="text-xs font-mono mt-1 p-2 bg-base-300 rounded overflow-x-auto">
                      {JSON.stringify(r.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div class="card bg-base-200/60 border border-base-300/50 shadow-xl">
      <div class="card-body">
        <h3 class="card-title text-lg">New Query</h3>
        <form
          hx-post={`/collections/${encodeURIComponent(collectionName)}/query`}
          hx-target="#content"
          hx-swap="innerHTML"
          hx-push-url="true"
          class="flex gap-2"
        >
          <input
            type="text"
            name="query"
            placeholder="Enter search text..."
            class="input input-bordered flex-1"
            required
          />
          <button type="submit" class="btn btn-primary">Search</button>
        </form>
      </div>
    </div>
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/templates/query.tsx && git commit -m "feat: query results template"
```

---

### Task 8: Routes (pages.tsx)

**Files:**
- Create: `src/routes/pages.tsx`

- [ ] **Step 1: Create pages.tsx**

```typescript
import { Hono, type Context } from "hono";
import { Layout } from "../templates/layout";
import { App } from "../templates/app";
import { CollectionsList, CollectionError } from "../templates/collections";
import { RecordsTable } from "../templates/records";
import { QueryResults } from "../templates/query";
import {
  listCollections,
  getRecords,
  queryCollection,
  deleteRecord,
  deleteCollection,
  renameCollection,
} from "../chroma/client";

const PAGE_SIZE = 20;

function render(c: Context, Page: () => any, title: string) {
  if (c.req.header("HX-Request")) {
    return c.html(
      <>
        <Page />
        <h1 id="page-title" hx-swap-oob="innerHTML">{title}</h1>
      </>,
    );
  }
  return c.html(
    <Layout>
      <App title={title}>
        <Page />
      </App>
    </Layout>,
  );
}

const app = new Hono();

app.get("/", async (c) => {
  try {
    const collections = await listCollections();
    return render(c, () => <CollectionsList collections={collections} />, "Collections");
  } catch (e) {
    return render(c, () => <CollectionError />, "Error");
  }
});

app.get("/collections/:name", async (c) => {
  const name = c.req.param("name")!;
  const page = parseInt(c.req.query("page") || "1", 10);
  try {
    const { records, total } = await getRecords(name, page);
    return render(
      c,
      () => <RecordsTable collectionName={name} records={records} total={total} page={page} pageSize={PAGE_SIZE} />,
      `Collection: ${name}`,
    );
  } catch (e) {
    return render(
      c,
      () => <div class="card bg-error/10 border border-error/30 shadow-xl"><div class="card-body text-center py-12"><p class="text-lg font-semibold text-error">Error loading collection</p><p class="text-sm mt-2">{(e as Error).message}</p></div></div>,
      "Error",
    );
  }
});

app.post("/collections/:name/query", async (c) => {
  const name = c.req.param("name")!;
  const body = await c.req.parseBody();
  const queryText = (body.query as string) || "";
  try {
    const results = await queryCollection(name, queryText);
    return render(
      c,
      () => <QueryResults collectionName={name} queryText={queryText} results={results} />,
      `Query: ${queryText}`,
    );
  } catch (e) {
    return render(
      c,
      () => <div class="card bg-error/10 border border-error/30 shadow-xl"><div class="card-body text-center py-12"><p class="text-lg font-semibold text-error">Query failed</p><p class="text-sm mt-2">{(e as Error).message}</p></div></div>,
      "Error",
    );
  }
});

app.delete("/collections/:name/records/:id", async (c) => {
  const name = c.req.param("name")!;
  const id = c.req.param("id")!;
  try {
    await deleteRecord(name, id);
    const { records, total } = await getRecords(name, 1);
    return render(
      c,
      () => <RecordsTable collectionName={name} records={records} total={total} page={1} pageSize={PAGE_SIZE} />,
      `Collection: ${name}`,
    );
  } catch (e) {
    return render(
      c,
      () => <div class="card bg-error/10 border border-error/30 shadow-xl"><div class="card-body text-center py-12"><p class="text-lg font-semibold text-error">Delete failed</p><p class="text-sm mt-2">{(e as Error).message}</p></div></div>,
      "Error",
    );
  }
});

app.delete("/collections/:name", async (c) => {
  const name = c.req.param("name")!;
  try {
    await deleteCollection(name);
    const collections = await listCollections();
    return render(c, () => <CollectionsList collections={collections} />, "Collections");
  } catch (e) {
    return render(
      c,
      () => <div class="card bg-error/10 border border-error/30 shadow-xl"><div class="card-body text-center py-12"><p class="text-lg font-semibold text-error">Delete failed</p><p class="text-sm mt-2">{(e as Error).message}</p></div></div>,
      "Error",
    );
  }
});

app.post("/collections/:name/rename", async (c) => {
  const name = c.req.param("name")!;
  const body = await c.req.parseBody();
  const newName = (body.newName as string) || "";
  try {
    await renameCollection(name, newName);
    const collections = await listCollections();
    return render(c, () => <CollectionsList collections={collections} />, "Collections");
  } catch (e) {
    return render(
      c,
      () => <div class="card bg-error/10 border border-error/30 shadow-xl"><div class="card-body text-center py-12"><p class="text-lg font-semibold text-error">Rename failed</p><p class="text-sm mt-2">{(e as Error).message}</p></div></div>,
      "Error",
    );
  }
});

export default app;
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/pages.tsx && git commit -m "feat: all htmx routes"
```

---

### Task 9: Main server entry point

**Files:**
- Delete: `index.ts`
- Create: `src/main.ts`
- Create: `static/app.js`
- Create: `static/.gitkeep`

- [ ] **Step 1: Create src/main.ts**

```typescript
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import pages from "./routes/pages";

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));

app.route("/", pages);

app.notFound((c) => c.text("Not found", 404));

Bun.serve({
  port: 4000,
  hostname: "0.0.0.0",
  fetch: app.fetch,
});

console.log("🗄️ ChromaDB Dashboard running on http://0.0.0.0:4000");
```

- [ ] **Step 2: Remove old index.ts**

```bash
rm index.ts
```

- [ ] **Step 3: Create app.js**

```javascript
(function () {
  const html = document.documentElement;
  const sunIcon = document.getElementById("theme-icon-sun");
  const moonIcon = document.getElementById("theme-icon-moon");

  const savedTheme = sessionStorage.getItem("chromadb-theme");
  if (savedTheme) {
    html.setAttribute("data-theme", savedTheme);
    updateIcons(savedTheme);
  } else {
    html.setAttribute("data-theme", "dracula");
  }

  window.toggleTheme = function () {
    const current = html.getAttribute("data-theme");
    const next = current === "dracula" ? "bumblebee" : "dracula";
    html.setAttribute("data-theme", next);
    sessionStorage.setItem("chromadb-theme", next);
    updateIcons(next);
  };

  function updateIcons(theme) {
    if (theme === "dracula") {
      sunIcon?.classList.remove("hidden");
      moonIcon?.classList.add("hidden");
    } else {
      sunIcon?.classList.add("hidden");
      moonIcon?.classList.remove("hidden");
    }
  }
})();
```

- [ ] **Step 4: Create static/.gitkeep**

```bash
touch static/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
git add src/main.ts static/app.js static/.gitkeep && git rm index.ts && git commit -m "feat: main server entry and static assets"
```

---

### Task 10: Download HTMX and build CSS

**Files:**
- Create: `static/htmx.min.js`

- [ ] **Step 1: Download HTMX**

```bash
curl -sL https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js -o static/htmx.min.js
```

- [ ] **Step 2: Build CSS**

```bash
./build-css.sh
```

- [ ] **Step 3: Commit**

```bash
git add static/htmx.min.js static/style.css && git commit -m "feat: htmx library and compiled styles"
```
