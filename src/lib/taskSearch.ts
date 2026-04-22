import type { List, Project, Task } from '@/types';
import { formatDate } from '@/lib/utils';
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL, TASK_TYPE_LABEL } from '@/lib/taskLabels';

export interface TaskSearchContext {
	project?: Project | null;
	list?: List | null;
}

/** Lowercased concatenation of fields users may type when searching. */
export function buildTaskSearchHaystack(task: Task, ctx?: TaskSearchContext): string {
	const parts: string[] = [
		task.title,
		task.description ?? '',
		String(task.number),
		`#${task.number}`,
		task.id,
		task.priority,
		TASK_PRIORITY_LABEL[task.priority],
		task.status,
		TASK_STATUS_LABEL[task.status],
		task.type,
		TASK_TYPE_LABEL[task.type],
		task.projectId,
		task.listId ?? '',
		task.assigneeId ?? '',
		task.reporterId ?? '',
	];

	const ca = task.createdAt as unknown as string;
	const ua = task.updatedAt as unknown as string;
	if (ca) {
		parts.push(ca, formatDate(ca, 'short'), formatDate(ca, 'long'));
	}
	if (ua) {
		parts.push(ua, formatDate(ua, 'short'), formatDate(ua, 'long'));
	}
	if (task.dueDate) {
		const raw = task.dueDate as unknown as string;
		parts.push(raw, formatDate(raw, 'short'), formatDate(raw, 'long'));
		const dt = new Date(raw);
		parts.push(String(dt.getFullYear()));
		parts.push(dt.toLocaleString('en-US', { month: 'long' }));
		parts.push(String(dt.getMonth() + 1).padStart(2, '0'));
		parts.push(String(dt.getDate()));
	}

	if (task.labels?.length) {
		for (const lb of task.labels) {
			parts.push(lb.name);
		}
	}

	if (ctx?.project) {
		parts.push(ctx.project.name, ctx.project.slug);
	}
	if (ctx?.list) {
		parts.push(ctx.list.name);
	}

	return parts.filter(Boolean).join(' ').toLowerCase();
}

/** All whitespace-separated terms must appear somewhere in the haystack (order-independent). */
export function taskMatchesQuery(task: Task, rawQuery: string, ctx?: TaskSearchContext): boolean {
	const trimmed = rawQuery.trim().toLowerCase();
	if (!trimmed) return true;
	const tokens = trimmed.split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return true;
	const hay = buildTaskSearchHaystack(task, ctx);
	return tokens.every((t) => hay.includes(t));
}
