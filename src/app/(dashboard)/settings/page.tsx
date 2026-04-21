import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
	return (
		<>
			<Header title="Settings" />
			<main style={{ padding: '1.5rem' }}>
				<p style={{ color: '#9da3b4' }}>Settings coming soon.</p>
			</main>
		</>
	);
}
