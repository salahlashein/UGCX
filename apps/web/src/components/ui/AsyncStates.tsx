'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { useTranslation } from '../../i18n';

export function LoadingState({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12"
      role="status"
      aria-live="polite"
    >
      <div
        className="animate-spin rounded-full border-2 border-t-transparent"
        style={{
          width: 28,
          height: 28,
          borderColor: colors.primary,
          borderTopColor: 'transparent',
        }}
      />
      <AppText variant="bodySm" color="muted">
        {message ?? t('common.loading', 'Loading')}
      </AppText>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryTitle?: string;
  onRetry?: () => void;
  icon?: IconName;
}

export function ErrorState({
  title,
  message,
  retryTitle,
  onRetry,
  icon = 'alert-circle',
}: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center text-center gap-3 py-10">
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: `${radius.full}px`,
          backgroundColor: colors.dangerSurface,
        }}
      >
        <Icon name={icon} size={22} color="danger" />
      </div>
      <AppText variant="titleSm" color="ink" align="center">
        {title ?? t('common.error.title', 'Something went wrong')}
      </AppText>
      <AppText variant="bodySm" color="muted" align="center">
        {message ?? t('common.error.generic', 'Something went wrong. Please try again.')}
      </AppText>
      {onRetry ? (
        <div style={{ marginTop: spacing.xs }}>
          <Button
            title={retryTitle ?? t('common.retry', 'Retry')}
            variant="secondary"
            size="sm"
            onClick={onRetry}
          />
        </div>
      ) : null}
    </Card>
  );
}

export interface EmptyStateProps {
  title?: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: IconName;
}

export function EmptyState({
  title,
  message,
  actionTitle,
  onAction,
  icon = 'inbox',
}: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center text-center gap-3 py-10">
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: `${radius.full}px`,
          backgroundColor: colors.accentSoft,
        }}
      >
        <Icon name={icon} size={22} color="primary" />
      </div>
      <AppText variant="titleSm" color="ink" align="center">
        {title ?? t('common.empty.title', 'Nothing here yet')}
      </AppText>
      {message ? (
        <AppText variant="bodySm" color="muted" align="center">
          {message}
        </AppText>
      ) : null}
      {actionTitle && onAction ? (
        <div style={{ marginTop: spacing.xs }}>
          <Button title={actionTitle} variant="primary" size="sm" onClick={onAction} />
        </div>
      ) : null}
    </Card>
  );
}

export interface QueryStateViewProps<T> {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: T | undefined;
  isEmpty?: (data: T) => boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionTitle?: string;
  onEmptyAction?: () => void;
  children: (data: T) => React.ReactNode;
}

export function QueryStateView<T>({
  isLoading,
  isError,
  data,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyActionTitle,
  onEmptyAction,
  children,
}: QueryStateViewProps<T>) {
  if (isLoading) {
    return <LoadingState />;
  }
  if (isError || data === undefined) {
    return <ErrorState onRetry={onRetry} />;
  }
  if (isEmpty?.(data)) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionTitle={emptyActionTitle}
        onAction={onEmptyAction}
      />
    );
  }
  return <>{children(data)}</>;
}
