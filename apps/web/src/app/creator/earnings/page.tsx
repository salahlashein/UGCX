'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  Equation,
  FilterChip,
  Icon,
  LedgerTable,
  ModalSheet,
  QueryStateView,
  SegmentedControl,
  SignatureCard,
  StatusBadge,
  Tag,
  TextInput,
  type LedgerTableRow,
} from '../../../components/ui';
import { colors, radius, spacing } from '../../../theme/tokens';
import {
  useCreatorEarnings,
  useCreatorLedger,
  useCreatorProfile,
  usePayoutDetails,
  usePayoutRequests,
  useRequestPayout,
  useUpsertPayoutDetails,
} from '../../../hooks/api/useCreator';
import { useMyCollaborations } from '../../../hooks/api/useCollaborations';
import { useTranslation } from '../../../i18n';
import { extractErrorMessage } from '../../../services/apiHelpers';
import { formatDateShort, formatMoney, formatRef } from '../../../utils/format';
import { toCents, centsToAmount, displayToCents } from '../../../utils/money';
import { runningBalance } from '../../../utils/ledger';

export default function CreatorEarningsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const profileQuery = useCreatorProfile();
  const creatorId = profileQuery.data?.id;

  const earningsQuery = useCreatorEarnings();
  const ledgerQuery = useCreatorLedger();
  const payoutDetailsQuery = usePayoutDetails(creatorId);
  const payoutRequestsQuery = usePayoutRequests();
  const collabsQuery = useMyCollaborations();

  const requestPayout = useRequestPayout();
  const upsertPayoutDetails = useUpsertPayoutDetails();

  const [filterType, setFilterType] = useState<'all' | 'earnings' | 'payouts'>('all');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);

  // Payout request form
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // Method update form
  const [methodType, setMethodType] = useState<'bank_transfer' | 'instapay' | 'vodafone_cash'>(
    'instapay',
  );
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [methodError, setMethodError] = useState<string | null>(null);

  const earnings = earningsQuery.data;
  const availableAmount = earnings?.pendingBalance ?? '0.00';
  const availableCents = toCents(availableAmount);
  const escrowAmount = earnings?.escrowBalance ?? '0.00';
  const clearedAmount = earnings?.clearedBalance ?? '0.00';
  const clearedCents = toCents(clearedAmount);

  // Check for open pending payout request
  const openPendingRequest = useMemo(() => {
    const list = payoutRequestsQuery.data || [];
    return list.find((r) => (r.status || '').toUpperCase() === 'PENDING');
  }, [payoutRequestsQuery.data]);

  // Active collaborations count
  const activeCollabsCount = useMemo(() => {
    const list = collabsQuery.data?.data || [];
    return list.filter((c: any) => c.status !== 'completed' && c.status !== 'cancelled').length;
  }, [collabsQuery.data]);

  // Chronological running balances for ledger rows
  const ledgerEntries = ledgerQuery.data || [];
  const chronologicalRows = useMemo(() => {
    return [...ledgerEntries].reverse();
  }, [ledgerEntries]);

  const chronologicalBalances = useMemo(() => {
    return runningBalance(
      chronologicalRows.map((r: any) => ({
        type:
          r.type ||
          (r.sign === '-' || r.sign === '−' ? 'payout' : r.sign === '+' ? 'release' : 'hold'),
        amount: r.amount,
      })),
    );
  }, [chronologicalRows]);

  const balanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < chronologicalRows.length; i++) {
      map.set(chronologicalRows[i].id, chronologicalBalances[i]);
    }
    return map;
  }, [chronologicalRows, chronologicalBalances]);

  // Filter and format statement rows
  const statementRows: LedgerTableRow[] = useMemo(() => {
    const filtered = ledgerEntries.filter((r: any) => {
      const type = (
        r.type ||
        (r.sign === '-' || r.sign === '−' ? 'payout' : r.sign === '+' ? 'release' : 'hold')
      ).toLowerCase();
      if (filterType === 'earnings') return type === 'release' || type === 'hold';
      if (filterType === 'payouts') return type === 'payout';
      return true;
    });

    return filtered.map((r: any) => {
      const type = (
        r.type ||
        (r.sign === '-' || r.sign === '−' ? 'payout' : r.sign === '+' ? 'release' : 'hold')
      ).toLowerCase();
      const isOut = type === 'payout';
      const isHold = type === 'hold';
      const balCents = balanceMap.get(r.id);

      return {
        id: r.id,
        date: r.createdAt ? formatDateShort(r.createdAt, locale) : '',
        description: r.campaignTitle ? `${r.title} · ${r.campaignTitle}` : r.title,
        reference: r.reference || formatRef(r.id, 'TX'),
        status: isHold ? 'pend' : 'done',
        statusLabel: (r.type || (isHold ? 'hold' : isOut ? 'payout' : 'release')).toUpperCase(),
        // r.amount is a display string such as "+ 1,500.00". A hold moves no
        // money to the creator, so it carries no plus sign.
        inAmount: !isOut
          ? `${isHold ? '' : '+'}${formatMoney(centsToAmount(displayToCents(r.amount)))}`
          : undefined,
        outAmount: isOut ? `−${formatMoney(centsToAmount(displayToCents(r.amount)))}` : undefined,
        balance: isHold ? '-' : formatMoney(centsToAmount(balCents ?? 0)),
      };
    });
  }, [ledgerEntries, filterType, balanceMap, locale]);

  const handleOpenPayout = () => {
    setPayoutAmount(centsToAmount(availableCents));
    setPayoutError(null);
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);

    const reqCents = toCents(payoutAmount);
    if (reqCents <= 0) {
      setPayoutError(locale === 'ar' ? 'أدخل مبلغاً صالحاً للسحب.' : 'Enter a valid amount.');
      return;
    }
    if (reqCents > availableCents) {
      setPayoutError(
        locale === 'ar'
          ? 'المبلغ المطلوب أكبر من الرصيد المتاح.'
          : 'Requested amount exceeds available balance.',
      );
      return;
    }

    try {
      await requestPayout.mutateAsync({
        amount: payoutAmount,
        method: payoutDetailsQuery.data?.method || 'instapay',
      });
      setShowPayoutModal(false);
      payoutRequestsQuery.refetch();
    } catch (err) {
      setPayoutError(extractErrorMessage(err));
    }
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setMethodError(null);

    if (!accountNumber.trim()) {
      setMethodError(locale === 'ar' ? 'أدخل رقم الحساب أو العنوان.' : 'Enter account or address.');
      return;
    }

    try {
      await upsertPayoutDetails.mutateAsync({
        method: methodType as any,
        accountIdentifier: accountNumber.trim(),
        holderName: accountName.trim() || 'Creator',
      });
      setShowMethodModal(false);
    } catch (err) {
      setMethodError(extractErrorMessage(err));
    }
  };

  return (
    <AppShell requiredRole="creator">
      <QueryStateView
        isLoading={earningsQuery.isLoading || ledgerQuery.isLoading}
        isError={earningsQuery.isError || ledgerQuery.isError}
        data={earningsQuery.data}
        onRetry={() => {
          earningsQuery.refetch();
          ledgerQuery.refetch();
          payoutDetailsQuery.refetch();
          payoutRequestsQuery.refetch();
        }}
      >
        {() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: spacing.md,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <AppText variant="caption" color={colors.textSecondary}>
                  {locale === 'ar'
                    ? 'كشف حساب وأرباح صانع المحتوى'
                    : 'Creator earnings & statement'}
                </AppText>
                <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                  {locale === 'ar' ? 'كشف الأرباح والمحفظة' : 'Earnings statement'}
                </AppText>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Button variant="secondary" size="sm" onClick={() => setShowMethodModal(true)}>
                  <Icon name="credit-card" size={14} />
                  <span>{locale === 'ar' ? 'طريقة الاستلام' : 'Payout method'}</span>
                </Button>

                <Button
                  variant="primary"
                  onClick={handleOpenPayout}
                  disabled={availableCents <= 0 || !!openPendingRequest}
                >
                  <span>{locale === 'ar' ? 'طلب سحب الرصيد' : 'Request payout'}</span>
                </Button>
              </div>
            </div>

            {/* Pending Payout Banner if Open Request Exists */}
            {openPendingRequest && (
              <div
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: radius.card,
                  backgroundColor: colors.surfaceSoft,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name="clock" size={16} />
                  <AppText variant="bodySmall" color={colors.textPrimary}>
                    {locale === 'ar'
                      ? `لديك طلب سحب معلق بمبلغ ${formatMoney(openPendingRequest.amount)} أُرسل في ${formatDateShort(openPendingRequest.createdAt, locale)}`
                      : `Open payout request of ${formatMoney(openPendingRequest.amount)} submitted on ${formatDateShort(openPendingRequest.createdAt, locale)}.`}
                  </AppText>
                </div>
                <Tag tone="pend">{locale === 'ar' ? 'قيد المراجعة' : 'PENDING REVIEW'}</Tag>
              </div>
            )}

            {/* 2-Column Hero & Payout Method Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 1fr)',
                gap: spacing.xl,
                alignItems: 'start',
              }}
            >
              {/* Hero Balances and Equation */}
              <SignatureCard variant="hero" elevation="card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: spacing.lg,
                    }}
                  >
                    <div>
                      <AppText variant="dataMonoCaps" color="rgba(255,255,255,0.7)">
                        {locale === 'ar' ? 'الرصيد المتاح' : 'Available'}
                      </AppText>
                      <div
                        style={{
                          fontSize: 36,
                          fontWeight: 500,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: colors.surface,
                          marginTop: spacing.xs,
                          direction: 'ltr',
                          textAlign: 'start',
                        }}
                      >
                        {formatMoney(availableAmount)}
                      </div>
                    </div>

                    <div>
                      <AppText variant="dataMonoCaps" color="rgba(255,255,255,0.7)">
                        {locale === 'ar' ? 'قيد الضمان' : 'In escrow'}
                      </AppText>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 500,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: colors.surface,
                          marginTop: spacing.xs,
                          direction: 'ltr',
                          textAlign: 'start',
                        }}
                      >
                        {formatMoney(escrowAmount)}
                      </div>
                      <AppText
                        variant="caption"
                        color="rgba(255,255,255,0.75)"
                        style={{ marginTop: 2, display: 'block' }}
                      >
                        {activeCollabsCount}{' '}
                        {locale === 'ar' ? 'تعاون نشط' : 'active collaborations'}
                      </AppText>
                    </div>
                  </div>

                  {/* Formula Equation: Cleared - Paid out = Available */}
                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.15)',
                      paddingTop: spacing.md,
                    }}
                  >
                    <Equation
                      items={[
                        {
                          label: locale === 'ar' ? 'المعتمد' : 'Cleared',
                          value: formatMoney(centsToAmount(clearedCents + availableCents)),
                        },
                        {
                          label: '-',
                          value: '',
                        },
                        {
                          label: locale === 'ar' ? 'تم سحبه' : 'Paid out',
                          value: formatMoney(centsToAmount(clearedCents)),
                        },
                        {
                          label: '=',
                          value: '',
                        },
                        {
                          label: locale === 'ar' ? 'المتاح للسحب' : 'Available',
                          value: formatMoney(availableAmount),
                          highlight: true,
                        },
                      ]}
                    />
                  </div>
                </div>
              </SignatureCard>

              {/* Saved Payout Method Card */}
              <Card
                elevation="card"
                style={{
                  padding: spacing.lg,
                  borderRadius: radius.card,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.md,
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <AppText
                    variant="subtitle"
                    style={{ fontWeight: 500, color: colors.textPrimary }}
                  >
                    {locale === 'ar' ? 'طريقة استلام الأرباح' : 'Payout method'}
                  </AppText>
                  <Button variant="ghost" size="sm" onClick={() => setShowMethodModal(true)}>
                    {payoutDetailsQuery.data
                      ? locale === 'ar'
                        ? 'تعديل'
                        : 'Edit'
                      : locale === 'ar'
                        ? 'إضافة'
                        : 'Add'}
                  </Button>
                </div>

                {payoutDetailsQuery.data ? (
                  <div
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.surfaceSoft,
                      borderRadius: radius.card,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.xs,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <Icon name="bank" size={16} />
                      <AppText
                        variant="bodySmall"
                        style={{ fontWeight: 500, color: colors.textPrimary }}
                      >
                        {payoutDetailsQuery.data.method === 'instapay'
                          ? 'InstaPay IPA'
                          : (payoutDetailsQuery.data.method as any) === 'vodafone_cash'
                            ? 'Vodafone Cash Wallet'
                            : 'Bank Account'}
                      </AppText>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 13,
                        color: colors.textSecondary,
                        direction: 'ltr',
                        textAlign: 'start',
                      }}
                    >
                      {payoutDetailsQuery.data.accountIdentifier ||
                        (payoutDetailsQuery.data as any).accountNumber}
                    </span>
                    {(payoutDetailsQuery.data.holderName ||
                      (payoutDetailsQuery.data as any).accountName) && (
                      <AppText variant="caption" color={colors.textTertiary}>
                        {payoutDetailsQuery.data.holderName ||
                          (payoutDetailsQuery.data as any).accountName}
                      </AppText>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.canvas,
                      borderRadius: radius.card,
                      textAlign: 'center',
                    }}
                  >
                    <AppText variant="bodySmall" color={colors.textSecondary}>
                      {locale === 'ar'
                        ? 'لم يتم تحديد طريقة استلام أرباح بعد.'
                        : 'No payout method saved yet.'}
                    </AppText>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowMethodModal(true)}
                      style={{ marginTop: spacing.sm }}
                    >
                      {locale === 'ar' ? 'إضافة طريقة استلام' : 'Add payout method'}
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Statement Table Card */}
            <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: spacing.md,
                  marginBottom: spacing.md,
                }}
              >
                <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
                  {locale === 'ar' ? 'كشف الحساب والعمليات' : 'Statement'}
                </AppText>

                <div style={{ display: 'flex', gap: spacing.xs }}>
                  <FilterChip
                    label={`${locale === 'ar' ? 'الكل' : 'All'} (${ledgerEntries.length})`}
                    selected={filterType === 'all'}
                    onClick={() => setFilterType('all')}
                  />
                  <FilterChip
                    label={locale === 'ar' ? 'الأرباح' : 'Earnings'}
                    selected={filterType === 'earnings'}
                    onClick={() => setFilterType('earnings')}
                  />
                  <FilterChip
                    label={locale === 'ar' ? 'السحوبات' : 'Payouts'}
                    selected={filterType === 'payouts'}
                    onClick={() => setFilterType('payouts')}
                  />
                </div>
              </div>

              {statementRows.length === 0 ? (
                <div style={{ padding: spacing.xl, textAlign: 'center' }}>
                  <AppText variant="bodySmall" color={colors.textSecondary}>
                    {locale === 'ar'
                      ? 'لا توجد حركات مسجلة حالياً.'
                      : 'No statement transactions yet.'}
                  </AppText>
                </div>
              ) : (
                <LedgerTable rows={statementRows} />
              )}
            </Card>

            {/* Request Payout Modal */}
            <ModalSheet
              isOpen={showPayoutModal}
              onClose={() => setShowPayoutModal(false)}
              title={locale === 'ar' ? 'طلب سحب الأرباح' : 'Request payout'}
            >
              <form
                onSubmit={handleSubmitPayout}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.md,
                  padding: spacing.md,
                }}
              >
                {payoutError && (
                  <div
                    style={{
                      padding: `${spacing.sm}px ${spacing.md}px`,
                      borderRadius: radius.chip,
                      backgroundColor: '#fef2f2',
                      border: `1px solid ${colors.danger}`,
                      color: colors.danger,
                      fontSize: 13,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {payoutError}
                  </div>
                )}

                <div>
                  <TextInput
                    label={
                      locale === 'ar'
                        ? 'المبلغ المطلوب سحبه (جنيه مصري)'
                        : 'Amount to withdraw (EGP)'
                    }
                    type="number"
                    value={payoutAmount}
                    onChangeText={setPayoutAmount}
                    mono
                    dir="ltr"
                  />
                  <AppText
                    variant="caption"
                    color={colors.textTertiary}
                    style={{ marginTop: 4, display: 'block' }}
                  >
                    {locale === 'ar' ? 'الرصيد المتاح للسحب:' : 'Available to withdraw:'}{' '}
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        direction: 'ltr',
                        display: 'inline-block',
                      }}
                    >
                      {formatMoney(availableAmount)}
                    </span>
                  </AppText>
                </div>

                <div
                  style={{
                    padding: spacing.md,
                    borderRadius: radius.card,
                    backgroundColor: colors.surfaceSoft,
                  }}
                >
                  <AppText
                    variant="caption"
                    color={colors.textSecondary}
                    style={{ display: 'block', marginBottom: 2 }}
                  >
                    {locale === 'ar' ? 'التحويل إلى:' : 'Transferring to:'}
                  </AppText>
                  <AppText
                    variant="bodySmall"
                    style={{ fontWeight: 500, color: colors.textPrimary }}
                  >
                    {payoutDetailsQuery.data
                      ? `${payoutDetailsQuery.data.method.toUpperCase()} · ${payoutDetailsQuery.data.accountIdentifier || (payoutDetailsQuery.data as any).accountNumber}`
                      : locale === 'ar'
                        ? 'يرجى حفظ طريقة استلام أولاً'
                        : 'Please configure a payout method'}
                  </AppText>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={requestPayout.isPending}
                  disabled={!payoutDetailsQuery.data}
                >
                  {locale === 'ar' ? 'تأكيد طلب السحب' : 'Confirm payout request'}
                </Button>
              </form>
            </ModalSheet>

            {/* Payout Method Modal */}
            <ModalSheet
              isOpen={showMethodModal}
              onClose={() => setShowMethodModal(false)}
              title={locale === 'ar' ? 'إعداد طريقة استلام الأرباح' : 'Payout method settings'}
            >
              <form
                onSubmit={handleSaveMethod}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.md,
                  padding: spacing.md,
                }}
              >
                {methodError && (
                  <div
                    style={{
                      padding: `${spacing.sm}px ${spacing.md}px`,
                      borderRadius: radius.chip,
                      backgroundColor: '#fef2f2',
                      border: `1px solid ${colors.danger}`,
                      color: colors.danger,
                      fontSize: 13,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {methodError}
                  </div>
                )}

                <div>
                  <AppText
                    variant="dataMonoCaps"
                    color={colors.textSecondary}
                    style={{ marginBottom: spacing.xs, display: 'block' }}
                  >
                    {locale === 'ar' ? 'نوع طريقة الدفع' : 'Payment method'}
                  </AppText>
                  <SegmentedControl
                    options={[
                      { label: 'InstaPay', value: 'instapay' },
                      { label: 'Vodafone Cash', value: 'vodafone_cash' },
                      { label: locale === 'ar' ? 'تحويل بنكي' : 'Bank', value: 'bank_transfer' },
                    ]}
                    value={methodType}
                    onChange={(val) => setMethodType(val as any)}
                  />
                </div>

                <TextInput
                  label={
                    methodType === 'instapay'
                      ? locale === 'ar'
                        ? 'معرف إنستاباي (IPA address)'
                        : 'InstaPay IPA address'
                      : methodType === 'vodafone_cash'
                        ? locale === 'ar'
                          ? 'رقم محفظة فودافون كاش'
                          : 'Vodafone Cash phone number'
                        : locale === 'ar'
                          ? 'رقم الحساب البنكي / الآيبان'
                          : 'IBAN / Bank account number'
                  }
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  mono
                  dir="ltr"
                  placeholder={
                    methodType === 'instapay'
                      ? 'username@instapay'
                      : methodType === 'vodafone_cash'
                        ? '+201012345678'
                        : 'EG...'
                  }
                />

                <TextInput
                  label={locale === 'ar' ? 'اسم المستفيد' : 'Account beneficiary name'}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="Full name as registered"
                />

                {methodType === 'bank_transfer' && (
                  <TextInput
                    label={locale === 'ar' ? 'اسم البنك' : 'Bank name'}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. CIB, NBE, QNB"
                  />
                )}

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={upsertPayoutDetails.isPending}
                >
                  {locale === 'ar' ? 'حفظ طريقة الاستلام' : 'Save payout method'}
                </Button>
              </form>
            </ModalSheet>
          </div>
        )}
      </QueryStateView>
    </AppShell>
  );
}
