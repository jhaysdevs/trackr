import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { TaskEditView } from '@/components/tasks/TaskEditView/TaskEditView';
import styles from '../tasks.module.scss';

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	return { title: `Task ${id}` };
}

export default async function TaskPage({ params }: Props) {
	const { id } = await params;
	return (
		<>
			<Header title="Task" />
			<main className={styles.main}>
				<TaskEditView taskId={id} />
			</main>
		</>
	);
}
