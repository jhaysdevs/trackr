import { cn } from '@/lib/utils';
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL, TASK_TYPE_LABEL } from '@/lib/taskLabels';
import type { TaskStatus, TaskPriority, TaskType } from '@/types';
import styles from './Badge.module.scss';

type BadgeVariant =
	| { kind: 'status'; value: TaskStatus }
	| { kind: 'priority'; value: TaskPriority }
	| { kind: 'type'; value: TaskType }
	| { kind: 'custom'; className: string };

interface BadgeProps {
	variant: BadgeVariant;
	className?: string;
}

export function Badge({ variant, className }: BadgeProps) {
	let label = '';
	let variantClass = '';

	if (variant.kind === 'status') {
		label = TASK_STATUS_LABEL[variant.value];
		variantClass = styles[`status-${variant.value}`];
	} else if (variant.kind === 'priority') {
		label = TASK_PRIORITY_LABEL[variant.value];
		variantClass = styles[`priority-${variant.value}`];
	} else if (variant.kind === 'type') {
		label = TASK_TYPE_LABEL[variant.value];
		variantClass = styles[`type-${variant.value}`];
	} else {
		variantClass = variant.className;
	}

	if (!label && variant.kind !== 'custom') return null;

	return <span className={cn(styles.badge, variantClass, className)}>{label}</span>;
}
