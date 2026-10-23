import type { Request } from 'express';

/** Request whose body has already been validated into the given DTO by `validateBody`. */
export type TypedRequest<TBody> = Request<Record<string, string>, unknown, TBody>;
