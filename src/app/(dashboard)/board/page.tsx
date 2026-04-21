import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { KanbanBoard } from '@/components/tasks/KanbanBoard/KanbanBoard';
import styles from './board.module.scss';

export const metadata: Metadata = { title: 'Board' };

export default function BoardPage() {
	return (
		<>
			<Header title="Board" />
			<div className={styles.boardWrap}>
				<KanbanBoard />
			</div>
		</>
	);
}
