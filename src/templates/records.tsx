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
