'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project';

export const projectKeys = {
	all: () => ['projects'] as const,
	lists: () => [...projectKeys.all(), 'list'] as const,
	detail: (id: string) => [...projectKeys.all(), 'detail', id] as const,
};

export function useProjects() {
	return useQuery({
		queryKey: projectKeys.lists(),
		queryFn: projectsApi.list,
		staleTime: 60_000,
	});
}

export function useProject(id: string) {
	return useQuery({
		queryKey: projectKeys.detail(id),
		queryFn: () => projectsApi.get(id),
		enabled: !!id,
	});
}

export function useCreateProject() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateProjectInput) => projectsApi.create(data),
		onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
	});
}

export function useUpdateProject(id: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateProjectInput) => projectsApi.update(id, data),
		onSuccess: (updated) => {
			qc.invalidateQueries({ queryKey: projectKeys.lists() });
			qc.setQueryData(projectKeys.detail(id), updated);
		},
	});
}

export function useDeleteProject() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => projectsApi.remove(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
	});
}
