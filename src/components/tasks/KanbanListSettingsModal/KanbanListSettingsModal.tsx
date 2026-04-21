'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/lib/utils';
import { useUpdateList } from '@/hooks/useLists';
import type { List } from '@/types';
import styles from './KanbanListSettingsModal.module.scss';

/** Matches “Add list” palette on the board for quick picks */
const PRESET_COLORS = [
	'#4b5563',
	'#3b82f6',
	'#f59e0b',
	'#8b5cf6',
	'#06b6d4',
	'#ef4444',
	'#22c55e',
	'#ec4899',
	'#f97316',
	'#14b8a6',
	'#a855f7',
	'#0ea5e9',
];

export interface KanbanListSettingsModalProps {
	list: List;
	onClose: () => void;
}

function normalizeHex(c: string): string {
	const s = c.trim();
	if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
	return '#4b5563';
}

export function KanbanListSettingsModal({ list, onClose }: KanbanListSettingsModalProps) {
	const [mounted, setMounted] = useState(false);
	const [name, setName] = useState(list.name);
	const [color, setColor] = useState(normalizeHex(list.color));
	const [wipLimitStr, setWipLimitStr] = useState(list.wipLimit != null ? String(list.wipLimit) : '');

	const updateList = useUpdateList();

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		setName(list.name);
		setColor(normalizeHex(list.color));
		setWipLimitStr(list.wipLimit != null ? String(list.wipLimit) : '');
	}, [list]);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onClose]);

	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	function handleSave() {
		const trimmed = name.trim();
		if (!trimmed) return;
		let wipLimit: number | null | undefined = undefined;
		const w = wipLimitStr.trim();
		if (w === '') wipLimit = null;
		else {
			const n = parseInt(w, 10);
			if (Number.isNaN(n) || n < 0) return;
			wipLimit = Math.min(999, n);
		}
		updateList.mutate(
			{
				id: list.id,
				data: {
					name: trimmed,
					color: normalizeHex(color),
					wipLimit,
				},
			},
			{ onSuccess: onClose }
		);
	}

	if (!mounted || typeof document === 'undefined') return null;

	return createPortal(
		<div className={styles.overlay} onClick={onClose} role="presentation">
			<div
				className={styles.dialog}
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="list-settings-title"
			>
				<div className={styles.header}>
					<div>
						<h2 id="list-settings-title" className={styles.title}>
							List settings
						</h2>
						<p className={styles.subtitle}>Name, color, and WIP limit for this column</p>
					</div>
					<Button type="button" variant="ghost" size="sm" onClick={onClose}>
						Close
					</Button>
				</div>

				<div className={styles.body}>
					<div className={styles.field}>
						<label className={styles.label} htmlFor="list-settings-name">
							Name
						</label>
						<input
							id="list-settings-name"
							className={styles.textInput}
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={100}
							autoComplete="off"
						/>
					</div>

					<div className={styles.field}>
						<span className={styles.label}>Column color</span>
						<p className={styles.hint}>Used for the column accent and task card hover on this board.</p>
						<div className={styles.colorRow}>
							<div className={styles.presets}>
								{PRESET_COLORS.map((hex) => (
									<button
										key={hex}
										type="button"
										className={cn(styles.presetBtn, normalizeHex(color) === hex && styles.presetBtnActive)}
										style={{ background: hex }}
										title={hex}
										onClick={() => setColor(hex)}
									/>
								))}
							</div>
							<input
								type="color"
								className={styles.colorNative}
								value={normalizeHex(color)}
								onChange={(e) => setColor(normalizeHex(e.target.value))}
								aria-label="Pick custom color"
							/>
						</div>
					</div>

					<div className={styles.field}>
						<label className={styles.label} htmlFor="list-settings-wip">
							WIP limit
						</label>
						<p className={styles.hint}>
							Optional cap on tasks in this column. Leave empty for no limit. The header shows{' '}
							<span className={styles.hintMono}>current/max</span> when set.
						</p>
						<div className={styles.wipRow}>
							<input
								id="list-settings-wip"
								type="number"
								className={styles.wipInput}
								min={0}
								max={999}
								step={1}
								placeholder="—"
								value={wipLimitStr}
								onChange={(e) => setWipLimitStr(e.target.value)}
							/>
							<span className={styles.hint}>tasks max</span>
						</div>
					</div>
				</div>

				<div className={styles.actions}>
					<Button type="button" variant="ghost" onClick={onClose} disabled={updateList.isPending}>
						Cancel
					</Button>
					<Button type="button" variant="primary" onClick={handleSave} loading={updateList.isPending}>
						Save
					</Button>
				</div>
			</div>
		</div>,
		document.body
	);
}
