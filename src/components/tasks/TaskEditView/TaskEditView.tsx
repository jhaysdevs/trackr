'use client';

import { TaskForm } from '@/components/tasks/TaskForm/TaskForm';

export interface TaskEditViewProps {
	taskId: string;
	/** When provided (e.g. from a modal), the form shows Close actions instead of navigating to `/tasks`. */
	onDismiss?: () => void;
}

/**
 * Reusable task edit UI (same as `/tasks/[id]` page body). Use on a route or inside a modal.
 */
export function TaskEditView({ taskId, onDismiss }: TaskEditViewProps) {
	return <TaskForm taskId={taskId} variant={onDismiss ? 'modal' : 'page'} onDismiss={onDismiss} />;
}
