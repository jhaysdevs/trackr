import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatDate, cn } from '@/lib/utils';
import type { Task } from '@/types';
import styles from './TaskCard.module.scss';

interface TaskCardProps {
	task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
	const isOverdue =
		task.dueDate &&
		new Date(task.dueDate) < new Date() &&
		task.status !== 'resolved' &&
		task.status !== 'closed';

	return (
		<Link href={`/tasks/${task.id}`} className={styles.card}>
			<div className={styles.top}>
				<div className={styles.meta}>
					<span className={styles.taskNumber}>#{task.number}</span>
					<Badge variant={{ kind: 'type', value: task.type }} />
				</div>
				<Badge variant={{ kind: 'priority', value: task.priority }} />
			</div>

			<p className={styles.title}>{task.title}</p>

			<div className={styles.footer}>
				<div className={styles.footerLeft}>
					<Badge variant={{ kind: 'status', value: task.status }} />
				</div>

				<div className={styles.footerLeft}>
					{task.assignee && (
						<div className={styles.assignee}>
							<div className={styles.avatar}>
								{(task.assignee.name ?? task.assignee.email ?? '?').charAt(0).toUpperCase()}
							</div>
						</div>
					)}
					{task.dueDate && (
						<span className={cn(styles.dueDate, isOverdue && styles.dueDateOverdue)}>
							{formatDate(task.dueDate, 'short')}
						</span>
					)}
				</div>
			</div>
		</Link>
	);
}
