# Tauri + React

A meal planner desktop app built with Tauri, a React + TypeScript frontend
(Vite), and a SQLite backend.

## Development

```sh
npm install        # install frontend dependencies
npm run tauri dev  # run the app (Vite dev server + Tauri window)
```

> If the `tauri` CLI isn't installed, use `cargo tauri dev` from `src-tauri`,
> or add `@tauri-apps/cli` as a dev dependency.

## Build

```sh
npm run tauri build
```

## Layout

- `src/` — React frontend (Vite + TypeScript)
  - `api.ts` — typed wrappers over the Tauri commands
  - `hooks/` — TanStack Query hooks over `api.ts`
  - `store/` — zustand client-UI state (active tab, status toast)
  - `components/` — UI organised by [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/):
    - `atoms/` — primitives (buttons, inputs, chips, toast, empty state)
    - `molecules/` — small groupings (form field, ingredient row/form, shopping item)
    - `organisms/` — self-contained sections (meal card, day card, nav, meal modals)
    - `templates/` — page scaffolds (app shell, view layout)
    - `pages/` — the three top-level views (meals, planner, shopping)
- `src-tauri/` — Rust backend (Tauri commands + SQLite via `rusqlite`)

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).
