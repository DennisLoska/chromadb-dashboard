import type { Child } from "hono/jsx";

export const Layout = ({ children }: { children: Child }) => (
  <html lang="en" data-theme="dracula">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <title id="page-title">ChromaDB Dashboard</title>
      <script>try{'{'}var t=sessionStorage.getItem("chromadb-theme");if(t)document.documentElement.setAttribute("data-theme",t);{'}'}catch(e){'{'}{'}'}</script>
      <link href="/static/style.css" rel="stylesheet" />
      <script src="/static/htmx.min.js" />
      <script defer src="/static/app.js" />
    </head>
    <body>{children}</body>
  </html>
);
