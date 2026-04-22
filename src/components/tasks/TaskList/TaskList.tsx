'use client';

import Link from 'next/link';
import { CircleDot } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatDate } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { useFiltersStore } from '@/store/filters.store';
import type { Task } from '@/types';
import styles from './TaskList.module.scss';

export function TaskList() {
	const filters = useFiltersStore((s) => s.taskFilters);
	const hasSearch = Boolean(filters.search?.trim());
	const { data, isPending } = useTasks(filters);

	if (isPending) {
		return (
			<div className={styles.container}>
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className={styles.skeleton} />
				))}
			</div>
		);
	}

	if (!data?.data.length) {
		return (
			<div className={styles.empty}>
				<CircleDot size={32} />
				<span>{hasSearch ? 'No tasks match your search' : 'No tasks found'}</span>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			{data.data.map((task: Task) => (
				<Link key={task.id} href={`/tasks/${task.id}`} className={styles.row}>
					<span className={styles.number}>#{task.number}</span>
					<Badge variant={{ kind: 'type', value: task.type }} />
					<span className={styles.title}>{task.title}</span>
					<div className={styles.meta}>
						<Badge variant={{ kind: 'priority', value: task.priority }} />
						<Badge variant={{ kind: 'status', value: task.status }} />
					</div>
					<span className={styles.date}>{formatDate(task.createdAt, 'relative')}</span>
				</Link>
			))}
		</div>
	);
}
