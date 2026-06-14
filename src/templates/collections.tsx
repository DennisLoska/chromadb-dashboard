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
