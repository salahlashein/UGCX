export interface QueryLike {
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  refetch?: () => Promise<unknown> | unknown;
}

export interface CombinedQueryResult {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

/**
 * Aggregates multiple TanStack query states into a single unified query status.
 */
export function combineQueries(...queries: (QueryLike | undefined | null)[]): CombinedQueryResult {
  const validQueries = queries.filter((q): q is QueryLike => Boolean(q));

  const isLoading = validQueries.some((q) => Boolean(q.isLoading));
  const isError = validQueries.some((q) => Boolean(q.isError));
  const isFetching = validQueries.some((q) => Boolean(q.isFetching));

  const refetch = async (): Promise<void> => {
    const promises = validQueries
      .filter((q) => typeof q.refetch === 'function')
      .map((q) => Promise.resolve(q.refetch!()));
    await Promise.all(promises);
  };

  return {
    isLoading,
    isError,
    isFetching,
    refetch,
  };
}
