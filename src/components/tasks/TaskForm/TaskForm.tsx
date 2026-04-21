'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Badge } from '@/components/ui/Badge/Badge';
import { RichTextEditor } from '@/components/ui/RichTextEditor/RichTextEditor';
import { useTask, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import type { TaskStatus, TaskPriority, TaskType } from '@/types';
import styles from './TaskForm.module.scss';

// dueDate is kept as a string (YYYY-MM-DD from the date input) and converted in onSubmit.
// projectId is validated manually in onSubmit for create mode.
// Enum fields use .optional() (not .default()) to keep input/output types aligned for zodResolver.
const formSchema = z.object({
	title: z.string().min(1, 'Title is required').max(255),
	description: z.string().max(10_000).optional(),
	status: z
		.enum([
			'backlog',
			'ready',
			'in_progress',
			'code_review',
			'qa_testing',
			'blocked',
			'resolved',
			'closed',
		])
		.optional(),
	priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
	type: z
		.enum([
			'bug',
			'feature',
			'enhancement',
			'refactor',
			'tech_debt',
			'documentation',
			'ui_ux',
			'performance',
			'security',
			'devops',
			'testing',
			'spike',
			'integration',
			'accessibility',
		])
		.optional(),
	projectId: z.string().optional(),
	dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
	{ value: 'backlog', label: 'Backlog' },
	{ value: 'ready', label: 'Ready' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'code_review', label: 'Code Review' },
	{ value: 'qa_testing', label: 'QA / Testing' },
	{ value: 'blocked', label: 'Blocked' },
	{ value: 'resolved', label: 'Resolved' },
	{ value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
	{ value: 'critical', label: 'Critical' },
	{ value: 'high', label: 'High' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'low', label: 'Low' },
];

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
	{ value: 'bug', label: 'Bug' },
	{ value: 'feature', label: 'Feature' },
	{ value: 'enhancement', label: 'Enhancement' },
	{ value: 'refactor', label: 'Refactor' },
	{ value: 'tech_debt', label: 'Tech Debt' },
	{ value: 'documentation', label: 'Documentation' },
	{ value: 'ui_ux', label: 'UI / UX' },
	{ value: 'performance', label: 'Performance' },
	{ value: 'security', label: 'Security' },
	{ value: 'devops', label: 'DevOps' },
	{ value: 'testing', label: 'Testing' },
	{ value: 'spike', label: 'Spike' },
	{ value: 'integration', label: 'Integration' },
	{ value: 'accessibility', label: 'Accessibility' },
];

function toDateInputValue(d: unknown): string {
	if (!d) return '';
	const date = typeof d === 'string' ? new Date(d) : (d as Date);
	try {
		return date.toISOString().split('T')[0];
	} catch {
		return '';
	}
}

interface TaskFormProps {
	taskId?: string;
}

export function TaskForm({ taskId }: TaskFormProps) {
	const router = useRouter();
	const isEdit = !!taskId;
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [saved, setSaved] = useState(false);

	const { data: task, isPending: taskLoading } = useTask(taskId ?? '');
	const { data: projectsData } = useProjects();
	const projects = projectsData?.data ?? [];

	const createMutation = useCreateTask();
	const updateMutation = useUpdateTask(taskId ?? '');
	const deleteMutation = useDeleteTask();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: '',
			description: '',
			status: 'backlog',
			priority: 'medium',
			type: 'feature',
			projectId: '',
			dueDate: '',
		},
	});

	useEffect(() => {
		if (task) {
			form.reset({
				title: task.title,
				description: task.description ?? '',
				status: task.status,
				priority: task.priority,
				type: task.type,
				projectId: task.projectId,
				dueDate: toDateInputValue(task.dueDate),
			});
		}
	}, [task, form]);

	const watchedProjectId = form.watch('projectId');
	const watchedDescription = form.watch('description') ?? '';
	const project = projects.find((p) => p.id === watchedProjectId);

	async function onSubmit(data: FormValues) {
		setSaved(false);
		const dueDate = data.dueDate ? new Date(data.dueDate) : null;
		const status = data.status ?? 'backlog';
		const priority = data.priority ?? 'medium';
		const type = data.type ?? 'feature';

		if (isEdit) {
			await updateMutation.mutateAsync({
				title: data.title,
				status,
				priority,
				type,
				description: data.description,
				projectId: data.projectId || undefined,
				dueDate,
				labelIds: [],
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} else {
			const created = await createMutation.mutateAsync({
				title: data.title,
				description: data.description,
				status,
				priority,
				type,
				projectId: data.projectId ?? '',
				dueDate,
				labelIds: [],
			});
			router.push(`/tasks/${created.id}`);
		}
	}

	async function handleDelete() {
		if (!taskId) return;
		await deleteMutation.mutateAsync(taskId);
		router.push('/tasks');
	}

	if (isEdit && taskLoading) {
		return (
			<div className={styles.container}>
				<div className={styles.skeletonBar} style={{ width: 120, height: 28 }} />
				<div className={styles.skeletonBar} style={{ height: 40, marginTop: 24 }} />
				<div className={styles.skeletonBar} style={{ height: 120, marginTop: 12 }} />
				<div className={styles.skeletonRow}>
					<div className={styles.skeletonBar} />
					<div className={styles.skeletonBar} />
					<div className={styles.skeletonBar} />
				</div>
			</div>
		);
	}

	if (isEdit && !task) {
		return (
			<div className={styles.container}>
				<p className={styles.notFound}>Task not found.</p>
				<Button
					variant="ghost"
					size="sm"
					icon={<ArrowLeft size={14} />}
					onClick={() => router.push('/tasks')}
				>
					Back to Tasks
				</Button>
			</div>
		);
	}

	const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

	return (
		<div className={styles.container}>
			<div className={styles.topBar}>
				<Button
					variant="ghost"
					size="sm"
					icon={<ArrowLeft size={14} />}
					onClick={() => router.push('/tasks')}
				>
					Tasks
				</Button>

				{isEdit && task && (
					<div className={styles.taskMeta}>
						<span className={styles.taskNumber}>#{task.number}</span>
						{project && <span className={styles.projectSlug}>{project.name}</span>}
					</div>
				)}
			</div>

			<form className={styles.form} onSubmit={form.handleSubmit(onSubmit)} noValidate>
				<div className={styles.formHeader}>
					<h1 className={styles.heading}>{isEdit ? 'Edit Task' : 'New Task'}</h1>
					{isEdit && task && (
						<div className={styles.badgeRow}>
							<Badge variant={{ kind: 'status', value: task.status }} />
							<Badge variant={{ kind: 'priority', value: task.priority }} />
							<Badge variant={{ kind: 'type', value: task.type }} />
						</div>
					)}
				</div>

				<div className={styles.fields}>
					<Input
						label="Title"
						placeholder="Short, descriptive summary"
						{...form.register('title')}
						error={form.formState.errors.title?.message}
					/>

					<div className={styles.fieldGroup}>
						<label className={styles.label} htmlFor="description">
							Description
						</label>
						<RichTextEditor
							id="description"
							value={watchedDescription}
							onChange={(html) =>
								form.setValue('description', html, { shouldDirty: true, shouldValidate: true })
							}
						/>
					</div>

					<div className={styles.grid3}>
						<div className={styles.fieldGroup}>
							<label className={styles.label} htmlFor="status">
								Status
							</label>
							<select id="status" className={styles.select} {...form.register('status')}>
								{STATUS_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label} htmlFor="priority">
								Priority
							</label>
							<select id="priority" className={styles.select} {...form.register('priority')}>
								{PRIORITY_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label} htmlFor="type">
								Type
							</label>
							<select id="type" className={styles.select} {...form.register('type')}>
								{TYPE_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className={styles.grid2}>
						<div className={styles.fieldGroup}>
							<label className={styles.label} htmlFor="projectId">
								Project
							</label>
							<select id="projectId" className={styles.select} {...form.register('projectId')}>
								<option value="">— no project —</option>
								{projects.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
							{form.formState.errors.projectId?.message && (
								<span className={styles.errorMsg}>{form.formState.errors.projectId.message}</span>
							)}
						</div>

						<Input label="Due Date" type="date" {...form.register('dueDate')} />
					</div>
				</div>

				<div className={styles.actions}>
					<div className={styles.actionsLeft}>
						<Button type="submit" variant="primary" loading={isBusy}>
							{isEdit ? 'Save Changes' : 'Create Task'}
						</Button>
						{saved && <span className={styles.savedMsg}>Saved</span>}
						<Button
							type="button"
							variant="ghost"
							onClick={() => router.push('/tasks')}
							disabled={isBusy}
						>
							Cancel
						</Button>
					</div>

					{isEdit && (
						<div className={styles.actionsRight}>
							{confirmDelete ? (
								<>
									<Button
										type="button"
										variant="danger"
										loading={deleteMutation.isPending}
										icon={<Trash2 size={14} />}
										onClick={handleDelete}
									>
										Confirm Delete
									</Button>
									<Button
										type="button"
										variant="ghost"
										disabled={deleteMutation.isPending}
										onClick={() => setConfirmDelete(false)}
									>
										Cancel
									</Button>
								</>
							) : (
								<Button
									type="button"
									variant="ghost"
									icon={<Trash2 size={14} />}
									onClick={() => setConfirmDelete(true)}
								>
									Delete
								</Button>
							)}
						</div>
					)}
				</div>
			</form>
		</div>
	);
}
