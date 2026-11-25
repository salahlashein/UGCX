'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card } from '../../components/ui';
import { colors, radius, spacing } from '../../theme/tokens';

function SkeletonBlock({
  width,
  height,
  borderRadius = radius.button,
  style,
}: {
  width: string | number;
  height: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: colors.surfaceSoft,
        border: `1px solid ${colors.border}`,
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export default function BrandLoading() {
  return (
    <AppShell requiredRole="brand">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <SkeletonBlock width={48} height={48} borderRadius={radius.card} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              <SkeletonBlock width={120} height={14} />
              <SkeletonBlock width={180} height={24} />
            </div>
          </div>
          <SkeletonBlock width={120} height={40} />
        </div>

        {/* Hero Card Skeleton */}
        <Card
          elevation="card"
          style={{
            padding: spacing.xl,
            borderRadius: radius.card,
            backgroundColor: colors.surface,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <SkeletonBlock width={140} height={14} />
            <SkeletonBlock width={220} height={42} />
            <SkeletonBlock width={260} height={16} />
          </div>
        </Card>

        {/* Grid Skeletons */}
        <div
          className="ugcx-split"
          style={
            {
              gap: spacing.lg,
              ['--split-main' as string]: '2fr',
              ['--split-side-min' as string]: '260px',
            } as React.CSSProperties
          }
        >
          <Card
            elevation="card"
            style={{ padding: spacing.lg, borderRadius: radius.card, minHeight: 200 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <SkeletonBlock width={160} height={20} />
              <SkeletonBlock width="100%" height={48} />
              <SkeletonBlock width="100%" height={48} />
            </div>
          </Card>
          <div className="ugcx-two-input-grid" style={{ gap: spacing.md }}>
            <SkeletonBlock width="100%" height={90} borderRadius={radius.card} />
            <SkeletonBlock width="100%" height={90} borderRadius={radius.card} />
            <SkeletonBlock width="100%" height={90} borderRadius={radius.card} />
            <SkeletonBlock width="100%" height={90} borderRadius={radius.card} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
