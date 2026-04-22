'use client';

import { TaskForm } from '@/components/tasks/TaskForm/TaskForm';
import type { Task } from '@/types';

export interface CreateTaskViewProps {
	/** When set (e.g. from a modal), the form uses modal chrome and Close / Cancel call this. */
	onDismiss?: () => void;
	/** After successful create; when omitted, navigates to `/tasks/[id]` (default page behaviour). */
	onCreated?: (task: Task) => void;
}

/**
 * New-task form — same UI as `/tasks/new`. Use on a route or inside {@link NewTaskModal}.
 */
export function CreateTaskView({ onDismiss, onCreated }: CreateTaskViewProps) {
	return (
		<TaskForm variant={onDismiss ? 'modal' : 'page'} onDismiss={onDismiss} onCreated={onCreated} />
	);
}
