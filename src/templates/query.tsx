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
