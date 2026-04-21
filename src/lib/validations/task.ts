import { z } from 'zod';

export const createTaskSchema = z.object({
	title: z.string().min(1, 'Title is required').max(255),
	description: z.string().max(10_000).optional(),
	status: z
		.enum([
			'backlog',
			'ready',
			'in_progress',
			'code_review',
			'qa_testing',
			'blocked',
			'resolved',
			'closed',
		])
		.default('backlog'),
	priority: z.enum(['critical', 'high', 'medium', 'low', 'trivial']).default('medium'),
	type: z
		.enum([
			'bug',
			'feature',
			'enhancement',
			'refactor',
			'tech_debt',
			'documentation',
			'ui_ux',
			'performance',
			'security',
			'devops',
			'testing',
			'spike',
			'integration',
			'accessibility',
		])
		.default('feature'),
	projectId: z.string().optional(),
	listId: z.string().optional().nullable(),
	position: z.number().int().min(0).optional().nullable(),
	assigneeId: z.string().optional().nullable(),
	labelIds: z.array(z.string()).default([]),
	parentId: z.string().optional().nullable(),
	dueDate: z.coerce.date().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
