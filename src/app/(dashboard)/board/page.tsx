import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';

export const metadata: Metadata = { title: 'Board' };

export default function BoardPage() {
	return (
		<>
			<Header title="Board" />
			<main style={{ padding: '1.5rem' }}>
				<p style={{ color: '#9da3b4' }}>Kanban board coming soon.</p>
			</main>
		</>
	);
}
