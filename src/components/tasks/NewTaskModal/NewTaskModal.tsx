'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreateTaskView } from '@/components/tasks/CreateTaskView/CreateTaskView';
import styles from './NewTaskModal.module.scss';

export interface NewTaskModalProps {
	onClose: () => void;
}

export function NewTaskModal({ onClose }: NewTaskModalProps) {
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
				aria-label="New task"
			>
				<div className={styles.body}>
					<CreateTaskView onDismiss={onClose} onCreated={() => onClose()} />
				</div>
			</div>
		</div>,
		document.body
	);
}
