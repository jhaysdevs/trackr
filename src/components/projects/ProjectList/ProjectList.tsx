'use client';

import { useRouter } from 'next/navigation';
import { Plus, Folder } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/Button/Button';
import type { Project } from '@/types';
import styles from './ProjectList.module.scss';

function statusLabel(status: string) {
	if (status === 'active') return 'Active';
	if (status === 'paused') return 'Paused';
	return 'Archived';
}

interface ProjectCardProps {
	project: Project;
	taskCount: number;
}

function ProjectCard({ project, taskCount }: ProjectCardProps) {
	const router = useRouter();
	return (
		<button
			className={styles.card}
			onClick={() => router.push(`/projects/${project.id}`)}
			data-status={project.status}
		>
			<div className={styles.cardIcon}>
				<Folder size={20} />
			</div>
			<div className={styles.cardBody}>
				<div className={styles.cardHeader}>
					<span className={styles.cardName}>{project.name}</span>
					<span className={styles.cardSlug}>{project.slug}</span>
				</div>
				{project.description && <p className={styles.cardDesc}>{project.description}</p>}
				<div className={styles.cardMeta}>
					<span className={styles.taskCount}>
						{taskCount} {taskCount === 1 ? 'task' : 'tasks'}
					</span>
					<span className={styles.statusBadge} data-status={project.status}>
						{statusLabel(project.status)}
					</span>
				</div>
			</div>
		</button>
	);
}

export function ProjectList() {
	const router = useRouter();
	const { data: projectsData, isPending: projectsLoading } = useProjects();
	const { data: tasksData } = useTasks({ pageSize: 10_000 });

	const projects = projectsData?.data ?? [];
	const tasks = tasksData?.data ?? [];

	const taskCountByProject: Record<string, number> = {};
	for (const task of tasks) {
		if (task.projectId) {
			taskCountByProject[task.projectId] = (taskCountByProject[task.projectId] ?? 0) + 1;
		}
	}

	if (projectsLoading) {
		return (
			<div className={styles.grid}>
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className={styles.skeletonCard} />
				))}
			</div>
		);
	}

	return (
		<div className={styles.root}>
			<div className={styles.toolbar}>
				<span className={styles.count}>
					{projects.length} {projects.length === 1 ? 'project' : 'projects'}
				</span>
				<Button
					variant="primary"
					size="sm"
					icon={<Plus size={14} />}
					onClick={() => router.push('/projects/new')}
				>
					New Project
				</Button>
			</div>

			{projects.length === 0 ? (
				<div className={styles.empty}>
					<Folder size={40} />
					<p>No projects yet.</p>
					<Button
						variant="primary"
						icon={<Plus size={14} />}
						onClick={() => router.push('/projects/new')}
					>
						Create your first project
					</Button>
				</div>
			) : (
				<div className={styles.grid}>
					{projects.map((project) => (
						<ProjectCard
							key={project.id}
							project={project}
							taskCount={taskCountByProject[project.id] ?? 0}
						/>
					))}
				</div>
			)}
		</div>
	);
}
