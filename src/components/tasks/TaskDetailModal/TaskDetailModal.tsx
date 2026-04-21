'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TaskEditView } from '@/components/tasks/TaskEditView/TaskEditView';
import styles from './TaskDetailModal.module.scss';

export interface TaskDetailModalProps {
	taskId: string;
	onClose: () => void;
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

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

	if (!mounted || typeof document === 'undefined') return null;

	return createPortal(
		<div className={styles.overlay} onClick={onClose} role="presentation">
			<div
				className={styles.dialog}
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label="Edit task"
			>
				<div className={styles.body}>
					<TaskEditView taskId={taskId} onDismiss={onClose} />
				</div>
			</div>
		</div>,
		document.body
	);
}
