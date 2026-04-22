'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFiltersStore } from '@/store/filters.store';
import styles from './TaskSearchBar.module.scss';

export function TaskSearchBar() {
	const persisted = useFiltersStore((s) => s.taskFilters.search ?? '');
	const setTaskFilters = useFiltersStore((s) => s.setTaskFilters);
	const [value, setValue] = useState(persisted);

	useEffect(() => {
		// Align input when the store updates (persist rehydration or other tabs).
		// eslint-disable-next-line react-hooks/set-state-in-effect -- controlled sync from external store
		setValue(persisted);
	}, [persisted]);

	const debounced = useDebouncedValue(value, 300);

	useEffect(() => {
		const next = debounced.trim() || undefined;
		const cur = persisted.trim() || undefined;
		if (next === cur) return;
		setTaskFilters({ search: next });
	}, [debounced, persisted, setTaskFilters]);

	return (
		<div className={styles.wrap}>
			<Search className={styles.icon} size={16} aria-hidden />
			<input
				type="search"
				className={styles.input}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="Search title, description, status, priority, type, dates…"
				aria-label="Search tasks"
				autoComplete="off"
				spellCheck={false}
			/>
		</div>
	);
}
