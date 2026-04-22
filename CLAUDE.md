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

`src/lib/storage.ts` is the single source of truth. It reads/writes a `Store` object (`{ tasks, projects, lists, nextTaskNumber }`) to `localStorage` under `STORAGE_KEY`. Current key: **`trackr_v6`**. On the server (SSR) it returns the seed data directly.

`src/lib/api/tasks.ts`, `src/lib/api/projects.ts`, and `src/lib/api/lists.ts` are thin `Promise.resolve()` wrappers over `storage.*` methods — they exist so TanStack Query hooks have an async interface without needing to know about localStorage.

**When the storage shape changes, bump `STORAGE_KEY` in `src/lib/storage.ts`** (e.g. `trackr_v6` → `trackr_v7`) to force all clients to re-seed.

### State management — two-layer model

| Layer              | Tool              | Location     | Purpose                                            |
| ------------------ | ----------------- | ------------ | -------------------------------------------------- |
| Server/async state | TanStack Query v5 | `src/hooks/` | API data, caching, invalidation                    |
| Client/UI state    | Zustand           | `src/store/` | Modal open/close, sidebar collapse, active project |

`QueryClient` is instantiated inside `useState` in `src/providers/index.tsx` to prevent shared state across SSR requests. All query key factories live in `src/hooks/` alongside their hooks (e.g. `taskKeys` in `useTasks.ts`).

Filters (status, priority, search, page) are stored in `useFiltersStore` with `persist` middleware — they survive page refreshes. `TaskList` reads filters from the store and passes them as the query key; updating filters auto-refetches.

**Zustand stores:**

- `src/store/ui.store.ts` (`useUiStore`) — sidebar collapse, mobile sidebar, create task/project modal open state, active project ID
- `src/store/filters.store.ts` (`useFiltersStore`) — task list filter state (status, priority, type, search, page), persisted to localStorage

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

**Async form pre-population pattern:** When editing a record that loads async, use react-hook-form's `values` prop instead of `defaultValues` + `useEffect` + `form.reset()`. The `values` prop makes the form reactive — field values are correct before controlled components (like `RichTextEditor`) initialize their internal state.

```ts
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { description: '' },
  values: record ? { description: record.description ?? '' } : undefined,
  resetOptions: { keepDirtyValues: true }, // preserve in-progress edits on background refetch
});
```

### Rich text editing — TipTap v3

`src/components/ui/RichTextEditor/RichTextEditor.tsx` wraps TipTap v3 (`@tiptap/react@^3`, `@tiptap/starter-kit@^3`). It is a controlled component — pass `value` (HTML string) and `onChange` (called with HTML on every edit).

Key details:

- Always wire via `Controller` from react-hook-form: `<Controller name="description" render={({ field }) => <RichTextEditor value={field.value ?? ''} onChange={field.onChange} />} />`
- `normalizeIncomingContent()` converts legacy plain-text descriptions into `<p>` HTML before handing to TipTap; existing HTML passes through unchanged.
- `immediatelyRender: false` prevents SSR hydration mismatches in the Next.js environment.
- A sync `useEffect([editor, normalizedValue])` calls `editor.commands.setContent(content, { emitUpdate: false })` when the external `value` prop changes after the editor is already mounted. `{ emitUpdate: false }` is TipTap v3's options-object API (not a boolean second arg as in v2).
- `'<p></p>'` is TipTap's empty-document HTML; the sync effect treats it as equivalent to `''` to avoid redundant transactions.

### Kanban board (`/board`)

`KanbanBoard` renders tasks grouped into Kanban lists. Lists live in `storage.lists` and are managed via `useLists` / `listsApi`.

- The seed includes a permanent **Backlog** list (`BACKLOG_LIST_ID = 'lst_backlog'` in `src/lib/kanbanLists.ts`) that cannot be deleted; deleting another list migrates its tasks here.
- Clicking a task card opens `TaskDetailModal` (a React portal) which renders `TaskEditView` → `TaskForm` in `variant='modal'` mode.
- `KanbanListSettingsModal` — per-list name, color, and WIP limit settings.
- `DeleteListModal` — confirms deletion with a task-migration warning.
- `src/lib/boardSearchParams.ts` — `buildBoardUrl(filters)` builds `/board?…` URLs used by badge links in `TaskForm` to open the board pre-filtered.

### Component structure

```
src/components/
  ui/
    Badge/                — status, priority, type badge variants
    Button/               — primary, ghost, danger variants + loading state
    GearIcon/             — animated settings icon
    Input/                — labeled text input with error display
    RichTextEditor/       — TipTap v3 WYSIWYG; controlled (HTML string in/out)
  tasks/
    CreateTaskView/       — create-task form wrapper used inside modals
    DeleteListModal/      — confirm-delete with task migration warning
    KanbanBoard/          — Kanban grid with column cards
    KanbanListSettingsModal/ — per-list editor (name, color, WIP limit)
    NewTaskModal/         — modal shell around CreateTaskView
    TaskCard/             — task card for list and board views
    TaskDetailModal/      — portal modal wrapping TaskEditView (board click)
    TaskEditView/         — thin wrapper: renders TaskForm with taskId
    TaskForm/             — create & edit form (variant: 'page' | 'modal')
    TaskList/             — paginated filtered task list
    TaskSearchBar/        — debounced search input for /tasks
  projects/
    ProjectForm/          — create & edit form with RichTextEditor description
    ProjectList/          — project card grid
  layout/
    AppShell, Header, Sidebar
  charts/
    DonutChart, HBarChart — D3-based dashboard charts
```

Each component directory contains exactly one `.tsx` and one `.module.scss` file, named identically to the directory.

### Hooks (`src/hooks/`)

| Hook file           | Exports                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `useTasks.ts`       | `useTasks`, `useTask`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`; `taskKeys` |
| `useProjects.ts`    | `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, `useDeleteProject`; `projectKeys` |
| `useLists.ts`       | `useLists`, `useCreateList`, `useUpdateList`, `useDeleteList`, `useReorderList`; `listKeys` |
| `useStats.ts`       | `useStats` — aggregated counts for dashboard charts                 |
| `useDebouncedValue.ts` | Generic debounce hook (search, auto-description template)        |

### Lib utilities (`src/lib/`)

| File                          | Purpose                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| `storage.ts`                  | localStorage read/write; current key `trackr_v6`                     |
| `api/tasks.ts`                | Async wrapper for task CRUD                                           |
| `api/projects.ts`             | Async wrapper for project CRUD                                        |
| `api/lists.ts`                | Async wrapper for list CRUD                                           |
| `validations/task.ts`         | Zod schema + `CreateTaskInput`, `UpdateTaskInput`                     |
| `validations/project.ts`      | Zod schema + `CreateProjectInput`, `UpdateProjectInput`               |
| `validations/list.ts`         | Zod schema + `CreateListInput`, `UpdateListInput`                     |
| `utils.ts`                    | `cn()`, `createId()`, `formatDate()`, `slugify()`                    |
| `boardSearchParams.ts`        | `buildBoardUrl(filters)` — builds pre-filtered `/board?…` URLs       |
| `kanbanLists.ts`              | `BACKLOG_LIST_ID`, `isBacklogList()`                                  |
| `taskDescriptionTemplates.ts` | `buildDefaultTaskDescriptionHtml()`, `isHtmlDescriptionEmpty()`, `pickRelatedTaskTitles()` |
| `taskLabels.ts`               | `TASK_STATUS_LABEL`, `TASK_PRIORITY_LABEL`, `TASK_TYPE_LABEL` maps   |
| `taskSearch.ts`               | Client-side task search/filter logic                                  |

## Environment

No environment variables are required to run the app. It works entirely in the browser with localStorage.
