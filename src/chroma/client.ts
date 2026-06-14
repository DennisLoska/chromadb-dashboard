import { ChromaClient, type Metadata } from "chromadb";
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const PAGE_SIZE = 20;
const CONNECTION_TIMEOUT = 5_000;
const EMBED_API_URL = process.env.EMBEDDING_API_URL || "";
const EMBED_MODEL = process.env.EMBEDDING_MODEL || "";

const parsedUrl = new URL(CHROMA_URL);
const CHROMA_OPTIONS = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port, 10) || 8000,
  ssl: parsedUrl.protocol === "https:",
};

class ApiEmbedder {
  async generate(texts: string[]): Promise<number[][]> {
    const res = await fetch(EMBED_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Embedding API error ${res.status}: ${body}`);
    }
    const json = await res.json() as any;
    return json.data.map((d: any) => d.embedding);
  }
}

const embedder = EMBED_API_URL && EMBED_MODEL
  ? new ApiEmbedder()
  : new DefaultEmbeddingFunction();

let _client: ChromaClient | null = null;

function getClient(): ChromaClient {
  if (!_client) {
    _client = new ChromaClient({ ...CHROMA_OPTIONS });
  }
  return _client;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("ChromaDB connection timed out")), ms),
    ),
  ]);
}

async function getCollection(name: string) {
  const client = getClient();
  return client.getCollection({ name, embeddingFunction: embedder });
}

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
  await withTimeout(client.heartbeat(), CONNECTION_TIMEOUT);
  const collections = await client.listCollections();
  const result: ChromaCollection[] = [];
  for (const col of collections) {
    const c = await getCollection(col.name);
    const count = await c.count();
    result.push({ name: col.name, count });
  }
  return result;
}

export async function getRecords(
  collectionName: string,
  page: number,
): Promise<{ records: ChromaRecord[]; total: number }> {
  const collection = await getCollection(collectionName);
  const total = await collection.count();
  const offset = (page - 1) * PAGE_SIZE;
  const response = await collection.get({
    limit: PAGE_SIZE,
    offset,
    include: ["documents", "metadatas", "embeddings"],
  });
  const records: ChromaRecord[] = response.ids.map((id, i) => ({
    id,
    document: (response.documents?.[i] as string | null) ?? null,
    metadata: (response.metadatas?.[i] as Record<string, unknown> | null) ?? null,
    embedding: (response.embeddings?.[i] as number[] | null) ?? null,
  }));
  return { records, total };
}

export async function queryCollection(
  collectionName: string,
  queryText: string,
  nResults = 10,
): Promise<ChromaRecord[]> {
  const collection = await getCollection(collectionName);
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
    document: (docs?.[i] as string | null) ?? null,
    metadata: (metas?.[i] as Record<string, unknown> | null) ?? null,
    embedding: null,
    distance: (dists?.[i] as number | undefined) ?? undefined,
  }));
}

export async function deleteRecord(collectionName: string, recordId: string): Promise<void> {
  const collection = await getCollection(collectionName);
  await collection.delete({ ids: [recordId] });
}

export async function deleteCollection(collectionName: string): Promise<void> {
  const client = getClient();
  await client.deleteCollection({ name: collectionName });
}

export async function renameCollection(oldName: string, newName: string): Promise<void> {
  const client = getClient();
  const old = await getCollection(oldName);
  const response = await old.get({ include: ["documents", "embeddings", "metadatas"] });
  const newCol = await client.createCollection({ name: newName, embeddingFunction: embedder });
  if (response.ids.length > 0) {
    const docs = (response.documents ?? []) as string[];
    const embs = (response.embeddings ?? []) as number[][];
    const metas = (response.metadatas ?? []) as Metadata[];
    await newCol.add({ ids: response.ids, documents: docs, embeddings: embs, metadatas: metas });
  }
  await client.deleteCollection({ name: oldName });
}
