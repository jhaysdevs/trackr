import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { ProjectForm } from '@/components/projects/ProjectForm/ProjectForm';

export const metadata: Metadata = { title: 'New Project' };

export default function NewProjectPage() {
	return (
		<>
			<Header title="New Project" />
			<ProjectForm />
		</>
	);
}
