# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

## Project Overview

**Trackr** is an internal task tracker for software development teams. Built with Next.js 16 App Router, React 19, Zustand for UI state, and TanStack Query for server state. Styling is 100% SASS modules — no Tailwind, no CSS-in-JS.

Data is persisted to `localStorage` using a versioned key (`trackr_vN`). The seed file at `src/data/seed.json` is loaded on first visit or when the key doesn't exist. There is no database, no authentication, and no server-side API — all users act as admin.

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit

# Code quality
pnpm format       # Prettier: format all files in place
pnpm format:check # Prettier: check without writing (used in CI)
```

## Architecture

### No authentication

There is no auth. All routes are public. The middleware at `src/middleware.ts` is a no-op. Users are treated as "admin" automatically.

### Routing — App Router route groups

- `src/app/(dashboard)/` — all app pages, wraps children in `AppShell` (Sidebar + main area)
- `src/app/api/` — unused; all data goes through `src/lib/storage.ts` directly
- `src/app/page.tsx` — root redirects to `/dashboard`

Route params in Next.js 16 are **async**: `params` is a `Promise<{ id: string }>` — always `await params` before accessing fields.

### Data layer — localStorage

`src/lib/storage.ts` is the single source of truth. It reads/writes a `Store` object (`{ tasks, projects, nextTaskNumber }`) to `localStorage` under `STORAGE_KEY`. On the server (SSR) it returns the seed data directly.

`src/lib/api/tasks.ts` and `src/lib/api/projects.ts` are thin `Promise.resolve()` wrappers over `storage.*` methods — they exist so TanStack Query hooks have an async interface without needing to know about localStorage.

**When the storage shape changes, bump `STORAGE_KEY` in `src/lib/storage.ts`** (e.g. `trackr_v3` → `trackr_v4`) to force all clients to re-seed.

### State management — two-layer model

| Layer              | Tool              | Location     | Purpose                                            |
| ------------------ | ----------------- | ------------ | -------------------------------------------------- |
| Server/async state | TanStack Query v5 | `src/hooks/` | API data, caching, invalidation                    |
| Client/UI state    | Zustand           | `src/store/` | Modal open/close, sidebar collapse, active project |

`QueryClient` is instantiated inside `useState` in `src/providers/index.tsx` to prevent shared state across SSR requests. All query key factories live in `src/hooks/` alongside their hooks (e.g. `taskKeys` in `useTasks.ts`).

Filters (status, priority, search, page) are stored in `useFiltersStore` with `persist` middleware — they survive page refreshes. `TaskList` reads filters from the store and passes them as the query key; updating filters auto-refetches.

### Styling — SASS module conventions

All SASS partials live in `src/styles/`:

- `_variables.scss` — design tokens (colors, spacing, typography, z-index, breakpoints)
- `_mixins.scss` — `flex-center`, `flex-between`, `surface($level)`, `focus-ring`, `skeleton`, `scrollbar-thin`, `respond-to($bp)`
- `_reset.scss` — minimal CSS reset
- `_typography.scss` — heading/body element defaults

`src/app/globals.scss` imports all partials and sets `color-scheme: dark`.

Each component has a colocated `ComponentName.module.scss`. Import variables/mixins with:

```scss
@use '../../../styles/variables' as v;
@use '../../../styles/mixins' as m;
```

The path depth varies by nesting level — adjust `../` accordingly.

Use the `cn()` utility from `src/lib/utils.ts` to conditionally join class names (same API as `clsx`).

### Validation — Zod + React Hook Form

Schemas in `src/lib/validations/` define both the Zod shape and export `Input` types. Form components use `useForm` with `zodResolver`.

Enum fields use `.optional()` (not `.default()`) in form schemas to keep input/output types aligned for `zodResolver`. Fallback defaults are applied manually in `onSubmit`.

### Component structure

```
src/components/
  ui/           — headless primitives (Button, Input, Badge, Modal, Select, Spinner)
  tasks/        — task-domain components (TaskCard, TaskList, TaskForm)
  projects/     — project-domain components (ProjectList, ProjectForm)
  layout/       — AppShell, Sidebar, Header
```

Each component directory contains exactly one `.tsx` and one `.module.scss` file, named identically to the directory.

## Environment

No environment variables are required to run the app. It works entirely in the browser with localStorage.
