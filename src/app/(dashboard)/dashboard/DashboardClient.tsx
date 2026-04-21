'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { buildBoardUrl } from '@/lib/boardSearchParams';
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart/DonutChart';
import { HBarChart, type BarDatum } from '@/components/charts/HBarChart/HBarChart';
import type { TaskStatus, TaskPriority, TaskType, StatsBucket } from '@/types';
import styles from './dashboard.module.scss';

// ─── Colour maps ─────────────────────────────────────────────────────────────

const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
	backlog: { label: 'Backlog', color: '#4b5563' },
	ready: { label: 'Ready / To Do', color: '#3b82f6' },
	in_progress: { label: 'In Progress', color: '#f59e0b' },
	code_review: { label: 'Code Review', color: '#8b5cf6' },
	qa_testing: { label: 'QA / Testing', color: '#06b6d4' },
	blocked: { label: 'Blocked', color: '#ef4444' },
	resolved: { label: 'Resolved', color: '#22c55e' },
	closed: { label: 'Closed / Done', color: '#6b7280' },
};

const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
	critical: { label: 'Critical / Blocker', color: '#ef4444' },
	high: { label: 'High', color: '#f97316' },
	medium: { label: 'Medium', color: '#f59e0b' },
	low: { label: 'Low', color: '#6b7280' },
};

const TYPE_META: Record<TaskType, { label: string; color: string }> = {
	bug: { label: 'Bug', color: '#ef4444' },
	feature: { label: 'Feature Request', color: '#3b82f6' },
	enhancement: { label: 'Enhancement / Improvement', color: '#6366f1' },
	refactor: { label: 'Refactor', color: '#8b5cf6' },
	tech_debt: { label: 'Technical Debt', color: '#f59e0b' },
	documentation: { label: 'Documentation', color: '#14b8a6' },
	ui_ux: { label: 'UI / UX', color: '#ec4899' },
	performance: { label: 'Performance', color: '#f97316' },
	security: { label: 'Security', color: '#dc2626' },
	devops: { label: 'DevOps / Infrastructure', color: '#0ea5e9' },
	testing: { label: 'Testing', color: '#10b981' },
	spike: { label: 'Research / Spike', color: '#a855f7' },
	integration: { label: 'Integration', color: '#06b6d4' },
	accessibility: { label: 'Accessibility', color: '#84cc16' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDonutSlices<K extends string>(
	buckets: StatsBucket[],
	meta: Record<K, { label: string; color: string }>,
	order: K[]
): DonutSlice[] {
	const map = Object.fromEntries(buckets.map((b) => [b.key, b.count]));
	return order.map((key) => ({
		id: key,
		label: meta[key].label,
		value: map[key] ?? 0,
		color: meta[key].color,
	}));
}

function toBarData<K extends string>(
	buckets: StatsBucket[],
	meta: Record<K, { label: string; color: string }>,
	order: K[]
): BarDatum[] {
	const map = Object.fromEntries(buckets.map((b) => [b.key, b.count]));
	return order.map((key) => ({
		id: key,
		label: meta[key].label,
		value: map[key] ?? 0,
		color: meta[key].color,
	}));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardClient() {
	const router = useRouter();
	const { data: stats, isPending } = useStats();

	const goToBoardWithStatus = useCallback(
		(s: TaskStatus) => {
			router.push(buildBoardUrl({ statuses: [s] }));
		},
		[router]
	);

	const goToBoardWithPriority = useCallback(
		(p: TaskPriority) => {
			router.push(buildBoardUrl({ priorities: [p] }));
		},
		[router]
	);

	const goToBoardWithType = useCallback(
		(t: TaskType) => {
			router.push(buildBoardUrl({ types: [t] }));
		},
		[router]
	);

	const statusSlices = stats
		? toDonutSlices(stats.byStatus, STATUS_META, Object.keys(STATUS_META) as TaskStatus[])
		: [];

	const prioritySlices = stats
		? toDonutSlices(stats.byPriority, PRIORITY_META, Object.keys(PRIORITY_META) as TaskPriority[])
		: [];

	const typeBars = stats
		? toBarData(stats.byType, TYPE_META, Object.keys(TYPE_META) as TaskType[])
		: [];

	return (
		<main className={styles.page}>
			<div className={styles.inner}>
				{stats?.demo && (
					<div className={styles.demoBanner}>
						<Info size={14} />
						<span>
							<strong>Sample data</strong> — this is seed data loaded into localStorage on first run.
						</span>
					</div>
				)}

				{/* ── Summary ── */}
				<div className={styles.statGrid}>
					<div className={`${styles.statCard} ${styles['statAccent-blue']}`}>
						<span className={styles.statLabel}>Total Tasks</span>
						<span className={styles.statValue}>
							{isPending ? '—' : (stats?.totals.total ?? 0).toLocaleString()}
						</span>
						<span className={styles.statSub}>across all projects</span>
					</div>
					<div className={`${styles.statCard} ${styles['statAccent-amber']}`}>
						<span className={styles.statLabel}>In Progress</span>
						<span className={styles.statValue}>
							{isPending ? '—' : (stats?.totals.inProgress ?? 0).toLocaleString()}
						</span>
						<span className={styles.statSub}>actively being worked</span>
					</div>
					<div className={`${styles.statCard} ${styles['statAccent-red']}`}>
						<span className={styles.statLabel}>Blocked</span>
						<span className={styles.statValue}>
							{isPending ? '—' : (stats?.totals.blocked ?? 0).toLocaleString()}
						</span>
						<span className={styles.statSub}>need attention</span>
					</div>
					<div className={`${styles.statCard} ${styles['statAccent-green']}`}>
						<span className={styles.statLabel}>Closed / Done</span>
						<span className={styles.statValue}>
							{isPending ? '—' : (stats?.totals.closed ?? 0).toLocaleString()}
						</span>
						<span className={styles.statSub}>resolved &amp; shipped</span>
					</div>
				</div>

				{/* ── Status + Priority donuts ── */}
				<div className={styles.chartRow}>
					<div className={styles.chartCard}>
						<div className={styles.chartHeader}>
							<h2 className={styles.chartTitle}>Tasks by Status</h2>
							<p className={styles.chartSubtitle}>Distribution across workflow stages</p>
						</div>
						{!isPending && (
							<DonutChart
								data={statusSlices}
								onSliceClick={(slice) => goToBoardWithStatus(slice.id as TaskStatus)}
							/>
						)}
					</div>

					<div className={styles.chartCard}>
						<div className={styles.chartHeader}>
							<h2 className={styles.chartTitle}>Tasks by Priority</h2>
							<p className={styles.chartSubtitle}>Severity and urgency breakdown</p>
						</div>
						{!isPending && (
							<DonutChart
								data={prioritySlices}
								onSliceClick={(slice) => goToBoardWithPriority(slice.id as TaskPriority)}
							/>
						)}
					</div>
				</div>

				{/* ── Types bar chart ── */}
				<div className={styles.chartCardFull}>
					<div className={styles.chartHeader}>
						<h2 className={styles.chartTitle}>Tasks by Type</h2>
						<p className={styles.chartSubtitle}>Volume per work category</p>
					</div>
					{!isPending && (
						<HBarChart data={typeBars} onRowClick={(row) => goToBoardWithType(row.id as TaskType)} />
					)}
				</div>
			</div>
		</main>
	);
}
