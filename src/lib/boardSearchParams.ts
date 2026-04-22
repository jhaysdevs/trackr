import type { TaskPriority, TaskStatus, TaskType } from '@/types';

const PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

const STATUSES: TaskStatus[] = [
	'backlog',
	'ready',
	'in_progress',
	'code_review',
	'qa_testing',
	'blocked',
	'resolved',
	'closed',
];

const TYPES: TaskType[] = [
	'bug',
	'feature',
	'enhancement',
	'refactor',
	'tech_debt',
	'documentation',
	'ui_ux',
	'performance',
	'security',
	'devops',
	'testing',
	'spike',
	'integration',
	'accessibility',
];

function splitParam(value: string | null): string[] {
	if (!value) return [];
	return value.split(',').map((s) => s.trim()).filter(Boolean);
}

export interface BoardFiltersFromUrl {
	projectIds: string[];
	priorities: TaskPriority[];
	types: TaskType[];
	statuses: TaskStatus[];
	/** When set, the board scrolls this column into view (left-aligned in the horizontal scroller). */
	focusColumn: TaskStatus | null;
}

/** Default Kanban list id for a workflow status (matches seed `lst_*` ids). */
export function listIdForTaskStatus(status: TaskStatus): string {
	return `lst_${status}`;
}

export function parseBoardSearchParams(searchParams: URLSearchParams): BoardFiltersFromUrl {
	const projectIds = splitParam(searchParams.get('projects'));
	const priorities = splitParam(searchParams.get('priority')).filter((p): p is TaskPriority =>
		PRIORITIES.includes(p as TaskPriority)
	);
	const types = splitParam(searchParams.get('type')).filter((t): t is TaskType =>
		TYPES.includes(t as TaskType)
	);
	const statuses = splitParam(searchParams.get('status')).filter((s): s is TaskStatus =>
		STATUSES.includes(s as TaskStatus)
	);
	const columnRaw = searchParams.get('column');
	const focusColumn =
		columnRaw && STATUSES.includes(columnRaw as TaskStatus) ? (columnRaw as TaskStatus) : null;
	return { projectIds, priorities, types, statuses, focusColumn };
}

export function buildBoardUrl(partial: {
	projectIds?: string[];
	priorities?: TaskPriority[];
	types?: TaskType[];
	statuses?: TaskStatus[];
	focusColumn?: TaskStatus;
}): string {
	const params = new URLSearchParams();
	if (partial.projectIds?.length) params.set('projects', partial.projectIds.join(','));
	if (partial.priorities?.length) params.set('priority', partial.priorities.join(','));
	if (partial.types?.length) params.set('type', partial.types.join(','));
	if (partial.statuses?.length) params.set('status', partial.statuses.join(','));
	if (partial.focusColumn) params.set('column', partial.focusColumn);
	const q = params.toString();
	return q ? `/board?${q}` : '/board';
}
