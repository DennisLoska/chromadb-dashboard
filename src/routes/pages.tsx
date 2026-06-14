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
      () => (
        <div class="card bg-error/10 border border-error/30 shadow-xl">
          <div class="card-body text-center py-12">
            <p class="text-lg font-semibold text-error">Error loading collection</p>
            <p class="text-sm mt-2">{(e as Error).message}</p>
          </div>
        </div>
      ),
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
      () => (
        <div class="card bg-error/10 border border-error/30 shadow-xl">
          <div class="card-body text-center py-12">
            <p class="text-lg font-semibold text-error">Query failed</p>
            <p class="text-sm mt-2">{(e as Error).message}</p>
          </div>
        </div>
      ),
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
      () => (
        <div class="card bg-error/10 border border-error/30 shadow-xl">
          <div class="card-body text-center py-12">
            <p class="text-lg font-semibold text-error">Delete failed</p>
            <p class="text-sm mt-2">{(e as Error).message}</p>
          </div>
        </div>
      ),
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
      () => (
        <div class="card bg-error/10 border border-error/30 shadow-xl">
          <div class="card-body text-center py-12">
            <p class="text-lg font-semibold text-error">Delete failed</p>
            <p class="text-sm mt-2">{(e as Error).message}</p>
          </div>
        </div>
      ),
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
      () => (
        <div class="card bg-error/10 border border-error/30 shadow-xl">
          <div class="card-body text-center py-12">
            <p class="text-lg font-semibold text-error">Rename failed</p>
            <p class="text-sm mt-2">{(e as Error).message}</p>
          </div>
        </div>
      ),
      "Error",
    );
  }
});

export default app;
