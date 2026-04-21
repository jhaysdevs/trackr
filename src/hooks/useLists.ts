'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listsApi } from '@/lib/api/lists';
import type { CreateListInput, UpdateListInput } from '@/lib/validations/list';

export const listKeys = {
	all: () => ['lists'] as const,
	lists: () => [...listKeys.all(), 'list'] as const,
	detail: (id: string) => [...listKeys.all(), 'detail', id] as const,
};

export function useLists() {
	return useQuery({
		queryKey: listKeys.lists(),
		queryFn: listsApi.list,
	});
}

export function useCreateList() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateListInput) => listsApi.create(data),
		onSuccess: () => qc.invalidateQueries({ queryKey: listKeys.lists() }),
	});
}

export function useUpdateList() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateListInput }) =>
			listsApi.update(id, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: listKeys.lists() }),
	});
}

export function useDeleteList() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => listsApi.remove(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: listKeys.lists() });
			// Tasks get their listId reassigned — refresh them too
			qc.invalidateQueries({ queryKey: ['tasks'] });
		},
	});
}

export function useReorderLists() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (orderedIds: string[]) => listsApi.reorder(orderedIds),
		onSuccess: () => qc.invalidateQueries({ queryKey: listKeys.lists() }),
	});
}
