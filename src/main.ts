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
