'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import styles from './DeleteListModal.module.scss';

export interface DeleteListModalProps {
	listName: string;
	taskCount: number;
	isPending?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function DeleteListModal({
	listName,
	taskCount,
	isPending,
	onConfirm,
	onCancel,
}: DeleteListModalProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') onCancel();
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onCancel]);

	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	if (!mounted || typeof document === 'undefined') return null;

	const taskNote =
		taskCount > 0
			? `${taskCount} task${taskCount !== 1 ? 's' : ''} will move to Backlog.`
			: 'This list is empty.';

	return createPortal(
		<div className={styles.overlay} onClick={onCancel} role="presentation">
			<div
				className={styles.dialog}
				onClick={(e) => e.stopPropagation()}
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="delete-list-title"
				aria-describedby="delete-list-desc"
			>
				<h2 id="delete-list-title" className={styles.title}>
					Delete list?
				</h2>
				<p id="delete-list-desc" className={styles.body}>
					Delete <strong>{listName}</strong>? {taskNote}
				</p>
				<div className={styles.actions}>
					<Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button type="button" variant="danger" onClick={onConfirm} loading={isPending}>
						Delete list
					</Button>
				</div>
			</div>
		</div>,
		document.body
	);
}
