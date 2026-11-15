'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal } from '@ugcx/shared-types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  GroupHeader,
  KpiCells,
  ListRow,
  QueryStateView,
  StatusBadge,
  Tag,
} from '../../../components/ui';
import { useMyProposals } from '../../../hooks/api/useProposals';
import { useTranslation } from '../../../i18n';
import { colors } from '../../../theme/tokens';
import { formatDateShort, formatMoney } from '../../../utils/format';

export default function CreatorProposalsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const proposalsQuery = useMyProposals();

  return (
    <AppShell requiredRole="creator">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <AppText variant="displayMd" color="ink" as="h1">
            {t('creator.applications.title', 'My Proposals')}
          </AppText>
          <Button
            title={t('nav.discover', 'Browse Briefs')}
            variant="secondary"
            size="sm"
            icon="compass"
            onClick={() => router.push('/creator/discover')}
          />
        </div>

        <QueryStateView
          isLoading={proposalsQuery.isLoading}
          isError={proposalsQuery.isError}
          data={proposalsQuery.data?.data}
          isEmpty={(items) => items.length === 0}
          onRetry={() => proposalsQuery.refetch()}
          emptyTitle={t('creator.applications.title', 'My Proposals')}
          emptyMessage={t(
            'creator.applications.empty',
            'You have not applied to any campaign yet.',
          )}
          emptyActionTitle={t('nav.discover', 'Browse Briefs')}
          onEmptyAction={() => router.push('/creator/discover')}
        >
          {(proposals) => {
            const totalSent = proposals.length;
            const waiting = proposals.filter(
              (p) => p.status === 'applied' || p.status === 'shortlisted',
            );
            const shortlisted = proposals.filter((p) => p.status === 'shortlisted');
            const won = proposals.filter((p) => p.status === 'accepted');
            const declined = proposals.filter((p) => p.status === 'declined');

            const winRate = totalSent > 0 ? Math.round((won.length / totalSent) * 100) : 0;

            const funnelCells = [
              {
                label: t('creator.proposals.funnel.sent', 'Sent'),
                value: totalSent,
                hint: '100%',
              },
              {
                label: t('creator.proposals.funnel.shortlisted', 'Shortlisted'),
                value: shortlisted.length,
                hint: `${totalSent > 0 ? Math.round((shortlisted.length / totalSent) * 100) : 0}%`,
              },
              {
                label: t('creator.proposals.funnel.won', 'Won'),
                value: won.length,
                tone: 'primary' as const,
                hint: `${winRate}% ${t('creator.proposals.funnel.winRate', 'Win rate')}`,
              },
              {
                label: t('creator.proposals.funnel.declined', 'Declined'),
                value: declined.length,
                hint: `${totalSent > 0 ? Math.round((declined.length / totalSent) * 100) : 0}%`,
              },
            ];

            const renderProposalRow = (proposal: Proposal) => {
              const brandName = proposal.campaign?.brand?.companyName || 'Brand';
              const dateStr = formatDateShort(proposal.createdAt, locale);
              const isWon = proposal.status === 'accepted';
              const daysLeft = proposal.campaign?.closesAt
                ? Math.ceil(
                    (new Date(proposal.campaign.closesAt).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  )
                : null;

              return (
                <ListRow
                  key={proposal.id}
                  title={
                    <AppText
                      variant="body"
                      color="ink"
                      style={{ fontWeight: 500 }}
                      className="truncate"
                    >
                      {proposal.campaign?.title || `Campaign #${proposal.campaignId.slice(0, 8)}`}
                    </AppText>
                  }
                  subtitle={
                    <AppText variant="caption" color="muted">
                      {brandName} · {dateStr}
                    </AppText>
                  }
                  trailing={
                    <div className="flex items-center gap-3 shrink-0">
                      {daysLeft !== null && (
                        <Tag tone={daysLeft > 0 ? 'pend' : 'danger'}>
                          {daysLeft > 0
                            ? locale === 'ar'
                              ? `ينتهي خلال ${daysLeft} يوم`
                              : `Closes in ${daysLeft}d`
                            : locale === 'ar'
                              ? 'انتهى'
                              : 'Closed'}
                        </Tag>
                      )}
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: colors.ink,
                        }}
                      >
                        {formatMoney(proposal.price, proposal.currency)}
                      </span>
                      <StatusBadge status={proposal.status} domain="proposal" />
                      {isWon ? (
                        <Button
                          title={t('creator.work.viewJob', 'View work')}
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push('/creator/work')}
                        />
                      ) : null}
                    </div>
                  }
                  onClick={isWon ? () => router.push('/creator/work') : undefined}
                />
              );
            };

            return (
              <div className="flex flex-col gap-6">
                {/* Funnel KPI Strip */}
                <KpiCells items={funnelCells} />

                {/* Waiting Group */}
                <div className="flex flex-col gap-2">
                  <GroupHeader
                    label={t('creator.proposals.group.waiting', 'Waiting for review')}
                    count={waiting.length}
                  />
                  {waiting.length > 0 ? (
                    <Card padding="none" className="divide-y divide-dashed overflow-hidden">
                      {waiting.map(renderProposalRow)}
                    </Card>
                  ) : (
                    <AppText variant="caption" color="muted" className="p-3">
                      {t('creator.proposals.noWaiting', 'No waiting proposals')}
                    </AppText>
                  )}
                </div>

                {/* Won Group */}
                <div className="flex flex-col gap-2">
                  <GroupHeader label={t('creator.proposals.group.won', 'Won')} count={won.length} />
                  {won.length > 0 ? (
                    <Card padding="none" className="divide-y divide-dashed overflow-hidden">
                      {won.map(renderProposalRow)}
                    </Card>
                  ) : (
                    <AppText variant="caption" color="muted" className="p-3">
                      {t('creator.proposals.noWon', 'No won proposals yet')}
                    </AppText>
                  )}
                </div>

                {/* Declined Group */}
                <div className="flex flex-col gap-2">
                  <GroupHeader
                    label={t('creator.proposals.group.declined', 'Declined')}
                    count={declined.length}
                  />
                  {declined.length > 0 ? (
                    <Card padding="none" className="divide-y divide-dashed overflow-hidden">
                      {declined.map(renderProposalRow)}
                    </Card>
                  ) : (
                    <AppText variant="caption" color="muted" className="p-3">
                      {t('creator.proposals.noDeclined', 'No declined proposals')}
                    </AppText>
                  )}
                </div>
              </div>
            );
          }}
        </QueryStateView>
      </div>
    </AppShell>
  );
}
