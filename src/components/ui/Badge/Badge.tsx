import { cn } from '@/lib/utils';
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

const STATUS_LABEL: Record<TaskStatus, string> = {
	backlog: 'Backlog',
	ready: 'Ready',
	in_progress: 'In Progress',
	code_review: 'Code Review',
	qa_testing: 'QA / Testing',
	blocked: 'Blocked',
	resolved: 'Resolved',
	closed: 'Closed',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
	critical: 'Critical',
	high: 'High',
	medium: 'Medium',
	low: 'Low',
};

const TYPE_LABEL: Record<TaskType, string> = {
	bug: 'Bug',
	feature: 'Feature',
	enhancement: 'Enhancement',
	refactor: 'Refactor',
	tech_debt: 'Tech Debt',
	documentation: 'Docs',
	ui_ux: 'UI / UX',
	performance: 'Performance',
	security: 'Security',
	devops: 'DevOps',
	testing: 'Testing',
	spike: 'Spike',
	integration: 'Integration',
	accessibility: 'A11y',
};

export function Badge({ variant, className }: BadgeProps) {
	let label = '';
	let variantClass = '';

	if (variant.kind === 'status') {
		label = STATUS_LABEL[variant.value];
		variantClass = styles[`status-${variant.value}`];
	} else if (variant.kind === 'priority') {
		label = PRIORITY_LABEL[variant.value];
		variantClass = styles[`priority-${variant.value}`];
	} else if (variant.kind === 'type') {
		label = TYPE_LABEL[variant.value];
		variantClass = styles[`type-${variant.value}`];
	} else {
		variantClass = variant.className;
	}

	if (!label && variant.kind !== 'custom') return null;

	return <span className={cn(styles.badge, variantClass, className)}>{label}</span>;
}
