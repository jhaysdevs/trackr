import type { TaskPriority, TaskStatus, TaskType } from '@/types';

/** Human-readable labels — shared by Badge and task search. */
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
	backlog: 'Backlog',
	ready: 'Ready',
	in_progress: 'In Progress',
	code_review: 'Code Review',
	qa_testing: 'QA / Testing',
	blocked: 'Blocked',
	resolved: 'Resolved',
	closed: 'Closed',
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
	critical: 'Critical',
	high: 'High',
	medium: 'Medium',
	low: 'Low',
};

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
	bug: 'Bug',
	feature: 'Feature',
	enhancement: 'Enhancement',
	refactor: 'Refactor',
	tech_debt: 'Tech Debt',
	documentation: 'Docs',
	ui_ux: 'UI / UX',
	performance: 'Performance',
	security: 'Security',
	devops: 'DevOps',
	testing: 'Testing',
	spike: 'Spike',
	integration: 'Integration',
	accessibility: 'A11y',
};
