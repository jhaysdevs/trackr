import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { TaskForm } from '@/components/tasks/TaskForm/TaskForm';
import styles from '../tasks.module.scss';

export const metadata: Metadata = { title: 'New Task' };

export default function NewTaskPage() {
	return (
		<>
			<Header title="New Task" />
			<main className={styles.main}>
				<TaskForm />
			</main>
		</>
	);
}
