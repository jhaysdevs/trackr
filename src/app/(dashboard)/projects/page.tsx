import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { ProjectList } from '@/components/projects/ProjectList/ProjectList';
import styles from './projects.module.scss';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
	return (
		<>
			<Header title="Projects" />
			<main className={styles.main}>
				<ProjectList />
			</main>
		</>
	);
}
