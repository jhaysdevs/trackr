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
	return { projectIds, priorities, types, statuses };
}

export function buildBoardUrl(partial: {
	projectIds?: string[];
	priorities?: TaskPriority[];
	types?: TaskType[];
	statuses?: TaskStatus[];
}): string {
	const params = new URLSearchParams();
	if (partial.projectIds?.length) params.set('projects', partial.projectIds.join(','));
	if (partial.priorities?.length) params.set('priority', partial.priorities.join(','));
	if (partial.types?.length) params.set('type', partial.types.join(','));
	if (partial.statuses?.length) params.set('status', partial.statuses.join(','));
	const q = params.toString();
	return q ? `/board?${q}` : '/board';
}
