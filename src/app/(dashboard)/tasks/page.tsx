import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { TaskSearchBar } from '@/components/tasks/TaskSearchBar/TaskSearchBar';
import { TaskList } from '@/components/tasks/TaskList/TaskList';
import styles from './tasks.module.scss';

export const metadata: Metadata = { title: 'Tasks' };

export default function TasksPage() {
	return (
		<>
			<Header title="Tasks" />
			<main className={styles.main}>
				<div className={styles.tasksToolbar}>
					<TaskSearchBar />
				</div>
				<TaskList />
			</main>
		</>
	);
}
