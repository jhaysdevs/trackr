# Trackr

Internal task tracker for software development teams. Create and triage bugs, features, enhancements, and spikes across multiple projects with a dashboard, list view, and Kanban board.

## Stack

| Layer           | Choice                                             |
| --------------- | -------------------------------------------------- |
| Framework       | Next.js 16 (App Router) + React 19                 |
| Language        | TypeScript (strict)                                |
| Styling         | SASS modules (custom design system, dark-only)     |
| Server state    | TanStack Query v5                                  |
| Client/UI state | Zustand v5                                         |
| Persistence     | localStorage (seed data from `src/data/seed.json`) |
| Validation      | Zod + React Hook Form v7                           |
| Rich text       | TipTap v3 (WYSIWYG editor for task/project descriptions) |
| Charts          | D3                                                 |
| Icons           | Lucide React                                       |

No database, no authentication. All users act as admin. Data lives in the browser's `localStorage` and is pre-seeded with realistic sample tasks and projects on first run.

## Getting Started

**1. Install dependencies**

```bash
pnpm i
```

**2. Run the dev server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — root redirects to `/dashboard`.

Sample data loads automatically on first visit. To reset to the original seed data, open the browser console and run:

```js
localStorage.removeItem('trackr_v6');
location.reload();
```

## Scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Start development server      |
| `pnpm build`      | Production build              |
| `pnpm lint`       | Run ESLint                    |
| `pnpm type-check` | TypeScript check without emit |
| `pnpm format`     | Prettier: format all files    |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Route group (AppShell wrapper)
│   │   ├── dashboard/        # Stats, charts
│   │   ├── tasks/            # Task list + [id] detail/edit + new
│   │   ├── projects/         # Project list + [id] edit + new
│   │   ├── board/            # Kanban board
│   │   └── settings/
│   ├── globals.scss
│   └── layout.tsx
├── components/
│   ├── ui/                   # Primitives: Button, Input, Badge, RichTextEditor (TipTap)
│   ├── tasks/                # TaskCard, TaskList, TaskForm, KanbanBoard, TaskDetailModal
│   ├── projects/             # ProjectList, ProjectForm
│   ├── charts/               # DonutChart, HBarChart
│   └── layout/               # AppShell, Sidebar, Header
├── data/
│   └── seed.json             # Initial tasks, projects, and lists
├── hooks/                    # TanStack Query hooks (useTasks, useProjects, useLists, useStats)
├── lib/
│   ├── api/                  # Promise wrappers over storage (tasks.ts, projects.ts, lists.ts)
│   ├── storage.ts            # localStorage read/write layer (key: trackr_v6)
│   ├── validations/          # Zod schemas + inferred types
│   ├── boardSearchParams.ts  # buildBoardUrl() for pre-filtered board links
│   ├── kanbanLists.ts        # BACKLOG_LIST_ID, isBacklogList()
│   ├── taskDescriptionTemplates.ts  # Auto-generated task description HTML
│   ├── taskLabels.ts         # Display-name maps for status/priority/type
│   ├── taskSearch.ts         # Client-side filter/search logic
│   └── utils.ts              # cn(), createId(), formatDate(), slugify()
├── providers/                # QueryClientProvider
├── store/                    # Zustand: ui.store.ts, filters.store.ts
├── styles/                   # _variables, _mixins, _reset, _typography
└── types/                    # Shared TypeScript interfaces
```

## Data Model

```
projects
  └── tasks (projectId, optional)
        └── tasks (self-ref: parentId for sub-tasks)

lists (Kanban columns)
  └── tasks (listId, optional — defaults to Backlog list)
```

**Task statuses:** `backlog` → `ready` → `in_progress` → `code_review` → `qa_testing` → `resolved` / `closed` / `blocked`

**Task types:** `bug`, `feature`, `enhancement`, `refactor`, `tech_debt`, `documentation`, `ui_ux`, `performance`, `security`, `devops`, `testing`, `spike`, `integration`, `accessibility`

**Priority levels:** `critical`, `high`, `medium`, `low`

**Kanban lists:** User-created columns with optional WIP limits. The Backlog list (`lst_backlog`) is permanent; deleting any other list moves its tasks to Backlog.

## State Architecture

Server state (async data) is managed through TanStack Query with key factories in `src/hooks/`. Client/UI state (sidebar, modals) lives in Zustand. Task filters are persisted in `localStorage` via Zustand's `persist` middleware so filter selections survive page refreshes.

All mutations invalidate the relevant TanStack Query cache keys, so lists and stats update automatically after create/edit/delete.

## Rich Text Descriptions

Tasks and projects both have rich-text description fields powered by TipTap v3. Descriptions are stored as HTML strings. The `RichTextEditor` component (`src/components/ui/RichTextEditor/`) handles:

- Toolbar: bold, italic, underline, inline code, code block, H2, bullet list, ordered list, undo/redo
- Plain-text legacy values are auto-converted to `<p>` HTML on load
- Used as a controlled component via react-hook-form's `Controller`

## Todo (future)

- **Persistence:** Replace or extend `src/lib/storage.ts` so persistence uses **Postgres** (or another production-ready database) instead of browser `localStorage`, while keeping the existing API layer (`src/lib/api/*`) as the seam TanStack Query talks to.
