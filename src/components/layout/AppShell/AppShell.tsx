'use client';

import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import styles from './AppShell.module.scss';

interface AppShellProps {
	children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	const { mobileSidebarOpen, closeMobileSidebar } = useUiStore();

	return (
		<div className={styles.shell}>
			<Sidebar />
			{mobileSidebarOpen && (
				<div className={cn(styles.overlay)} onClick={closeMobileSidebar} aria-hidden="true" />
			)}
			<div className={styles.main}>{children}</div>
		</div>
	);
}
