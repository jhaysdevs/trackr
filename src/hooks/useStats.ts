'use client';

import { useQuery } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import type { StatsResponse, TaskStatus, TaskPriority, TaskType } from '@/types';

export const statsKeys = {
	all: () => ['stats'] as const,
};

function computeStats(): StatsResponse {
	const { data: tasks } = storage.listTasks({ pageSize: 10_000 });

	const byStatusMap = new Map<TaskStatus, number>();
	const byPriorityMap = new Map<TaskPriority, number>();
	const byTypeMap = new Map<TaskType, number>();

	for (const task of tasks) {
		byStatusMap.set(task.status, (byStatusMap.get(task.status) ?? 0) + 1);
		byPriorityMap.set(task.priority, (byPriorityMap.get(task.priority) ?? 0) + 1);
		byTypeMap.set(task.type, (byTypeMap.get(task.type) ?? 0) + 1);
	}

	const total = tasks.length;

	return {
		demo: false,
		totals: {
			total,
			inProgress: byStatusMap.get('in_progress') ?? 0,
			blocked: byStatusMap.get('blocked') ?? 0,
			closed: (byStatusMap.get('closed') ?? 0) + (byStatusMap.get('resolved') ?? 0),
		},
		byStatus: Array.from(byStatusMap.entries()).map(([key, count]) => ({ key, count })),
		byPriority: Array.from(byPriorityMap.entries()).map(([key, count]) => ({ key, count })),
		byType: Array.from(byTypeMap.entries()).map(([key, count]) => ({ key, count })),
	};
}

export function useStats() {
	return useQuery({
		queryKey: statsKeys.all(),
		queryFn: () => Promise.resolve(computeStats()),
		staleTime: 0,
		refetchOnWindowFocus: false,
	});
}
