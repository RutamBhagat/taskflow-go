import { t } from "elysia";

export const paginationQueryFields = {
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
} as const;

export function getPagination(query: { page?: number; limit?: number }) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
