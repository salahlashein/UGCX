'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icon';

export interface VideoVersion {
  id: string;
  label: string;
  src: string;
}

export interface VideoPlayerProps {
  src?: string;
  versions?: VideoVersion[];
  activeVersion?: string;
  onVersionChange?: (id: string) => void;
  expiresInSeconds?: number | null;
  onRefresh?: () => void;
  poster?: string;
  autoPlay?: boolean;
  /** UGC video is vertical, so the frame is 9:16 by default. */
  orientation?: 'portrait' | 'landscape';
  className?: string;
}

export function VideoPlayer({
  src,
  versions,
  activeVersion,
  onVersionChange,
  expiresInSeconds,
  onRefresh,
  poster,
  orientation = 'portrait',
  className = '',
}: VideoPlayerProps) {
  const isExpired = typeof expiresInSeconds === 'number' && expiresInSeconds <= 0;

  return (
    <div
      className={`flex flex-col w-full overflow-hidden ${className}`}
      style={{
        borderRadius: `${radius.card}px`,
        backgroundColor: colors.surfaceDark,
        border: `1px solid ${colors.surfaceDarkElevated}`,
      }}
    >
      {/* Version Tabs Header (if multiple versions) */}
      {versions && versions.length > 1 ? (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5"
          style={{ borderBottom: `1px dashed rgba(255, 255, 255, 0.15)` }}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {versions.map((ver) => {
              const isActive = ver.id === activeVersion;
              return (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => onVersionChange?.(ver.id)}
                  className="px-2.5 py-1 text-xs font-mono transition-colors rounded cursor-pointer"
                  style={{
                    backgroundColor: isActive ? colors.signatureMint : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? colors.surfaceDark : colors.onDark,
                    fontWeight: 500,
                  }}
                >
                  {ver.label}
                </button>
              );
            })}
          </div>

          {/* Expiry Badge */}
          {expiresInSeconds !== undefined && expiresInSeconds !== null ? (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Icon name="clock" size={13} color="muted" />
              <span
                style={{
                  color: isExpired ? colors.signatureCoral : 'rgba(255,255,255,0.6)',
                }}
              >
                {isExpired ? 'Link expired' : `Link valid: ${Math.round(expiresInSeconds / 60)}m`}
              </span>
              {isExpired && onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="text-xs underline text-white hover:text-white/80 cursor-pointer ms-1"
                >
                  Refresh
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Video Content */}
      <div
        className="relative w-full bg-black flex items-center justify-center mx-auto"
        style={{
          aspectRatio: orientation === 'portrait' ? '9 / 16' : '16 / 9',
          maxWidth: orientation === 'portrait' ? 340 : undefined,
          maxHeight: orientation === 'portrait' ? '70vh' : undefined,
        }}
      >
        {isExpired ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-white">
            <Icon name="alert-circle" size={32} color="danger" />
            <AppText variant="body" color="onDark" style={{ fontWeight: 500 }}>
              This video link has expired
            </AppText>
            {onRefresh ? (
              <Button
                title="Refresh Link"
                variant="secondary"
                size="sm"
                icon="refresh-cw"
                onClick={onRefresh}
              />
            ) : null}
          </div>
        ) : (
          <video
            src={src}
            controls
            poster={poster}
            className="w-full h-full object-contain"
            playsInline
          />
        )}
      </div>
    </div>
  );
}
