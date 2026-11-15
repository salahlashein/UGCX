'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BillingEntryType } from '@ugcx/shared-types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  Equation,
  FilterChip,
  KpiCells,
  LedgerTable,
  QueryStateView,
  SignatureCard,
  StatusBadge,
} from '../../../components/ui';
import { colors, radius, spacing } from '../../../theme/tokens';
import { useBilling } from '../../../hooks/api/useBilling';
import { useBrandProfile } from '../../../hooks/api/useBrand';
import { useBrandRole } from '../../../hooks/useBrandRole';
import { useTranslation } from '../../../i18n';
import { formatDateShort, formatMoney } from '../../../utils/format';
import { verifyBillingEquation } from '../../../utils/billingEquation';

export default function BrandBillingPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { can, role: memberRole } = useBrandRole();
  const brandProfileQuery = useBrandProfile();
  const brand = brandProfileQuery.data;

  const [selectedType, setSelectedType] = useState<BillingEntryType | undefined>(undefined);

  const billingQuery = useBilling({
    page: 1,
    perPage: 50,
    type: selectedType,
  });

  const isOwner = memberRole === 'owner';
  const isViewer = memberRole === 'viewer';

  const filterChips: { id: BillingEntryType | 'all'; labelEn: string; labelAr: string }[] = [
    { id: 'all', labelEn: 'All', labelAr: 'الكل' },
    { id: 'charge', labelEn: 'Funded', labelAr: 'الإيداعات' },
    { id: 'release', labelEn: 'Released', labelAr: 'المصروف' },
    { id: 'hold', labelEn: 'Allocated', labelAr: 'المحجوز' },
    { id: 'refund', labelEn: 'Refunds', labelAr: 'المستردات' },
  ];

  return (
    <AppShell activeNav="billing">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <AppText
              variant="caption"
              tone="muted"
              className="uppercase tracking-wider font-mono text-xs"
            >
              {brand?.companyName || 'Brand'} ·{' '}
              {locale === 'ar' ? 'كشف الحساب' : 'Escrow Statement'}
            </AppText>
            <AppText variant="h1" weight={500}>
              {locale === 'ar' ? 'سجل المعاملات والضمان' : 'Billing & Escrow Statement'}
            </AppText>
          </div>

          {isOwner && (
            <Button variant="primary" size="md" onClick={() => router.push('/brand/briefs')}>
              {locale === 'ar' ? 'تمويل حملة جديدة' : 'Fund a brief'}
            </Button>
          )}
        </div>

        {/* Viewer access warning if viewer navigated here */}
        {isViewer && (
          <Card variant="outlined" padding="md">
            <AppText variant="body" tone="muted">
              {locale === 'ar'
                ? 'عرض فقط: لا تملك صلاحية تعديل أو تمويل المعاملات.'
                : 'Viewer access: You have read-only visibility for billing.'}
            </AppText>
          </Card>
        )}

        <QueryStateView
          isLoading={billingQuery.isLoading || brandProfileQuery.isLoading}
          isError={billingQuery.isError || brandProfileQuery.isError}
          data={billingQuery.data}
          onRetry={() => {
            billingQuery.refetch();
            brandProfileQuery.refetch();
          }}
        >
          {(billingData) => (
            <div className="flex flex-col gap-6">
              {/* Hero Signature Card */}
              {billingData.summary && (
                <div className="flex flex-col gap-4">
                  <SignatureCard variant="dark">
                    <div className="flex flex-col gap-1 p-2">
                      <AppText variant="overline" color="signatureMint">
                        {locale === 'ar' ? 'الرصيد المتاح في الضمان' : 'AVAILABLE IN ESCROW'}
                      </AppText>
                      <AppText variant="metric" color="onPrimary" tabular>
                        {formatMoney(
                          billingData.summary.available ?? '0.00',
                          billingData.summary.currency ?? 'EGP',
                        )}
                      </AppText>
                      <AppText variant="caption" color="signatureMint" className="opacity-80">
                        {locale === 'ar'
                          ? 'رصيد قابل للتخصيص الفوري للحملات الجديدة'
                          : 'Balance available for instant creator allocation'}
                      </AppText>
                    </div>
                  </SignatureCard>

                  {/* Detail cells first, then one reconciliation note. The
                      numbers appear once, not twice. */}
                  {/* Detailed KPI Cells */}
                  <KpiCells
                    items={[
                      {
                        label: locale === 'ar' ? 'إجمالي المودع' : 'Total Funded',
                        value: formatMoney(billingData.summary.funded || '0.00'),
                        hint: locale === 'ar' ? 'الإيداعات المعتمدة' : 'Deposits',
                      },
                      {
                        label: locale === 'ar' ? 'المسترد' : 'Refunded',
                        value: formatMoney(billingData.summary.refunded || '0.00'),
                        hint: locale === 'ar' ? 'عائد للبطاقة/الحساب' : 'Returned',
                      },
                      {
                        label: locale === 'ar' ? 'المصروف' : 'Released',
                        value: formatMoney(billingData.summary.released || '0.00'),
                        hint: locale === 'ar' ? 'للمنشئين (شامل الرسوم)' : 'Paid on approval',
                      },
                      {
                        label: locale === 'ar' ? 'المحجوز لحملات جارية' : 'Allocated',
                        value: formatMoney(billingData.summary.allocated || '0.00'),
                        hint: locale === 'ar' ? 'قيد التنفيذ' : 'In active collabs',
                      },
                    ]}
                  />

                  {(() => {
                    const eq = verifyBillingEquation({
                      funded: billingData.summary.funded || '0.00',
                      refunded: billingData.summary.refunded || '0.00',
                      released: billingData.summary.released || '0.00',
                      allocated: billingData.summary.allocated || '0.00',
                      available: billingData.summary.available || '0.00',
                    });
                    if (!eq.reconciles) return null;
                    return (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <AppText variant="caption" color="muted">
                          {locale === 'ar'
                            ? 'المودع ناقص المسترد ناقص المصروف ناقص المحجوز يساوي المتاح. تمت المطابقة بالكامل.'
                            : 'Funded minus refunded, released and allocated equals available. Reconciled to the cent.'}
                        </AppText>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {filterChips.map((chip) => {
                  const isSelected =
                    chip.id === 'all' ? selectedType === undefined : selectedType === chip.id;
                  return (
                    <FilterChip
                      key={chip.id}
                      selected={isSelected}
                      label={locale === 'ar' ? chip.labelAr : chip.labelEn}
                      onClick={() => setSelectedType(chip.id === 'all' ? undefined : chip.id)}
                    />
                  );
                })}
              </div>

              {/* Ledger Table */}
              {billingData.data.length === 0 ? (
                <EmptyState
                  title={locale === 'ar' ? 'لا توجد معاملات مسجلة' : 'No transactions found'}
                  message={
                    locale === 'ar'
                      ? 'لم يتم العثور على حركات مالية مطابقة لهذا الفلتر.'
                      : 'No billing records match the selected filter.'
                  }
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <LedgerTable
                    rows={billingData.data.map((entry) => {
                      const dir =
                        entry.direction ||
                        (entry.type === 'charge' ? 'in' : entry.type === 'hold' ? 'hold' : 'out');

                      const formattedAmt = formatMoney(
                        entry.escrowAmount || entry.amount.replace(/^[+-]/, ''),
                      );

                      return {
                        id: entry.id,
                        date: formatDateShort(entry.createdAt, locale),
                        description: entry.label,
                        subtitle: entry.campaignTitle || undefined,
                        reference:
                          entry.reference ||
                          `TX-${entry.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
                        statusLabel: entry.type.toUpperCase(),
                        direction: dir,
                        inAmount: dir === 'in' ? formattedAmt : undefined,
                        outAmount: dir === 'out' ? formattedAmt : undefined,
                      };
                    })}
                  />
                </div>
              )}
            </div>
          )}
        </QueryStateView>
      </div>
    </AppShell>
  );
}
