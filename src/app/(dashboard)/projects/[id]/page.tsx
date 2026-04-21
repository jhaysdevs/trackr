import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { ProjectForm } from '@/components/projects/ProjectForm/ProjectForm';

export const metadata: Metadata = { title: 'Edit Project' };

interface Props {
	params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: Props) {
	const { id } = await params;
	return (
		<>
			<Header title="Edit Project" />
			<ProjectForm projectId={id} />
		</>
	);
}
