import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
	return (
		<>
			<Header title="Dashboard" />
			<DashboardClient />
		</>
	);
}
