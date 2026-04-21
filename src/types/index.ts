// ─── Enums ───────────────────────────────────────────────────────────────────

export type TaskStatus =
	| 'backlog'
	| 'ready'
	| 'in_progress'
	| 'code_review'
	| 'qa_testing'
	| 'blocked'
	| 'resolved'
	| 'closed';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskType =
	| 'bug'
	| 'feature'
	| 'enhancement'
	| 'refactor'
	| 'tech_debt'
	| 'documentation'
	| 'ui_ux'
	| 'performance'
	| 'security'
	| 'devops'
	| 'testing'
	| 'spike'
	| 'integration'
	| 'accessibility';

export type ProjectStatus = 'active' | 'archived' | 'paused';

// ─── Domain Models ───────────────────────────────────────────────────────────

export interface List {
	id: string;
	name: string;
	color: string;
	position: number;
	/** When set, column shows count vs limit (e.g. Kanban WIP cap). */
	wipLimit?: number | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface User {
	id: string;
	name: string | null;
	email: string | null;
	image: string | null;
	emailVerified: Date | null;
	createdAt: Date;
}

export interface Project {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	status: ProjectStatus;
	ownerId: string;
	owner?: User;
	taskCount?: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface Label {
	id: string;
	name: string;
	color: string;
	projectId: string;
}

export interface Task {
	id: string;
	number: number;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	type: TaskType;
	projectId: string;
	project?: Project;
	listId?: string | null;
	position?: number | null;
	reporterId: string;
	reporter?: User;
	assigneeId: string | null;
	assignee?: User | null;
	labels?: Label[];
	parentId: string | null;
	dueDate: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Comment {
	id: string;
	body: string;
	taskId: string;
	authorId: string;
	author?: User;
	createdAt: Date;
	updatedAt: Date;
}

// ─── API Shapes ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface ApiError {
	message: string;
	code?: string;
	field?: string;
}

export interface StatsBucket {
	key: string;
	count: number;
}

export interface StatsResponse {
	byStatus: StatsBucket[];
	byType: StatsBucket[];
	byPriority: StatsBucket[];
	totals: {
		total: number;
		inProgress: number;
		blocked: number;
		closed: number;
	};
	demo: boolean;
}

// ─── Filter / Query Params ───────────────────────────────────────────────────

export interface TaskFilters {
	search?: string;
	status?: TaskStatus[];
	priority?: TaskPriority[];
	type?: TaskType[];
	assigneeId?: string;
	projectId?: string;
	labelIds?: string[];
	page?: number;
	pageSize?: number;
	sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'number';
	sortDir?: 'asc' | 'desc';
}
