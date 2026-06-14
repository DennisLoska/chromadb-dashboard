# Smart Pagination UI

## Goal
Replace the current all-pages button list in the records view with a compact pagination control that shows at most 5 numbered page buttons plus Previous/Next navigation and ellipsis for skipped ranges.

## Design (Approach A)

Render a single pagination bar:

```
[← Prev] [1] [2] [3] [4] [5] ... [55] [Next →]
```

### Behavior

- **Previous** button: goes to `currentPage - 1`. Disabled on page 1.
- **Next** button: goes to `currentPage + 1`. Disabled on last page.
- **Numbered buttons**: at most 5 items, including:
  - First page (1)
  - Last page (`totalPages`)
  - Current page
  - Immediate neighbors of current page
- **Ellipsis (`...`)**: shown between disjoint ranges.

### Examples (55 total pages)

- Page 1: `Prev(disabled) [1] [2] [3] [4] [5] ... [55] Next`
- Page 3: `Prev [1] [2] [3] [4] [5] ... [55] Next`
- Page 10: `Prev [1] ... [8] [9] [10] [11] [12] ... [55] Next`
- Page 55: `Prev [1] ... [51] [52] [53] [54] [55] Next(disabled)`

### Edge cases

- `totalPages <= 5`: show all pages, no ellipsis.
- `totalPages === 1`: Previous and Next disabled, single page button.

## Files to Change

- `src/templates/records.tsx` — replace the existing `.join` pagination block with the smart pagination component.

## Verification

- TypeScript check passes.
- Render the records page for a collection with > 5 pages.
- Confirm only up to 5 numbered buttons + ellipsis are shown.
- Click Previous, Next, and numbered buttons; confirm correct page loads via HTMX.
