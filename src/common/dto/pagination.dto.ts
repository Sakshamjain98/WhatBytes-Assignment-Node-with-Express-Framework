import { z } from 'zod';

export const paginationQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQueryDto = z.infer<typeof paginationQueryDto>;

/** What repositories receive: SQL-level window, independent of HTTP query naming. */
export interface PageRequest {
  limit: number;
  offset: number;
}

export interface Page<T> {
  rows: T[];
  count: number;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const toPageRequest = ({ page, limit }: PaginationQueryDto): PageRequest => ({
  limit,
  offset: (page - 1) * limit,
});

export const toPaginatedResponse = <TRow, TDto>(
  { rows, count }: Page<TRow>,
  { page, limit }: PaginationQueryDto,
  map: (row: TRow) => TDto,
): PaginatedResponseDto<TDto> => ({
  data: rows.map(map),
  meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
});
