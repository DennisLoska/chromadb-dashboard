# Theme Toggle Button Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the theme UI toggle button so clicking it changes the theme, with `dracula` (dark) as the default.

**Architecture:** Adopt the Basho project pattern: inline `onclick="toggleTheme()"` on the button, and define `window.toggleTheme` in the deferred `static/app.js` IIFE. Theme persistence uses `sessionStorage`.

**Tech Stack:** Bun, Hono, HTMX, daisyUI, Tailwind CSS v4.

---

### Task 1: Update layout to remove inline head script

**Files:**
- Modify: `src/templates/layout.tsx`

- [ ] **Step 1: Remove inline theme-restore script from `<head>`**

  Delete the `<script>try{...sessionStorage...}...</script>` line so the HTML `<head>` only contains meta tags, title, stylesheet, and scripts.

- [ ] **Step 2: Commit**

  ```bash
  git add src/templates/layout.tsx
  git commit -m "refactor: remove inline theme restore from head"
  ```

### Task 2: Add inline click handler to theme button

**Files:**
- Modify: `src/templates/app.tsx`

- [ ] **Step 1: Add `onclick="toggleTheme()"` to the theme toggle button**

  ```tsx
  <button id="theme-toggle" className="btn btn-ghost btn-circle btn-sm" onclick="toggleTheme()">
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/templates/app.tsx
  git commit -m "fix: add inline toggleTheme handler to theme button"
  ```

### Task 3: Implement theme toggle logic in app.js

**Files:**
- Modify: `static/app.js`

- [ ] **Step 1: Add theme init and toggle functions to the deferred script**

  Insert at the top of `static/app.js` (after helpers):

  ```js
  // ── Theme ──────────────────────────────────────────
  (function() {
    var html = document.documentElement;
    var sunIcon = document.getElementById("theme-icon-sun");
    var moonIcon = document.getElementById("theme-icon-moon");

    function updateIcons(theme) {
      if (!sunIcon || !moonIcon) return;
      if (theme === "dracula") {
        sunIcon.classList.remove("hidden");
        moonIcon.classList.add("hidden");
      } else {
        sunIcon.classList.add("hidden");
        moonIcon.classList.remove("hidden");
      }
    }

    var savedTheme;
    try { savedTheme = sessionStorage.getItem("chromadb-theme"); } catch (_) {}
    if (savedTheme) {
      html.setAttribute("data-theme", savedTheme);
      updateIcons(savedTheme);
    } else {
      html.setAttribute("data-theme", "dracula");
      try { sessionStorage.setItem("chromadb-theme", "dracula"); } catch (_) {}
      updateIcons("dracula");
    }

    window.toggleTheme = function() {
      var current = html.getAttribute("data-theme") || "dracula";
      var next = current === "dracula" ? "bumblebee" : "dracula";
      html.setAttribute("data-theme", next);
      try { sessionStorage.setItem("chromadb-theme", next); } catch (_) {}
      updateIcons(next);
    };
  })();
  ```

- [ ] **Step 2: Remove any leftover event-delegated theme toggle code**

  Ensure there is no other `addEventListener("click", ...)` block specifically handling `#theme-toggle`.

- [ ] **Step 3: Rebuild CSS**

  ```bash
  bash build-css.sh
  ```

- [ ] **Step 4: Typecheck and syntax check**

  ```bash
  npx tsc --noEmit
  node --check static/app.js
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add static/app.js static/style.css
  git commit -m "fix: implement window.toggleTheme with sessionStorage persistence"
  ```

### Task 4: Verify in browser

**Files:** None

- [ ] **Step 1: Start the server**

  ```bash
  bun run start
  ```

- [ ] **Step 2: Load in headless Chromium and click theme button**

  Confirm `document.documentElement.getAttribute("data-theme")` changes from `dracula` to `bumblebee` after clicking `#theme-toggle`.

- [ ] **Step 3: Stop server**
