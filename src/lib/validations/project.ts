import { z } from 'zod';
import { slugify } from '@/lib/utils';

export const createProjectSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	slug: z
		.string()
		.min(1, 'Slug is required')
		.max(50)
		.regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
		.transform(slugify),
	description: z.string().max(1000).optional(),
	status: z.enum(['active', 'archived', 'paused']).default('active'),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
