import type { Task, Project, List, PaginatedResponse, TaskFilters } from '@/types';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/validations/task';
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project';
import type { CreateListInput, UpdateListInput } from '@/lib/validations/list';
import { createId, slugify } from '@/lib/utils';
import seedData from '@/data/seed.json';

const STORAGE_KEY = 'trackr_v6';

interface Store {
	lists: List[];
	tasks: Task[];
	projects: Project[];
	nextTaskNumber: number;
}

function read(): Store {
	if (typeof window === 'undefined') {
		return {
			lists: seedData.lists as unknown as List[],
			tasks: seedData.tasks as unknown as Task[],
			projects: seedData.projects as unknown as Project[],
			nextTaskNumber: seedData.tasks.length + 1,
		};
	}
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw) {
		try {
			return JSON.parse(raw) as Store;
		} catch {
			// corrupted — fall through to re-seed
		}
	}
	const store: Store = {
		lists: seedData.lists as unknown as List[],
		tasks: seedData.tasks as unknown as Task[],
		projects: seedData.projects as unknown as Project[],
		nextTaskNumber: seedData.tasks.length + 1,
	};
	localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
	return store;
}

function write(store: Store): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
	}
}

const SORT_PRIORITY: Record<string, number> = {
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
};

export const storage = {
	// ─── Lists ────────────────────────────────────────────────────────────────

	listLists(): List[] {
		return [...read().lists].sort((a, b) => a.position - b.position);
	},

	getList(id: string): List | null {
		return read().lists.find((l) => l.id === id) ?? null;
	},

	createList(input: CreateListInput): List {
		const store = read();
		const now = new Date().toISOString();
		const maxPos = store.lists.reduce((m, l) => Math.max(m, l.position), -1);
		const list: List = {
			id: createId(),
			name: input.name,
			color: input.color ?? '#4b5563',
			position: input.position ?? maxPos + 1,
			createdAt: now as unknown as Date,
			updatedAt: now as unknown as Date,
		};
		store.lists.push(list);
		write(store);
		return list;
	},

	updateList(id: string, input: UpdateListInput): List | null {
		const store = read();
		const idx = store.lists.findIndex((l) => l.id === id);
		if (idx === -1) return null;
		const now = new Date().toISOString();
		store.lists[idx] = {
			...store.lists[idx],
			...(input.name !== undefined && { name: input.name }),
			...(input.color !== undefined && { color: input.color }),
			...(input.position !== undefined && { position: input.position }),
			updatedAt: now as unknown as Date,
		};
		write(store);
		return store.lists[idx];
	},

	deleteList(id: string): boolean {
		const store = read();
		const remaining = store.lists.filter((l) => l.id !== id);
		if (remaining.length === 0) return false; // always keep at least one list
		// Migrate tasks to the lowest-position remaining list
		const fallback = [...remaining].sort((a, b) => a.position - b.position)[0];
		store.tasks = store.tasks.map((t) =>
			t.listId === id ? { ...t, listId: fallback.id } : t
		);
		store.lists = remaining;
		// Compact positions
		[...remaining].sort((a, b) => a.position - b.position).forEach((l, i) => {
			l.position = i;
		});
		write(store);
		return true;
	},

	reorderLists(orderedIds: string[]): void {
		const store = read();
		orderedIds.forEach((id, idx) => {
			const list = store.lists.find((l) => l.id === id);
			if (list) list.position = idx;
		});
		write(store);
	},

	// ─── Projects ─────────────────────────────────────────────────────────────

	listProjects(): PaginatedResponse<Project> {
		const store = read();
		const data = [...store.projects].sort(
			(a, b) =>
				new Date(b.createdAt as unknown as string).getTime() -
				new Date(a.createdAt as unknown as string).getTime()
		);
		return { data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 };
	},

	getProject(id: string): Project | null {
		return read().projects.find((p) => p.id === id) ?? null;
	},

	createProject(input: CreateProjectInput): Project {
		const store = read();
		const now = new Date().toISOString();
		const project: Project = {
			id: createId(),
			slug: input.slug ?? slugify(input.name),
			name: input.name,
			description: input.description ?? null,
			status: input.status ?? 'active',
			ownerId: 'admin',
			createdAt: now as unknown as Date,
			updatedAt: now as unknown as Date,
		};
		store.projects.push(project);
		write(store);
		return project;
	},

	updateProject(id: string, input: UpdateProjectInput): Project | null {
		const store = read();
		const idx = store.projects.findIndex((p) => p.id === id);
		if (idx === -1) return null;
		const now = new Date().toISOString();
		store.projects[idx] = {
			...store.projects[idx],
			...(input.name !== undefined && { name: input.name }),
			...(input.slug !== undefined && { slug: input.slug }),
			...(input.description !== undefined && { description: input.description ?? null }),
			...(input.status !== undefined && { status: input.status }),
			updatedAt: now as unknown as Date,
		};
		write(store);
		return store.projects[idx];
	},

	deleteProject(id: string): boolean {
		const store = read();
		const before = store.projects.length;
		store.projects = store.projects.filter((p) => p.id !== id);
		store.tasks = store.tasks.filter((i) => i.projectId !== id);
		write(store);
		return store.projects.length < before;
	},

	// ─── Tasks ───────────────────────────────────────────────────────────────

	listTasks(filters: TaskFilters = {}): PaginatedResponse<Task> {
		const store = read();
		let rows = [...store.tasks];

		if (filters.search) {
			const q = filters.search.toLowerCase();
			rows = rows.filter((i) => i.title.toLowerCase().includes(q));
		}
		if (filters.status?.length) {
			rows = rows.filter((i) => filters.status!.includes(i.status));
		}
		if (filters.priority?.length) {
			rows = rows.filter((i) => filters.priority!.includes(i.priority));
		}
		if (filters.type?.length) {
			rows = rows.filter((i) => filters.type!.includes(i.type));
		}
		if (filters.projectId) {
			rows = rows.filter((i) => i.projectId === filters.projectId);
		}

		const sortBy = filters.sortBy ?? 'createdAt';
		const dir = filters.sortDir === 'asc' ? 1 : -1;
		rows.sort((a, b) => {
			if (sortBy === 'priority') {
				return dir * (SORT_PRIORITY[a.priority] - SORT_PRIORITY[b.priority]);
			}
			if (sortBy === 'number') {
				return dir * (a.number - b.number);
			}
			const av = new Date(a[sortBy] as unknown as string).getTime();
			const bv = new Date(b[sortBy] as unknown as string).getTime();
			return dir * (av - bv);
		});

		const page = filters.page ?? 1;
		const pageSize = Math.min(filters.pageSize ?? 25, 100);
		const total = rows.length;
		const data = rows.slice((page - 1) * pageSize, page * pageSize);

		return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
	},

	getTask(id: string): Task | null {
		return read().tasks.find((i) => i.id === id) ?? null;
	},

	createTask(input: CreateTaskInput): Task {
		const store = read();
		const now = new Date().toISOString();
		const listId = input.listId ?? null;
		const maxPos = store.tasks
			.filter((t) => t.listId === listId)
			.reduce((m, t) => Math.max(m, (t.position as unknown as number) ?? -1), -1);
		const task: Task = {
			id: createId(),
			number: store.nextTaskNumber++,
			title: input.title,
			description: input.description ?? null,
			status: input.status ?? 'backlog',
			priority: input.priority ?? 'medium',
			type: input.type ?? 'feature',
			projectId: input.projectId ?? '',
			listId,
			position: maxPos + 1,
			reporterId: 'admin',
			assigneeId: input.assigneeId ?? null,
			parentId: input.parentId ?? null,
			dueDate: input.dueDate ? (input.dueDate as unknown as Date) : null,
			createdAt: now as unknown as Date,
			updatedAt: now as unknown as Date,
		};
		store.tasks.push(task);
		write(store);
		return task;
	},

	updateTask(id: string, input: UpdateTaskInput): Task | null {
		const store = read();
		const idx = store.tasks.findIndex((i) => i.id === id);
		if (idx === -1) return null;
		const now = new Date().toISOString();
		store.tasks[idx] = {
			...store.tasks[idx],
			...(input.title !== undefined && { title: input.title }),
			...(input.description !== undefined && { description: input.description ?? null }),
			...(input.status !== undefined && { status: input.status }),
			...(input.priority !== undefined && { priority: input.priority }),
			...(input.type !== undefined && { type: input.type }),
			...(input.projectId !== undefined && { projectId: input.projectId }),
			...(input.listId !== undefined && { listId: input.listId }),
			...(input.position !== undefined && { position: input.position ?? null }),
			...(input.assigneeId !== undefined && { assigneeId: input.assigneeId ?? null }),
			...(input.parentId !== undefined && { parentId: input.parentId ?? null }),
			...(input.dueDate !== undefined && {
				dueDate: input.dueDate ? (input.dueDate as unknown as Date) : null,
			}),
			updatedAt: now as unknown as Date,
		};
		write(store);
		return store.tasks[idx];
	},

	deleteTask(id: string): boolean {
		const store = read();
		const before = store.tasks.length;
		store.tasks = store.tasks.filter((i) => i.id !== id);
		write(store);
		return store.tasks.length < before;
	},

	reorderTasksInList(listId: string, orderedIds: string[]): void {
		const store = read();
		orderedIds.forEach((id, idx) => {
			const task = store.tasks.find((t) => t.id === id);
			if (task) task.position = idx as unknown as null;
		});
		write(store);
	},

	moveAndReorder(taskId: string, targetListId: string, orderedIds: string[]): void {
		const store = read();
		const task = store.tasks.find((t) => t.id === taskId);
		if (task) task.listId = targetListId;
		orderedIds.forEach((id, idx) => {
			const t = store.tasks.find((t) => t.id === id);
			if (t) t.position = idx as unknown as null;
		});
		write(store);
	},

	resetToSeed(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
		}
	},
};
