import type { ChromaRecord } from "../chroma/client";

interface RecordsTableProps {
  collectionName: string;
  records: ChromaRecord[];
  total: number;
  page: number;
  pageSize: number;
}

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

export const RecordsTable = ({ collectionName, records, total, page, pageSize }: RecordsTableProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div class="space-y-4">
      <div class="card bg-base-200/60 border border-base-300/50 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Query Collection
          </h3>
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
            <table id="records-table" class="table table-zebra table-fixed w-full">
              <colgroup>
                <col style="width:22%" />
                <col style="width:38%" />
                <col style="width:30%" />
                <col style="width:10%" />
              </colgroup>
              <thead>
                <tr>
                  <th class="relative">
                    ID
                    <div class="resize-handle" />
                  </th>
                  <th class="relative">
                    Document
                    <div class="resize-handle" />
                  </th>
                  <th class="relative">
                    Metadata
                    <div class="resize-handle" />
                  </th>
                  <th class="relative">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    class="clickable-row"
                    data-id={r.id}
                    data-document={r.document ?? ""}
                    data-metadata={JSON.stringify(r.metadata ?? {})}
                    onclick="showRecord(this.dataset)"
                  >
                    <td class="truncate font-mono text-xs" title={r.id}>{r.id}</td>
                    <td class="truncate max-w-0">
                      <span class="truncate block text-sm">{r.document ?? <span class="italic text-base-content/40">null</span>}</span>
                    </td>
                    <td class="truncate max-w-0">
                      <span class="truncate block text-xs font-mono">{r.metadata ? JSON.stringify(r.metadata) : <span class="italic text-base-content/40">null</span>}</span>
                    </td>
                    <td onclick="event.stopPropagation()">
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

      <dialog id="record-modal" class="modal">
        <div class="modal-box max-w-3xl">
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 class="font-bold text-lg mb-4">Record Detail</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-base-content/60 mb-1">ID</h4>
              <pre class="bg-base-300 rounded-lg p-3 text-sm overflow-x-auto"><code id="modal-id" /></pre>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <h4 class="text-sm font-semibold text-base-content/60">Document</h4>
                <button class="btn btn-xs btn-ghost" data-copy-for="modal-document">Copy</button>
              </div>
              <pre class="bg-base-300 rounded-lg p-3 text-sm modal-codeblock"><code id="modal-document" /></pre>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <h4 class="text-sm font-semibold text-base-content/60">Metadata</h4>
                <button class="btn btn-xs btn-ghost" data-copy-for="modal-metadata">Copy</button>
              </div>
              <pre class="bg-base-300 rounded-lg p-3 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap"><code id="modal-metadata" /></pre>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
};
