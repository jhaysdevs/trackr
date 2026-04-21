/** Seed id for the default Kanban column — must not be deleted; tasks from removed lists move here. */
export const BACKLOG_LIST_ID = 'lst_backlog';

export function isBacklogList(listId: string): boolean {
	return listId === BACKLOG_LIST_ID;
}
