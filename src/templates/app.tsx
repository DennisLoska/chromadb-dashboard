import type { Child } from "hono/jsx";

interface AppProps {
  children: Child;
  title?: string;
}

export const App = ({ children, title }: AppProps) => (
  <>
    <div id="app-drawer" className="drawer min-h-screen bg-base-100">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col overflow-y-auto">
        <header className="navbar bg-base-200/80 backdrop-blur-sm px-4 shadow-sm z-10">
          <div className="flex-none">
            <button className="btn btn-ghost btn-circle btn-sm" onclick="toggleSidebar()">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
          <div className="flex-1">
            <h1 id="page-title" className="text-xl font-bold">
              {title ?? "ChromaDB Dashboard"}
            </h1>
          </div>
          <div className="flex-none">
            <button id="theme-toggle" className="btn btn-ghost btn-circle btn-sm">
              <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <svg id="theme-icon-moon" className="h-5 w-5 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4">
          <div id="content" className="min-h-[400px]">
            {children}
          </div>
        </main>
      </div>
      <aside className="drawer-side z-20">
        <label htmlFor="main-drawer" className="drawer-overlay" />
        <div className="bg-base-200 border-r border-base-300 flex flex-col items-start min-h-full w-64">
          <a
            href="/"
            hx-get="/"
            hx-target="#content"
            hx-swap="innerHTML"
            hx-push-url="true"
            className="flex items-center gap-3 p-4 w-full hover:bg-base-300 transition-colors"
          >
            <span className="text-2xl">🗄️</span>
            <span className="text-xl font-bold text-primary">ChromaDB</span>
          </a>
          <ul className="menu menu-md w-full grow px-2 py-4">
            <li>
              <a
                hx-get="/"
                hx-target="#content"
                hx-swap="innerHTML"
                hx-push-url="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                Collections
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </>
);
