import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { CreateTaskView } from '@/components/tasks/CreateTaskView/CreateTaskView';
import styles from '../tasks.module.scss';

export const metadata: Metadata = { title: 'New Task' };

export default function NewTaskPage() {
	return (
		<>
			<Header title="New task" />
			<main className={styles.main}>
				<CreateTaskView />
			</main>
		</>
	);
}
