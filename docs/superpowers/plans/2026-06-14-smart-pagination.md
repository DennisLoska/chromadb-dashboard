# Smart Pagination UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the all-pages button list in the records view with a compact pagination control showing Previous/Next buttons and at most 5 numbered page buttons with ellipsis.

**Architecture:** Add a helper inside `records.tsx` that computes the visible page items (numbers and ellipsis) based on `currentPage` and `totalPages`. Replace the existing `.join` button group with the new pagination bar.

**Tech Stack:** Bun, Hono, HTMX, JSX, Tailwind CSS, daisyUI.

---

### Task 1: Add smart pagination helper and replace existing pagination

**Files:**
- Modify: `src/templates/records.tsx:119-134`

- [ ] **Step 1: Implement the pagination range helper**

  Insert before the `RecordsTable` component:

  ```tsx
  function getPaginationItems(current: number, total: number): (number | string)[] {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: (number | string)[] = [];

    if (current <= 3) {
      for (let i = 1; i <= 5; i++) items.push(i);
      items.push("...", total);
    } else if (current >= total - 2) {
      items.push(1, "...");
      for (let i = total - 4; i <= total; i++) items.push(i);
    } else {
      items.push(1, "...");
      for (let i = current - 1; i <= current + 1; i++) items.push(i);
      items.push("...", total);
    }

    return items;
  }
  ```

- [ ] **Step 2: Replace the pagination JSX**

  Replace lines 119-134 with:

  ```tsx
  <div class="flex items-center justify-center gap-2 pb-4">
    <a
      href={page > 1 ? `/collections/${encodeURIComponent(collectionName)}?page=${page - 1}` : "#"}
      hx-get={page > 1 ? `/collections/${encodeURIComponent(collectionName)}?page=${page - 1}` : undefined}
      hx-target="#content"
      hx-swap="innerHTML"
      hx-push-url="true"
      class={`join-item btn btn-sm ${page === 1 ? "btn-disabled" : ""}`}
      aria-label="Previous page"
    >
      ← Prev
    </a>
    <div class="join">
      {getPaginationItems(page, totalPages).map((item) =>
        item === "..." ? (
          <span class="join-item btn btn-sm btn-disabled">...</span>
        ) : (
          <a
            href={`/collections/${encodeURIComponent(collectionName)}?page=${item}`}
            hx-get={`/collections/${encodeURIComponent(collectionName)}?page=${item}`}
            hx-target="#content"
            hx-swap="innerHTML"
            hx-push-url="true"
            class={`join-item btn btn-sm ${item === page ? "btn-active" : ""}`}
          >
            {item}
          </a>
        )
      )}
    </div>
    <a
      href={page < totalPages ? `/collections/${encodeURIComponent(collectionName)}?page=${page + 1}` : "#"}
      hx-get={page < totalPages ? `/collections/${encodeURIComponent(collectionName)}?page=${page + 1}` : undefined}
      hx-target="#content"
      hx-swap="innerHTML"
      hx-push-url="true"
      class={`join-item btn btn-sm ${page === totalPages ? "btn-disabled" : ""}`}
      aria-label="Next page"
    >
      Next →
    </a>
  </div>
  ```

- [ ] **Step 3: Typecheck**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/templates/records.tsx
  git commit -m "feat: smart pagination with prev/next and ellipsis"
  ```

### Task 2: Verify pagination UI

**Files:** None

- [ ] **Step 1: Start the server**

  ```bash
  bun run start
  ```

- [ ] **Step 2: Load records page for a collection with > 5 pages**

  Visit `http://localhost:4000/collections/silicon_seeds`.

- [ ] **Step 3: Inspect pagination bar**

  Confirm:
  - "← Prev" and "Next →" buttons are present.
  - At most 5 numbered page buttons are shown.
  - Ellipsis (`...`) appears when pages are skipped.
  - Current page has `btn-active` class.

- [ ] **Step 4: Click through pages**

  Click page numbers, Prev, and Next. Confirm HTMX swaps content and URL updates.

- [ ] **Step 5: Stop server**
