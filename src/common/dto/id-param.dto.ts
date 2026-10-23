import { z } from 'zod';

export const idParamDto = z.object({ id: z.coerce.number().int().positive() });
export type IdParamDto = z.infer<typeof idParamDto>;
