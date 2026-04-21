import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return <AppShell>{children}</AppShell>;
}
