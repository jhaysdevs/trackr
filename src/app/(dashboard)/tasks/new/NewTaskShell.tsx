'use client';

import { Header } from '@/components/layout/Header/Header';
import { CreateTaskView } from '@/components/tasks/CreateTaskView/CreateTaskView';
import styles from '../tasks.module.scss';

/** App shell hides its page `<h1>` so {@link CreateTaskView} owns the single live “New task” heading. */
export function NewTaskShell() {
	return (
		<>
			<Header omitPageTitle />
			<main className={styles.main}>
				<CreateTaskView />
			</main>
		</>
	);
}
