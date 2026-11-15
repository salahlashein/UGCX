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

export default function CreatorLoading() {
  return (
    <AppShell requiredRole="creator">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <SkeletonBlock width={48} height={48} borderRadius={radius.card} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              <SkeletonBlock width={160} height={24} />
              <SkeletonBlock width={120} height={14} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <SkeletonBlock width={40} height={40} />
            <SkeletonBlock width={130} height={40} />
          </div>
        </div>

        {/* 2-Column Main Workspace Skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
            gap: spacing.xl,
            alignItems: 'start',
          }}
        >
          {/* Left Column Skeletons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <SkeletonBlock width={140} height={20} />
                <SkeletonBlock width="100%" height={56} />
                <SkeletonBlock width="100%" height={56} />
              </div>
            </Card>
            <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <SkeletonBlock width={160} height={20} />
                <SkeletonBlock width="100%" height={56} />
                <SkeletonBlock width="100%" height={56} />
              </div>
            </Card>
          </div>

          {/* Right Column Skeletons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <SkeletonBlock width={120} height={20} />
                <SkeletonBlock width="100%" height={80} borderRadius={radius.card} />
                <SkeletonBlock width="100%" height={36} />
              </div>
            </Card>
            <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <SkeletonBlock width={130} height={20} />
                <SkeletonBlock width="100%" height={70} borderRadius={radius.card} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
