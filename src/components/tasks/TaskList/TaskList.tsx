'use client';

import Link from 'next/link';
import { CircleDot } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { buildBoardUrl } from '@/lib/boardSearchParams';
import {
	TASK_PRIORITY_LABEL,
	TASK_STATUS_LABEL,
	TASK_TYPE_LABEL,
} from '@/lib/taskLabels';
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
				<div key={task.id} className={styles.row}>
					<Link
						href={`/tasks/${task.id}`}
						className={styles.rowTaskHit}
						aria-label={`${task.title}, task ${task.number}`}
					/>
					<div className={styles.rowContent}>
						<span className={styles.number}>#{task.number}</span>
						<Link
							href={buildBoardUrl({ types: [task.type] })}
							className={styles.boardFilterLink}
							title={`Open board filtered by type: ${TASK_TYPE_LABEL[task.type]}`}
						>
							<Badge variant={{ kind: 'type', value: task.type }} />
						</Link>
						<span className={styles.title}>{task.title}</span>
						<div className={styles.meta}>
							<Link
								href={buildBoardUrl({ priorities: [task.priority] })}
								className={styles.boardFilterLink}
								title={`Open board filtered by priority: ${TASK_PRIORITY_LABEL[task.priority]}`}
							>
								<Badge variant={{ kind: 'priority', value: task.priority }} />
							</Link>
							<Link
								href={buildBoardUrl({ statuses: [task.status] })}
								className={styles.boardFilterLink}
								title={`Open board filtered by status: ${TASK_STATUS_LABEL[task.status]}`}
							>
								<Badge variant={{ kind: 'status', value: task.status }} />
							</Link>
						</div>
						<span className={styles.date}>{formatDate(task.createdAt, 'relative')}</span>
					</div>
				</div>
			))}
		</div>
	);
}
