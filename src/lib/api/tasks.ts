import type { Task, PaginatedResponse, TaskFilters } from '@/types';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/validations/task';
import { storage } from '@/lib/storage';

export const tasksApi = {
	list(filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> {
		return Promise.resolve(storage.listTasks(filters));
	},

	get(id: string): Promise<Task> {
		const task = storage.getTask(id);
		if (!task) return Promise.reject(new Error('Task not found'));
		return Promise.resolve(task);
	},

	create(data: CreateTaskInput): Promise<Task> {
		return Promise.resolve(storage.createTask(data));
	},

	update(id: string, data: UpdateTaskInput): Promise<Task> {
		const updated = storage.updateTask(id, data);
		if (!updated) return Promise.reject(new Error('Task not found'));
		return Promise.resolve(updated);
	},

	remove(id: string): Promise<void> {
		storage.deleteTask(id);
		return Promise.resolve();
	},

	reorderInList(listId: string, orderedIds: string[]): Promise<void> {
		storage.reorderTasksInList(listId, orderedIds);
		return Promise.resolve();
	},

	moveAndReorder(taskId: string, targetListId: string, orderedIds: string[]): Promise<void> {
		storage.moveAndReorder(taskId, targetListId, orderedIds);
		return Promise.resolve();
	},
};
