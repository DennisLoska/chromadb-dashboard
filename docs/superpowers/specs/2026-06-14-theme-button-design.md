# Theme Toggle Button Fix

## Goal
Fix the theme UI toggle button so that clicking it changes the theme, and ensure the default theme is dark.

## Current Problem
- Theme button click does not change the theme.
- Current implementation uses event delegation and an inline head script for theme restoration.

## Proposed Design (Approach A)
Adopt the same pattern used in the Basho project, which is confirmed working:

1. **Default theme**: `dracula` (dark), set on `<html data-theme="dracula">`.
2. **Theme restoration**: Performed inside the deferred `static/app.js` IIFE on load, reading from `sessionStorage.getItem('chromadb-theme')`. If a saved theme exists, apply it; otherwise default to `dracula` and save it.
3. **Toggle handler**: Define `window.toggleTheme()` in `static/app.js`. It reads the current `data-theme`, switches between `dracula` and `bumblebee`, persists the new value to `sessionStorage`, and updates the sun/moon icons.
4. **Button markup**: In `src/templates/app.tsx`, add `onclick="toggleTheme()"` directly to the `#theme-toggle` button.

## Files to Change
- `src/templates/app.tsx` — add inline `onclick` to theme button.
- `src/templates/layout.tsx` — remove inline head script that restores theme before CSS load.
- `static/app.js` — add `window.toggleTheme`, theme restoration on init, and icon updates.

## Verification
- Run `bun run start` and load the app in a browser.
- Click the theme button: theme should switch between dark (`dracula`) and light (`bumblebee`).
- Refresh the page: the last selected theme should persist.
- Default on first visit (no sessionStorage value) must be `dracula`.
