'use client';

import React, { useState } from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { useDeliverablePlayUrl } from '../../hooks/api/useDeliverables';
import { Icon } from './Icon';

export interface DeliverableThumbProps {
  deliverableId: string;
  /** Shown over the frame, e.g. "V1". */
  label?: string;
  /** Where a click goes (review screen); without it the thumb plays inline. */
  onOpen?: () => void;
  width?: number;
}

/**
 * The first frame of a delivered video in a 9:16 frame. Screens about a
 * video lead with the video, not with stat tiles (visual direction A).
 * The file is private, so the frame loads through the signed play URL.
 */
export function DeliverableThumb({
  deliverableId,
  label,
  onOpen,
  width = 132,
}: DeliverableThumbProps) {
  const playUrl = useDeliverablePlayUrl(deliverableId);
  const [failed, setFailed] = useState(false);
  const url = playUrl.data?.url;

  const frame: React.CSSProperties = {
    position: 'relative',
    width,
    aspectRatio: '9 / 16',
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceDark,
    flexShrink: 0,
  };

  const content =
    url && !failed ? (
      // #t= asks the browser to paint a frame instead of a black box.
      <video
        src={`${url}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        controls={!onOpen}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          color: colors.onDark,
        }}
      >
        <Icon name="film" size={22} />
      </div>
    );

  const badge = label ? (
    <span
      style={{
        position: 'absolute',
        top: spacing.xs,
        insetInlineStart: spacing.xs,
        padding: '2px 8px',
        borderRadius: radius.pill,
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: colors.onDark,
        fontSize: 12,
        lineHeight: '16px',
      }}
    >
      {label}
    </span>
  ) : null;

  if (!onOpen) {
    return (
      <div style={frame}>
        {content}
        {badge}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label ? `Open ${label}` : 'Open video'}
      style={{ ...frame, border: 'none', padding: 0, cursor: 'pointer' }}
    >
      {content}
      {badge}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(255,255,255,0.9)',
            display: 'grid',
            placeItems: 'center',
            color: colors.ink,
          }}
        >
          <Icon name="video" size={18} />
        </span>
      </span>
    </button>
  );
}
