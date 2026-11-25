'use client';

import React from 'react';
import { MiniBar, StatusBadge, Tag, type DataTableColumn } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import type { BriefListItem } from '../../../../hooks/api/useCampaigns';
import { formatDateShort, formatMoney, getInitials } from '../../../../utils/format';
import { toCents } from '../../../../utils/money';
import { deriveStage } from '../../../../utils/briefStage';
import { pendingManualPayment } from '../../../../utils/pendingPayment';
import type { Locale } from '../../../../i18n';

function getStageNextStep(stage: string, brief: BriefListItem, isAr: boolean): string {
  switch (stage) {
    case 'draft':
      // A submitted transfer is waiting for the admin (UI audit G8).
      if (pendingManualPayment(brief)) return isAr ? 'الدفع بيتراجع' : 'Payment being checked';
      return isAr ? 'بانتظار سداد الضمان' : 'Needs escrow funding';
    case 'live':
      return (brief.proposalCount ?? 0) > 0
        ? isAr
          ? 'مراجعة العروض المقدمة'
          : 'Review creator proposals'
        : isAr
          ? 'في انتظار تقديم العروض'
          : 'Waiting for proposals';
    case 'in_production':
      return isAr ? 'الصانع يقوم بالتصوير' : 'Creator filming deliverable';
    case 'in_review':
      return isAr ? 'الفيديو جاهز للمراجعة' : 'Review deliverable video';
    case 'completed':
      return isAr ? 'اكتملت الحملة بنجاح' : 'Campaign completed';
    default:
      return '-';
  }
}

export function useBriefsColumns(locale: Locale): DataTableColumn<BriefListItem>[] {
  const isAr = locale === 'ar';

  return [
    {
      key: 'brief',
      header: isAr ? 'البريف' : 'Brief',
      render: (b) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 500, fontSize: 14, color: colors.textPrimary }}>
            {b.title}
          </span>
          <span style={{ fontSize: 12, color: colors.textSecondary }}>
            {getStageNextStep(deriveStage(b), b, isAr)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (b) => <StatusBadge status={deriveStage(b)} domain="campaign" />,
    },
    {
      key: 'proposals',
      header: isAr ? 'العروض' : 'Proposals',
      align: 'end',
      render: (b) => {
        const total = b.totalProposals ?? b.proposalCount ?? 0;
        const applied = b.appliedCount ?? 0;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.xs }}>
            <span
              style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 500, fontSize: 13 }}
            >
              {total}
            </span>
            {applied > 0 && <Tag tone="live">{`+${applied} ${isAr ? 'جديد' : 'new'}`}</Tag>}
          </div>
        );
      },
    },
    {
      key: 'hired',
      header: isAr ? 'المتعاقدون' : 'Hired',
      align: 'end',
      render: (b) => {
        const count = b.hiredCount ?? (b.acceptedCreatorName ? 1 : 0);
        const hiredList = b.hired || [];
        if (count === 0)
          return (
            <span style={{ color: colors.textTertiary, fontFamily: 'var(--font-mono, monospace)' }}>
              0
            </span>
          );
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.xs }}>
            {hiredList.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {hiredList.slice(0, 4).map((h, i) => (
                  <div
                    key={h.creatorId || i}
                    title={h.displayName || 'Creator'}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: radius.card,
                      backgroundColor: colors.accentSoft,
                      color: colors.primary,
                      border: `1.5px solid ${colors.surface}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 500,
                      marginInlineStart: i === 0 ? 0 : -8,
                      zIndex: 4 - i,
                    }}
                  >
                    {h.initials || getInitials(h.displayName)}
                  </div>
                ))}
              </div>
            ) : b.acceptedCreatorName ? (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: radius.card,
                  backgroundColor: colors.accentSoft,
                  color: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 500,
                }}
              >
                {getInitials(b.acceptedCreatorName)}
              </div>
            ) : null}
            <span
              style={{ fontSize: 13, fontFamily: 'var(--font-mono, monospace)', fontWeight: 500 }}
            >
              {count}
            </span>
          </div>
        );
      },
    },
    {
      key: 'escrow',
      header: isAr ? 'الضمان المستخدم (ج.م)' : 'Escrow used (EGP)',
      render: (b) => {
        const allocated = toCents(b.escrowAllocatedAmount);
        const funded = toCents(b.escrowFundedAmount);
        if (funded <= 0) {
          const pending = pendingManualPayment(b);
          return (
            <span style={{ fontSize: 12, color: colors.textSecondary }}>
              {pending
                ? isAr
                  ? 'الدفع بيتراجع'
                  : 'Being checked'
                : isAr
                  ? 'غير ممول'
                  : 'Not funded'}
            </span>
          );
        }
        // Whole pounds on one line; the currency is in the header (UI audit brand-briefs/W1).
        const whole = (v: string | null | undefined) =>
          Math.round(Number(v ?? 0)).toLocaleString('en-US');
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 132 }}>
            <MiniBar value={allocated} max={funded} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                fontFamily: 'var(--font-mono, monospace)',
                color: colors.textSecondary,
                direction: 'ltr',
                unicodeBidi: 'isolate',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>
                {whole(b.escrowAllocatedAmount)} / {whole(b.escrowFundedAmount)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'ends',
      header: isAr ? 'تاريخ الإغلاق' : 'Ends',
      align: 'end',
      render: (b) => (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            color: colors.textSecondary,
          }}
        >
          {b.closesAt
            ? formatDateShort(b.closesAt, locale)
            : b.status === 'draft'
              ? isAr
                ? 'غير منشور'
                : 'Not live'
              : '—'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'end',
      render: () => (
        <span aria-hidden="true" style={{ color: colors.textSecondary, fontSize: 14 }}>
          →
        </span>
      ),
    },
  ];
}
