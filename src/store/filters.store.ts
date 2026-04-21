import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskFilters } from '@/types';

interface FiltersState {
	taskFilters: TaskFilters;
	setTaskFilters: (patch: Partial<TaskFilters>) => void;
	resetTaskFilters: () => void;
}

const defaultFilters: TaskFilters = {
	page: 1,
	pageSize: 25,
	sortBy: 'createdAt',
	sortDir: 'desc',
};

export const useFiltersStore = create<FiltersState>()(
	persist(
		(set) => ({
			taskFilters: defaultFilters,

			setTaskFilters: (patch) =>
				set((s) => ({ taskFilters: { ...s.taskFilters, ...patch, page: 1 } })),

			resetTaskFilters: () => set({ taskFilters: defaultFilters }),
		}),
		{ name: 'task-filters' }
	)
);
