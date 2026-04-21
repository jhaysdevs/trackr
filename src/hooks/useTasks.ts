'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { statsKeys } from '@/hooks/useStats';
import type { TaskFilters } from '@/types';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/validations/task';

export const taskKeys = {
	all: () => ['tasks'] as const,
	lists: () => [...taskKeys.all(), 'list'] as const,
	list: (f: TaskFilters) => [...taskKeys.lists(), f] as const,
	details: () => [...taskKeys.all(), 'detail'] as const,
	detail: (id: string) => [...taskKeys.details(), id] as const,
};

export function useTasks(filters: TaskFilters = {}) {
	return useQuery({
		queryKey: taskKeys.list(filters),
		queryFn: () => tasksApi.list(filters),
	});
}

export function useTask(id: string) {
	return useQuery({
		queryKey: taskKeys.detail(id),
		queryFn: () => tasksApi.get(id),
		enabled: !!id,
	});
}

export function useCreateTask() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateTaskInput) => tasksApi.create(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: taskKeys.lists() });
			qc.invalidateQueries({ queryKey: statsKeys.all() });
		},
	});
}

export function useUpdateTask(id: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateTaskInput) => tasksApi.update(id, data),
		onSuccess: (updated) => {
			qc.invalidateQueries({ queryKey: taskKeys.lists() });
			qc.setQueryData(taskKeys.detail(id), updated);
			qc.invalidateQueries({ queryKey: statsKeys.all() });
		},
	});
}

export function useDeleteTask() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => tasksApi.remove(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: taskKeys.lists() });
			qc.invalidateQueries({ queryKey: statsKeys.all() });
		},
	});
}
