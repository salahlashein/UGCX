export interface PaginationEnvelope<T> {
  data: T[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
  links: { self: string; next: string | null; last: string };
}

/**
 * Builds the data/meta/links envelope from api-patterns (GUD-001) for
 * every list endpoint in this plan.
 */
export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
  basePath: string,
): PaginationEnvelope<T> {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const buildUrl = (targetPage: number): string =>
    `${basePath}?page=${targetPage}&perPage=${perPage}`;

  return {
    data,
    meta: { total, page, perPage, totalPages },
    links: {
      self: buildUrl(page),
      next: page < totalPages ? buildUrl(page + 1) : null,
      last: buildUrl(totalPages),
    },
  };
}
