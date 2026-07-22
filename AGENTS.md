# AGENTS.md

Meal Planner — a mobile-first meal planning app. React + TypeScript (Vite) in the
WebView, Capacitor as the native shell, and SQLite as the only data store. There
is no server and no network dependency apart from the optional recipe import.

## Commands

```sh
npm install                 # dependencies
npm run dev                 # Vite dev server on :1420 (browser, wasm SQLite)
npm run build               # tsc --noEmit + vite build -> dist/
npm run preview             # serve the built dist/

npx cap sync android        # copy dist/ + plugins into android/
cd android && ./gradlew assembleDebug   # -> android/app/build/outputs/apk/debug/

python3 android/tools/generate-launcher-icons.py   # rebuild icons from calendar.png
```

There is no lint step and no test suite. `npm run build` runs `tsc` first, so
type errors fail the build — treat it as the check to run after changes.

Building the APK requires JDK 17–21 (Capacitor's Gradle 8.14 rejects newer) and
Android SDK platform 36 / build-tools 36.0.0.

## Architecture

Data flows in one direction: components → `hooks/api.ts` (TanStack Query) →
`api.ts` (SQL) → `db.ts` (the single SQLite connection).

- `src/db.ts` — opens one shared `SQLiteDBConnection`, creates the schema, runs
  additive migrations. `initDb()` must complete before React mounts; `main.tsx`
  awaits it. On web it boots the `jeep-sqlite` wasm element (IndexedDB-backed);
  on device it uses native SQLite.
- `src/api.ts` — every SQL statement in the app. Plain async functions, no React.
- `src/hooks/api.ts` — the only place queries and mutations are defined. Three
  query keys (`mealsKey`, `weekPlanKey`, `shoppingListKey`); mutations invalidate
  whatever they can affect.
- `src/store/uiStore.ts` — zustand, client-only UI state (active tab, status
  toast). Server state never goes here.
- `src/types.ts` — all shared types. Row shapes use snake_case to match the SQL
  columns (`meal_id`, `recipe_url`); everything else is camelCase.
- `src/recipeImport.ts` — parses schema.org JSON-LD off a recipe page into
  ingredient drafts. Best-effort: it prefills the editor for review, it does not
  write to the database.

Components follow Atomic Design under `src/components/`:

`atoms/` (primitives, mostly thin wrappers over PrimeReact) → `molecules/`
(small groupings) → `organisms/` (self-contained sections, modals) →
`templates/` (`AppShell`, `ViewLayout`) → `pages/` (the three tabs). Each
directory has an `index.ts` barrel; import from the barrel, not the file.

`App.tsx` switches on `activeTab` — there is no router.

## Conventions

- UI components come from **PrimeReact** (`lara-dark-green` theme, imported in
  `main.tsx`). Wrap a PrimeReact component in an atom when the app needs it in
  more than one place; pages may use PrimeReact directly for one-offs.
- Styling is one hand-written stylesheet, `src/styles.css`, driven by CSS
  variables in `:root` (navy/teal/cream palette). No CSS-in-JS, no utility
  classes. PrimeReact's CSS is imported before it so app rules win.
- Comments explain *why*, not what. Non-obvious decisions carry a paragraph
  (see `capacitor.config.ts`, `android/app/build.gradle`, `recipeImport.ts`).
  Match that density — this codebase is heavily and deliberately commented.
- Exported functions and interface fields get JSDoc.
- TypeScript is strict with `noUnusedLocals` / `noUnusedParameters`.

## Things that will bite you

- **`CapacitorHttp` is enabled globally** (`capacitor.config.ts`), so on device
  *every* `window.fetch` goes through the native HTTP stack. That exists because
  recipe sites send no CORS headers. In the browser there is no native layer, so
  `vite.config.ts` mounts a dev-only `/__recipe` proxy instead — the two paths
  differ, and recipe import must be tested on device to be trusted.
- **`android/debug.keystore` is committed on purpose.** Sideloaded updates only
  install over an existing app if the signing key matches and `versionCode`
  climbs. Gradle would otherwise generate a fresh key per machine/CI run and
  every update would require an uninstall — which wipes the user's database.
  `versionCode` comes from `-PappVersionCode=<n>`; CI passes the run number.
- **The launcher icon is generated, not hand-placed.** `android/calendar.png` is
  the source art; every `res/mipmap-*` PNG and the adaptive background colour
  come out of `android/tools/generate-launcher-icons.py` and are committed.
  Nothing in the build regenerates them — `npx cap sync` never touches
  `res/mipmap-*` — so changing `calendar.png` without re-running the script
  leaves the old icon shipping, which is exactly what happened once already.
- **The schema is append-only in practice.** `CREATE TABLE IF NOT EXISTS` never
  alters an existing table, so a new column needs a guarded step in `migrate()`
  in `db.ts` as well as the `SCHEMA` string. Installed apps carry real data.
- **`src-tauri/` is legacy.** The app was a Tauri desktop app before the
  Capacitor port; the Rust backend is kept as the reference the SQL in `api.ts`
  was ported from (`src-tauri/src/db.rs`). It is not part of the build or CI —
  don't add features there. `README.md` still describes the Tauri setup.

## CI

`.github/workflows/android-apk.yml` builds a debug APK on push to `main` (when
`src/`, `android/`, or the build config changes) and on manual dispatch. The APK
lands in the run's Artifacts as `mealplanner-apk-v1.0.<run_number>`.
