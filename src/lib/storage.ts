import type { Task, Project, PaginatedResponse, TaskFilters } from '@/types';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/validations/task';
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project';
import { createId, slugify } from '@/lib/utils';
import seedData from '@/data/seed.json';

const STORAGE_KEY = 'trackr_v1';

interface Store {
	tasks: Task[];
	projects: Project[];
	nextTaskNumber: number;
}

function read(): Store {
	if (typeof window === 'undefined') {
		return {
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
	trivial: 4,
};

export const storage = {
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
		const task: Task = {
			id: createId(),
			number: store.nextTaskNumber++,
			title: input.title,
			description: input.description ?? null,
			status: input.status ?? 'backlog',
			priority: input.priority ?? 'medium',
			type: input.type ?? 'task',
			projectId: input.projectId ?? '',
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

	resetToSeed(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
		}
	},
};
