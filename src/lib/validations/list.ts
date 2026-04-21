import { z } from 'zod';

export const createListSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	color: z
		.string()
		.regex(/^#[0-9a-f]{6}$/i)
		.default('#4b5563'),
	position: z.number().int().min(0).optional(),
});

export const updateListSchema = createListSchema.partial();

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
