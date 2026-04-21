'use client';

import { PanelLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/store/ui.store';
import { Button } from '@/components/ui/Button/Button';
import styles from './Header.module.scss';

interface HeaderProps {
	title?: string;
}

export function Header({ title = 'Tasks' }: HeaderProps) {
	const router = useRouter();
	const { toggleSidebar, toggleMobileSidebar } = useUiStore();

	function handleToggle() {
		// On mobile (< 768px) open/close the drawer; on desktop collapse the sidebar
		if (window.innerWidth < 768) {
			toggleMobileSidebar();
		} else {
			toggleSidebar();
		}
	}

	return (
		<header className={styles.header}>
			<div className={styles.left}>
				<button className={styles.toggleBtn} onClick={handleToggle} aria-label="Toggle sidebar">
					<PanelLeft size={18} />
				</button>
				{title && <h1 className={styles.pageTitle}>{title}</h1>}
			</div>
			<div className={styles.right}>
				<Button
					variant="primary"
					size="sm"
					icon={<Plus size={14} />}
					onClick={() => router.push('/tasks/new')}
				>
					<span className={styles.btnLabel}>New Task</span>
				</Button>

				<div className={styles.userMenu}>
					<div className={styles.avatar}>
						<span className={styles.avatarInitial}>A</span>
					</div>
					<div className={styles.userInfo}>
						<span className={styles.userName}>Admin</span>
						<span className={styles.userEmail}>admin@trackr.local</span>
					</div>
				</div>
			</div>
		</header>
	);
}
