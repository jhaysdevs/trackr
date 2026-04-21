import type { List } from '@/types';
import type { CreateListInput, UpdateListInput } from '@/lib/validations/list';
import { storage } from '@/lib/storage';

export const listsApi = {
	list(): Promise<List[]> {
		return Promise.resolve(storage.listLists());
	},

	get(id: string): Promise<List> {
		const list = storage.getList(id);
		if (!list) return Promise.reject(new Error('List not found'));
		return Promise.resolve(list);
	},

	create(data: CreateListInput): Promise<List> {
		return Promise.resolve(storage.createList(data));
	},

	update(id: string, data: UpdateListInput): Promise<List> {
		const updated = storage.updateList(id, data);
		if (!updated) return Promise.reject(new Error('List not found'));
		return Promise.resolve(updated);
	},

	remove(id: string): Promise<void> {
		const ok = storage.deleteList(id);
		if (!ok) {
			return Promise.reject(new Error('This list cannot be deleted'));
		}
		return Promise.resolve();
	},

	reorder(orderedIds: string[]): Promise<void> {
		storage.reorderLists(orderedIds);
		return Promise.resolve();
	},
};
