'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { AppText } from './AppText';
import { Icon } from './Icon';

export interface ModalSheetProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function ModalSheet({ open, isOpen, onClose, title, children }: ModalSheetProps) {
  const visible = open ?? isOpen ?? false;
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: 'rgba(23, 36, 28, 0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full md:max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: colors.surface,
          borderRadius: `${radius.hero}px`,
          padding: `${spacing.lg}px`,
          boxShadow: elevation.soft,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            marginBottom: `${spacing.md}px`,
            paddingBottom: `${spacing.sm}px`,
            borderBottom: `1px dashed ${colors.dashLine}`,
          }}
        >
          <AppText variant="titleMd" color="ink" as="h2">
            {title}
          </AppText>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: 36,
              height: 36,
              borderRadius: `${radius.full}px`,
              backgroundColor: colors.surfaceSoft,
              border: 'none',
            }}
          >
            <Icon name="x" size={18} color="ink" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
