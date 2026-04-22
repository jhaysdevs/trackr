'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor/RichTextEditor';
import {
	useProject,
	useCreateProject,
	useUpdateProject,
	useDeleteProject,
} from '@/hooks/useProjects';
import styles from './ProjectForm.module.scss';

const formSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	slug: z
		.string()
		.min(1, 'Slug is required')
		.max(50)
		.regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
	description: z.string().max(1000).optional(),
	status: z.enum(['active', 'archived', 'paused']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

function toSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

interface ProjectFormProps {
	projectId?: string;
}

export function ProjectForm({ projectId }: ProjectFormProps) {
	const router = useRouter();
	const isEdit = !!projectId;
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [saved, setSaved] = useState(false);

	const { data: project, isPending: projectLoading } = useProject(projectId ?? '');

	const createMutation = useCreateProject();
	const updateMutation = useUpdateProject(projectId ?? '');
	const deleteMutation = useDeleteProject();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			slug: '',
			description: '',
			status: 'active',
		},
		// values syncs reactively when project loads; keeps dirty edits on background refetch
		values: project
			? {
					name: project.name,
					slug: project.slug,
					description: project.description ?? '',
					status: project.status as 'active' | 'archived' | 'paused',
				}
			: undefined,
		resetOptions: { keepDirtyValues: true },
	});

	const watchedName = form.watch('name');
	const slugTouched = form.formState.dirtyFields.slug;

	useEffect(() => {
		if (!isEdit && !slugTouched && watchedName) {
			form.setValue('slug', toSlug(watchedName), { shouldValidate: false });
		}
	}, [watchedName, isEdit, slugTouched, form]);

	async function onSubmit(data: FormValues) {
		setSaved(false);
		const status = data.status ?? 'active';

		if (isEdit) {
			await updateMutation.mutateAsync({
				name: data.name,
				slug: data.slug,
				description: data.description,
				status,
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} else {
			const created = await createMutation.mutateAsync({
				name: data.name,
				slug: data.slug,
				description: data.description,
				status,
			});
			router.push(`/projects/${created.id}`);
		}
	}

	async function handleDelete() {
		if (!projectId) return;
		await deleteMutation.mutateAsync(projectId);
		router.push('/projects');
	}

	if (isEdit && projectLoading) {
		return (
			<div className={styles.container}>
				<div className={styles.skeletonBar} style={{ width: 120, height: 28 }} />
				<div className={styles.skeletonBar} style={{ height: 40, marginTop: 24 }} />
				<div className={styles.skeletonBar} style={{ height: 80, marginTop: 12 }} />
			</div>
		);
	}

	if (isEdit && !project) {
		return (
			<div className={styles.container}>
				<p className={styles.notFound}>Project not found.</p>
				<Button
					variant="ghost"
					size="sm"
					icon={<ArrowLeft size={14} />}
					onClick={() => router.push('/projects')}
				>
					Back to Projects
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
					onClick={() => router.push('/projects')}
				>
					Projects
				</Button>
			</div>

			<form className={styles.form} onSubmit={form.handleSubmit(onSubmit)} noValidate>
				<div className={styles.formHeader}>
					<h1 className={styles.heading}>{isEdit ? 'Edit Project' : 'New Project'}</h1>
				</div>

				<div className={styles.fields}>
					<div className={styles.grid2}>
						<Input
							label="Name"
							placeholder="e.g. Frontend Web App"
							{...form.register('name')}
							error={form.formState.errors.name?.message}
						/>
						<Input
							label="Slug"
							placeholder="e.g. frontend-web"
							{...form.register('slug')}
							error={form.formState.errors.slug?.message}
						/>
					</div>

					<div className={styles.fieldGroup}>
						<label className={styles.label} htmlFor="description">
							Description
						</label>
						<Controller
							control={form.control}
							name="description"
							render={({ field }) => (
								<RichTextEditor
									id="description"
									value={field.value ?? ''}
									onChange={field.onChange}
									minHeight={120}
								/>
							)}
						/>
					</div>

					<div className={styles.fieldGroup}>
						<label className={styles.label} htmlFor="status">
							Status
						</label>
						<select id="status" className={styles.select} {...form.register('status')}>
							<option value="active">Active</option>
							<option value="paused">Paused</option>
							<option value="archived">Archived</option>
						</select>
					</div>
				</div>

				<div className={styles.actions}>
					<div className={styles.actionsLeft}>
						<Button type="submit" variant="primary" loading={isBusy}>
							{isEdit ? 'Save Changes' : 'Create Project'}
						</Button>
						{saved && <span className={styles.savedMsg}>Saved</span>}
						<Button
							type="button"
							variant="ghost"
							onClick={() => router.push('/projects')}
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
