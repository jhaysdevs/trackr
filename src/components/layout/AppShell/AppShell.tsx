import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import styles from './AppShell.module.scss';

interface AppShellProps {
	children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	return (
		<div className={styles.shell}>
			<Sidebar />
			<div className={styles.main}>{children}</div>
		</div>
	);
}
