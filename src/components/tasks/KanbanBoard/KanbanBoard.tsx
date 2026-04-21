'use client';

import {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
	Fragment,
	type KeyboardEvent,
	type DragEvent,
} from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { GearIcon } from '@/components/ui/GearIcon/GearIcon';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLists, useCreateList, useUpdateList, useDeleteList, useReorderLists } from '@/hooks/useLists';
import { useTasks, taskKeys } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { tasksApi } from '@/lib/api/tasks';
import { Badge } from '@/components/ui/Badge/Badge';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal/TaskDetailModal';
import { NewTaskModal } from '@/components/tasks/NewTaskModal/NewTaskModal';
import { DeleteListModal } from '@/components/tasks/DeleteListModal/DeleteListModal';
import { KanbanListSettingsModal } from '@/components/tasks/KanbanListSettingsModal/KanbanListSettingsModal';
import { formatDate, cn } from '@/lib/utils';
import { parseBoardSearchParams, type BoardFiltersFromUrl } from '@/lib/boardSearchParams';
import { isBacklogList } from '@/lib/kanbanLists';
import type { List, Task, TaskPriority, TaskStatus, TaskType } from '@/types';
import styles from './KanbanBoard.module.scss';

// ─── Color palette for new lists ─────────────────────────────────────────────

const PALETTE = [
	'#4b5563', '#3b82f6', '#f59e0b', '#8b5cf6',
	'#06b6d4', '#ef4444', '#22c55e', '#ec4899',
	'#f97316', '#14b8a6', '#a855f7', '#0ea5e9',
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
	{ value: 'critical', label: 'Critical' },
	{ value: 'high', label: 'High' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'low', label: 'Low' },
];

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
	{ value: 'backlog', label: 'Backlog' },
	{ value: 'ready', label: 'Ready / To Do' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'code_review', label: 'Code Review' },
	{ value: 'qa_testing', label: 'QA / Testing' },
	{ value: 'blocked', label: 'Blocked' },
	{ value: 'resolved', label: 'Resolved' },
	{ value: 'closed', label: 'Closed / Done' },
];

const TYPE_OPTIONS: Array<{ value: TaskType; label: string }> = [
	{ value: 'bug', label: 'Bug' },
	{ value: 'feature', label: 'Feature' },
	{ value: 'enhancement', label: 'Enhancement' },
	{ value: 'refactor', label: 'Refactor' },
	{ value: 'tech_debt', label: 'Tech Debt' },
	{ value: 'documentation', label: 'Docs' },
	{ value: 'ui_ux', label: 'UI / UX' },
	{ value: 'performance', label: 'Performance' },
	{ value: 'security', label: 'Security' },
	{ value: 'devops', label: 'DevOps' },
	{ value: 'testing', label: 'Testing' },
	{ value: 'spike', label: 'Spike' },
	{ value: 'integration', label: 'Integration' },
	{ value: 'accessibility', label: 'A11y' },
];

function MultiSelectFilter<T extends string>({
	label,
	options,
	selectedValues,
	onToggle,
	onClear,
}: {
	label: string;
	options: Array<{ value: T; label: string }>;
	selectedValues: T[];
	onToggle: (value: T) => void;
	onClear: () => void;
}) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDetailsElement>(null);

	const buttonLabel = selectedValues.length === 0 ? label : `${label} (${selectedValues.length})`;

	useEffect(() => {
		if (!open) return;
		function handlePointerDown(e: PointerEvent) {
			const el = containerRef.current;
			if (el && !el.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener('pointerdown', handlePointerDown, true);
		return () => document.removeEventListener('pointerdown', handlePointerDown, true);
	}, [open]);

	return (
		<details
			ref={containerRef}
			className={styles.filterDropdown}
			open={open}
			onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
					setOpen(false);
				}
			}}
			onKeyDown={(e) => {
				if (e.key === 'Escape') setOpen(false);
			}}
		>
			<summary className={styles.filterButton}>{buttonLabel}</summary>
			<div className={styles.filterMenu}>
				<div className={styles.filterMenuHeader}>
					<span className={styles.filterMenuTitle}>{label}</span>
					{selectedValues.length > 0 && (
						<button
							type="button"
							className={styles.clearBtn}
							onClick={(e) => {
								e.preventDefault();
								onClear();
							}}
						>
							Clear
						</button>
					)}
				</div>
				<div className={styles.filterOptions}>
					{options.map((option) => (
						<label key={option.value} className={styles.filterOption}>
							<input
								type="checkbox"
								checked={selectedValues.includes(option.value)}
								onChange={() => onToggle(option.value)}
							/>
							<span>{option.label}</span>
						</label>
					))}
				</div>
			</div>
		</details>
	);
}

// ─── Kanban task row (draggable; opens task editor in a modal from the board) ─

function KanbanTaskCard({
	task,
	listId,
	onSelectTask,
	onTaskDragStart,
	onTaskDragOver,
	onTaskDrop,
	onTaskDragEnd,
}: {
	task: Task;
	listId: string;
	onSelectTask: (taskId: string) => void;
	onTaskDragStart: (taskId: string, e: DragEvent) => void;
	onTaskDragOver: (taskId: string, listId: string, e: DragEvent) => void;
	onTaskDrop: (taskId: string, listId: string, e: DragEvent) => void;
	onTaskDragEnd: () => void;
}) {
	const isOverdue =
		task.dueDate &&
		new Date(task.dueDate as unknown as string) < new Date() &&
		task.status !== 'resolved' &&
		task.status !== 'closed';

	return (
		<div
			role="button"
			tabIndex={0}
			className={styles.taskCard}
			draggable
			onDragStart={(e) => onTaskDragStart(task.id, e)}
			onDragOver={(e) => onTaskDragOver(task.id, listId, e)}
			onDrop={(e) => onTaskDrop(task.id, listId, e)}
			onDragEnd={onTaskDragEnd}
			onClick={() => onSelectTask(task.id)}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onSelectTask(task.id);
				}
			}}
		>
			<div className={styles.taskCardTop}>
				<span className={styles.taskCardNumber}>#{task.number}</span>
				<Badge variant={{ kind: 'type', value: task.type }} />
			</div>
			<p className={styles.taskCardTitle}>{task.title}</p>
			<div className={styles.taskCardFooter}>
				<Badge variant={{ kind: 'priority', value: task.priority }} />
				{task.dueDate && (
					<span className={cn(styles.taskDueDate, isOverdue && styles.taskDueDateOverdue)}>
						{formatDate(task.dueDate as unknown as string, 'short')}
					</span>
				)}
			</div>
		</div>
	);
}

// ─── Column header ────────────────────────────────────────────────────────────

function ColumnHeader({
	list,
	count,
	isEditing,
	isDragOver,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onStartEdit,
	onFinishEdit,
	onCancelEdit,
	onDelete,
	onAddTask,
	onOpenSettings,
	canDeleteList,
}: {
	list: List;
	count: number;
	isEditing: boolean;
	isDragOver: boolean;
	onDragStart: (e: DragEvent) => void;
	onDragOver: (e: DragEvent) => void;
	onDrop: (e: DragEvent) => void;
	onDragEnd: () => void;
	onStartEdit: () => void;
	onFinishEdit: (name: string) => void;
	onCancelEdit: () => void;
	onDelete: () => void;
	onAddTask: () => void;
	onOpenSettings: () => void;
	canDeleteList: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [draft, setDraft] = useState(list.name);

	useEffect(() => {
		if (isEditing) {
			setDraft(list.name);
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [isEditing, list.name]);

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (draft.trim()) onFinishEdit(draft.trim());
		}
		if (e.key === 'Escape') {
			onCancelEdit();
		}
	}

	return (
		<div
			className={cn(styles.columnHeader, isDragOver && styles.columnHeaderDragOver)}
			draggable
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDrop={onDrop}
			onDragEnd={onDragEnd}
		>
			<div className={styles.columnTitle}>
				<GripVertical size={14} className={styles.gripIcon} />
				<span className={styles.columnDot} style={{ background: list.color }} />
				{isEditing ? (
					<input
						ref={inputRef}
						className={styles.renameInput}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={handleKeyDown}
						onBlur={() => {
							if (draft.trim()) onFinishEdit(draft.trim());
							else onCancelEdit();
						}}
					/>
				) : (
					<span className={styles.columnLabel} onDoubleClick={onStartEdit} title="Double-click to rename">
						{list.name}
					</span>
				)}
				<span
					className={cn(
						styles.columnCount,
						list.wipLimit != null &&
							typeof list.wipLimit === 'number' &&
							count > list.wipLimit &&
							styles.columnCountOverWip,
					)}
					title={
						list.wipLimit != null ? `${count} tasks · WIP limit ${list.wipLimit}` : `${count} tasks`
					}
				>
					{list.wipLimit != null && typeof list.wipLimit === 'number' ? `${count}/${list.wipLimit}` : count}
				</span>
			</div>

			<div className={styles.columnActions}>
				<button
					type="button"
					className={styles.iconBtn}
					title="List settings"
					onClick={(e) => {
						e.stopPropagation();
						onOpenSettings();
					}}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<GearIcon size={14} />
				</button>
				<button
					type="button"
					className={styles.iconBtn}
					title="Add task"
					onClick={(e) => {
						e.stopPropagation();
						onAddTask();
					}}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<Plus size={13} />
				</button>
				{canDeleteList && (
					<button
						type="button"
						className={cn(styles.iconBtn, styles.deleteBtn)}
						title="Delete list"
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						onPointerDown={(e) => e.stopPropagation()}
					>
						<Trash2 size={13} />
					</button>
				)}
			</div>
		</div>
	);
}

// ─── Board ────────────────────────────────────────────────────────────────────

function KanbanBoardInner({ initialFilters }: { initialFilters: BoardFiltersFromUrl }) {
	const qc = useQueryClient();

	// ── Data ──
	const [projectFilters, setProjectFilters] = useState(initialFilters.projectIds);
	const [priorityFilters, setPriorityFilters] = useState(initialFilters.priorities);
	const [typeFilters, setTypeFilters] = useState(initialFilters.types);
	const [statusFilters, setStatusFilters] = useState(initialFilters.statuses);
	const { data: rawLists = [], isPending: listsLoading } = useLists();
	const { data: tasksData, isPending: tasksLoading } = useTasks({ pageSize: 10_000 });
	const { data: projectsData } = useProjects();

	const lists = [...rawLists].sort((a, b) => a.position - b.position);
	const tasks = tasksData?.data ?? [];
	const projects = projectsData?.data ?? [];
	const projectOptions = useMemo(() => {
		return projects.map((project) => ({ value: project.id, label: project.name }));
	}, [projects]);
	const filteredTasks = useMemo(() => {
		return tasks.filter((task) => {
			const matchesProject =
				projectFilters.length === 0 || projectFilters.includes(task.projectId);
			const matchesPriority =
				priorityFilters.length === 0 || priorityFilters.includes(task.priority);
			const matchesType = typeFilters.length === 0 || typeFilters.includes(task.type);
			const matchesStatus =
				statusFilters.length === 0 || statusFilters.includes(task.status);
			return matchesProject && matchesPriority && matchesType && matchesStatus;
		});
	}, [tasks, projectFilters, priorityFilters, typeFilters, statusFilters]);

	// ── Mutations ──
	const createListMutation = useCreateList();
	const updateListMutation = useUpdateList();
	const deleteListMutation = useDeleteList();
	const reorderMutation = useReorderLists();

	const reorderInListMutation = useMutation({
		mutationFn: ({ listId, orderedIds }: { listId: string; orderedIds: string[] }) =>
			tasksApi.reorderInList(listId, orderedIds),
		onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
	});

	const moveAndReorderMutation = useMutation({
		mutationFn: ({ taskId, targetListId, orderedIds }: { taskId: string; targetListId: string; orderedIds: string[] }) =>
			tasksApi.moveAndReorder(taskId, targetListId, orderedIds),
		onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
	});

	// ── Edit / delete state ──
	const [editingListId, setEditingListId] = useState<string | null>(null);
	const [deleteListId, setDeleteListId] = useState<string | null>(null);
	const [listSettingsListId, setListSettingsListId] = useState<string | null>(null);

	// ── Drag state ──
	// dragType: 'list' = dragging a column header, 'card' = dragging a kanban task row
	const dragTypeRef = useRef<'list' | 'card' | null>(null);
	const draggingListIdRef = useRef<string | null>(null);
	const draggingTaskIdRef = useRef<string | null>(null);
	// Drop indicator between tasks: ref for handlers, state for render
	const taskDropTargetRef = useRef<{ id: string; before: boolean } | null>(null);
	const skipNextTaskClickRef = useRef(false);
	const [modalTaskId, setModalTaskId] = useState<string | null>(null);
	const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
	const [dragOverListId, setDragOverListId] = useState<string | null>(null);
	const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
	const [taskDropTarget, setTaskDropTarget] = useState<{ id: string; before: boolean } | null>(null);

	// ── Helpers ──
	const tasksByList = useCallback(
		(listId: string) => {
			const filtered = filteredTasks.filter((t) => t.listId === listId);
			return filtered.sort((a, b) => ((a.position as unknown as number) ?? Infinity) - ((b.position as unknown as number) ?? Infinity));
		},
		[filteredTasks]
	);

	function setTaskDropIndicator(val: { id: string; before: boolean } | null) {
		taskDropTargetRef.current = val;
		setTaskDropTarget(val);
	}

	function handleSelectTask(taskId: string) {
		if (skipNextTaskClickRef.current) {
			skipNextTaskClickRef.current = false;
			return;
		}
		setModalTaskId(taskId);
	}

	// ── Column drag handlers ──
	function onColumnDragStart(listId: string, e: DragEvent) {
		dragTypeRef.current = 'list';
		draggingListIdRef.current = listId;
		e.dataTransfer.effectAllowed = 'move';
	}

	function onColumnDragOver(listId: string, e: DragEvent) {
		if (dragTypeRef.current !== 'list') return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		setDragOverListId(listId);
	}

	function onColumnDrop(targetListId: string, e: DragEvent) {
		e.preventDefault();
		const sourceId = draggingListIdRef.current;
		if (!sourceId || sourceId === targetListId || dragTypeRef.current !== 'list') return;

		const ordered = [...lists];
		const sourceIdx = ordered.findIndex((l) => l.id === sourceId);
		const targetIdx = ordered.findIndex((l) => l.id === targetListId);
		if (sourceIdx === -1 || targetIdx === -1) return;

		const [removed] = ordered.splice(sourceIdx, 1);
		ordered.splice(targetIdx, 0, removed);
		reorderMutation.mutate(ordered.map((l) => l.id));
		resetDrag();
	}

	// ── Task row drag handlers ──
	function onTaskDragStart(taskId: string, e: DragEvent) {
		dragTypeRef.current = 'card';
		draggingTaskIdRef.current = taskId;
		e.dataTransfer.effectAllowed = 'move';
		e.stopPropagation();
	}

	function onTaskDragOver(taskId: string, listId: string, e: DragEvent) {
		if (dragTypeRef.current !== 'card') return;
		if (taskId === draggingTaskIdRef.current) return;
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = 'move';

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const before = e.clientY < rect.top + rect.height / 2;

		const srcTask = tasks.find((t) => t.id === draggingTaskIdRef.current);
		const isCrossColumn = srcTask?.listId !== listId;
		setDragOverColumnId(isCrossColumn ? listId : null);
		setTaskDropIndicator({ id: taskId, before });
	}

	function onTaskDrop(taskId: string, listId: string, e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		const srcTaskId = draggingTaskIdRef.current;
		if (!srcTaskId || dragTypeRef.current !== 'card') return;

		const target = taskDropTargetRef.current;
		if (!target) { resetDrag(); return; }

		const srcTask = tasks.find((t) => t.id === srcTaskId);
		if (!srcTask) { resetDrag(); return; }

		const colTasks = tasksByList(listId);
		const isSameList = srcTask.listId === listId;

		if (isSameList) {
			const ordered = [...colTasks];
			const srcIdx = ordered.findIndex((t) => t.id === srcTaskId);
			const [removed] = ordered.splice(srcIdx, 1);
			const newTgtIdx = ordered.findIndex((t) => t.id === taskId);
			const insertAt = target.before ? newTgtIdx : newTgtIdx + 1;
			ordered.splice(insertAt, 0, removed);
			reorderInListMutation.mutate({ listId, orderedIds: ordered.map((t) => t.id) });
		} else {
			const tgtTasks = colTasks.filter((t) => t.id !== srcTaskId);
			const newTgtIdx = tgtTasks.findIndex((t) => t.id === taskId);
			const insertAt = target.before ? newTgtIdx : newTgtIdx + 1;
			const newOrder = [...tgtTasks.map((t) => t.id)];
			newOrder.splice(insertAt, 0, srcTaskId);
			moveAndReorderMutation.mutate({ taskId: srcTaskId, targetListId: listId, orderedIds: newOrder });
		}

		resetDrag();
	}

	function onColumnBodyDragOver(listId: string, e: DragEvent) {
		if (dragTypeRef.current !== 'card') return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		setDragOverColumnId(listId);
		setTaskDropIndicator(null);
	}

	function onColumnBodyDrop(listId: string, e: DragEvent) {
		e.preventDefault();
		const taskId = draggingTaskIdRef.current;
		if (!taskId || dragTypeRef.current !== 'card') return;
		const task = tasks.find((t) => t.id === taskId);
		if (task && task.listId !== listId) {
			const tgtTasks = tasksByList(listId);
			const orderedIds = [...tgtTasks.map((t) => t.id), taskId];
			moveAndReorderMutation.mutate({ taskId, targetListId: listId, orderedIds });
		}
		resetDrag();
	}

	function resetDrag() {
		if (dragTypeRef.current === 'card') {
			skipNextTaskClickRef.current = true;
		}
		dragTypeRef.current = null;
		draggingListIdRef.current = null;
		draggingTaskIdRef.current = null;
		setDragOverListId(null);
		setDragOverColumnId(null);
		setTaskDropIndicator(null);
	}

	// ── Column CRUD ──
	function handleAddList() {
		const color = PALETTE[lists.length % PALETTE.length];
		createListMutation.mutate(
			{ name: 'New List', color },
			{
				onSuccess: (newList) => setEditingListId(newList.id),
			}
		);
	}

	function handleRename(listId: string, name: string) {
		updateListMutation.mutate({ id: listId, data: { name } });
		setEditingListId(null);
	}

	function handleRequestDeleteList(listId: string) {
		if (isBacklogList(listId)) return;
		setDeleteListId(listId);
	}

	const isPending = listsLoading || tasksLoading;

	const listOpenInSettings = listSettingsListId
		? lists.find((l) => l.id === listSettingsListId)
		: undefined;

	return (
		<>
		<div className={styles.root}>
			{/* Toolbar */}
			<div className={styles.toolbar}>
				<MultiSelectFilter
					label="Projects"
					options={projectOptions}
					selectedValues={projectFilters}
					onToggle={(value) => {
						setProjectFilters((prev) =>
							prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
						);
					}}
					onClear={() => setProjectFilters([])}
				/>
				<MultiSelectFilter
					label="Priority"
					options={PRIORITY_OPTIONS}
					selectedValues={priorityFilters}
					onToggle={(value) => {
						setPriorityFilters((prev) =>
							prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
						);
					}}
					onClear={() => setPriorityFilters([])}
				/>
				<MultiSelectFilter
					label="Status"
					options={STATUS_OPTIONS}
					selectedValues={statusFilters}
					onToggle={(value) => {
						setStatusFilters((prev) =>
							prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
						);
					}}
					onClear={() => setStatusFilters([])}
				/>
				<MultiSelectFilter
					label="Type"
					options={TYPE_OPTIONS}
					selectedValues={typeFilters}
					onToggle={(value) => {
						setTypeFilters((prev) =>
							prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
						);
					}}
					onClear={() => setTypeFilters([])}
				/>
				<span className={styles.taskTotal}>{filteredTasks.length} tasks</span>
			</div>

			{/* Board */}
			<div
				className={styles.board}
				onDragLeave={() => { setDragOverListId(null); setDragOverColumnId(null); setTaskDropIndicator(null); }}
			>
				{isPending
					? Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className={styles.skeletonColumn} />
						))
					: lists.map((list) => {
							const colTasks = tasksByList(list.id);

							return (
								<div
									key={list.id}
									className={cn(
										styles.column,
										dragOverColumnId === list.id && styles.columnTaskDragOver,
									)}
									style={{ '--col-color': list.color } as React.CSSProperties}
								>
									<ColumnHeader
										list={list}
										count={colTasks.length}
										isEditing={editingListId === list.id}
										isDragOver={dragOverListId === list.id}
										onDragStart={(e) => onColumnDragStart(list.id, e)}
										onDragOver={(e) => onColumnDragOver(list.id, e)}
										onDrop={(e) => onColumnDrop(list.id, e)}
										onDragEnd={resetDrag}
										onStartEdit={() => setEditingListId(list.id)}
										onFinishEdit={(name) => handleRename(list.id, name)}
										onCancelEdit={() => setEditingListId(null)}
										onDelete={() => handleRequestDeleteList(list.id)}
										onAddTask={() => setNewTaskModalOpen(true)}
										onOpenSettings={() => setListSettingsListId(list.id)}
										canDeleteList={!isBacklogList(list.id)}
									/>
									<div
										className={styles.columnBody}
										onDragOver={(e) => onColumnBodyDragOver(list.id, e)}
										onDrop={(e) => onColumnBodyDrop(list.id, e)}
									>
										{colTasks.length === 0 ? (
											<div className={styles.emptyCol}>No tasks</div>
										) : (
											colTasks.map((task) => (
												<Fragment key={task.id}>
													{taskDropTarget?.id === task.id && taskDropTarget.before && (
														<div className={styles.taskDropIndicator} />
													)}
													<KanbanTaskCard
														task={task}
														listId={list.id}
														onSelectTask={handleSelectTask}
														onTaskDragStart={onTaskDragStart}
														onTaskDragOver={onTaskDragOver}
														onTaskDrop={onTaskDrop}
														onTaskDragEnd={resetDrag}
													/>
													{taskDropTarget?.id === task.id && !taskDropTarget.before && (
														<div className={styles.taskDropIndicator} />
													)}
												</Fragment>
											))
										)}
									</div>
								</div>
							);
						})}

				{/* Add list button */}
				{!isPending && (
					<button className={styles.addListBtn} onClick={handleAddList}>
						<Plus size={16} />
						<span>Add list</span>
					</button>
				)}
			</div>
		</div>
		{modalTaskId && (
			<TaskDetailModal taskId={modalTaskId} onClose={() => setModalTaskId(null)} />
		)}
		{newTaskModalOpen && <NewTaskModal onClose={() => setNewTaskModalOpen(false)} />}
		{listOpenInSettings && (
			<KanbanListSettingsModal list={listOpenInSettings} onClose={() => setListSettingsListId(null)} />
		)}
		{deleteListId && (
			<DeleteListModal
				listName={lists.find((l) => l.id === deleteListId)?.name ?? 'List'}
				taskCount={tasks.filter((t) => t.listId === deleteListId).length}
				isPending={deleteListMutation.isPending}
				onCancel={() => setDeleteListId(null)}
				onConfirm={() => {
					const id = deleteListId;
					deleteListMutation.mutate(id, {
						onSettled: () => setDeleteListId(null),
					});
				}}
			/>
		)}
		</>
	);
}

export function KanbanBoard() {
	const searchParams = useSearchParams();
	const initialFilters = useMemo(() => parseBoardSearchParams(searchParams), [searchParams]);
	return (
		<KanbanBoardInner key={searchParams.toString()} initialFilters={initialFilters} />
	);
}
