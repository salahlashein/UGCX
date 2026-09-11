import type { ReactNode } from 'react';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { parseApiError } from '../../services/apiError';

interface Props<T> {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: T[] | undefined;
  onRetry?: () => void;
  emptyMessage?: string;
  /** TASK-P1-022: rendered instead of `LoadingState` while loading, when provided. */
  skeleton?: ReactNode;
  children: (data: T[]) => ReactNode;
}

/**
 * GUD-001: the one place every list screen's loading/empty/error branching
 * lives, so no screen can accidentally render a blank view while a query
 * settles.
 */
export function QueryStateView<T>({
  isLoading,
  isError,
  error,
  data,
  onRetry,
  emptyMessage,
  skeleton,
  children,
}: Props<T>) {
  if (isLoading) return skeleton ?? <LoadingState />;
  if (isError) return <ErrorState message={parseApiError(error).message} onRetry={onRetry} />;
  if (!data || data.length === 0) return <EmptyState message={emptyMessage} />;
  return <>{children(data)}</>;
}
