import { create } from 'zustand';

interface UiState {
	sidebarCollapsed: boolean;
	createTaskModalOpen: boolean;
	createProjectModalOpen: boolean;
	activeProjectId: string | null;

	toggleSidebar: () => void;
	setSidebarCollapsed: (v: boolean) => void;
	openCreateTaskModal: (projectId?: string) => void;
	closeCreateTaskModal: () => void;
	openCreateProjectModal: () => void;
	closeCreateProjectModal: () => void;
	setActiveProject: (id: string | null) => void;
}

export const useUiStore = create<UiState>()((set) => ({
	sidebarCollapsed: false,
	createTaskModalOpen: false,
	createProjectModalOpen: false,
	activeProjectId: null,

	toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
	setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
	openCreateTaskModal: (projectId) =>
		set({ createTaskModalOpen: true, activeProjectId: projectId ?? null }),
	closeCreateTaskModal: () => set({ createTaskModalOpen: false }),
	openCreateProjectModal: () => set({ createProjectModalOpen: true }),
	closeCreateProjectModal: () => set({ createProjectModalOpen: false }),
	setActiveProject: (id) => set({ activeProjectId: id }),
}));
