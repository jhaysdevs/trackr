'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CircleDot, FolderKanban, Kanban, Settings, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui.store';
import styles from './Sidebar.module.scss';

const NAV = [
	{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/tasks', label: 'Tasks', icon: CircleDot },
	{ href: '/projects', label: 'Projects', icon: FolderKanban },
	{ href: '/board', label: 'Board', icon: Kanban },
];

const BOTTOM_NAV = [{ href: '/settings', label: 'Settings', icon: Settings }];

export function Sidebar() {
	const pathname = usePathname();
	const collapsed = useUiStore((s) => s.sidebarCollapsed);
	const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
	const closeMobileSidebar = useUiStore((s) => s.closeMobileSidebar);

	return (
		<aside
			className={cn(
				styles.sidebar,
				collapsed && styles.collapsed,
				mobileSidebarOpen && styles.mobileOpen,
			)}
		>
			<div className={styles.logo}>
				<div className={styles.logoIcon}>
					<Bug size={14} />
				</div>
				{!collapsed && <span>Trackr</span>}
			</div>

			<nav className={styles.section}>
				{!collapsed && <div className={styles.sectionLabel}>Navigation</div>}
				{NAV.map(({ href, label, icon: Icon }) => (
					<Link
						key={href}
						href={href}
						className={cn(styles.navItem, pathname.startsWith(href) && styles.active)}
						onClick={closeMobileSidebar}
					>
						<Icon className={styles.icon} size={16} />
						{!collapsed && label}
					</Link>
				))}
			</nav>

			<nav className={cn(styles.section)}>
				{BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
					<Link
						key={href}
						href={href}
						className={cn(styles.navItem, pathname.startsWith(href) && styles.active)}
						onClick={closeMobileSidebar}
					>
						<Icon className={styles.icon} size={16} />
						{!collapsed && label}
					</Link>
				))}
			</nav>
		</aside>
	);
}
