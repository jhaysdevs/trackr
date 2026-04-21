import type { Project, PaginatedResponse } from '@/types';
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project';
import { storage } from '@/lib/storage';

export const projectsApi = {
	list(): Promise<PaginatedResponse<Project>> {
		return Promise.resolve(storage.listProjects());
	},

	get(id: string): Promise<Project> {
		const project = storage.getProject(id);
		if (!project) return Promise.reject(new Error('Project not found'));
		return Promise.resolve(project);
	},

	create(data: CreateProjectInput): Promise<Project> {
		return Promise.resolve(storage.createProject(data));
	},

	update(id: string, data: UpdateProjectInput): Promise<Project> {
		const updated = storage.updateProject(id, data);
		if (!updated) return Promise.reject(new Error('Project not found'));
		return Promise.resolve(updated);
	},

	remove(id: string): Promise<void> {
		storage.deleteProject(id);
		return Promise.resolve();
	},
};
