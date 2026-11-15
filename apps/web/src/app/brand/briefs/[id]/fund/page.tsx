'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  Icon,
  LoadingState,
  QueryStateView,
  RadioCard,
  Receipt,
  SegmentedControl,
  StatusBadge,
  TextInput,
} from '../../../../../components/ui';
import { colors, radius, spacing } from '../../../../../theme/tokens';
import { useCampaign, usePublishCampaign } from '../../../../../hooks/api/useCampaigns';
import {
  useEscrowBalance,
  useFundEscrow,
  useManualEscrowPayment,
} from '../../../../../hooks/api/useEscrow';
import { useBrandProfile } from '../../../../../hooks/api/useBrand';
import { useBrandRole } from '../../../../../hooks/useBrandRole';
import { useTranslation } from '../../../../../i18n';
import { extractErrorMessage } from '../../../../../services/apiHelpers';
import { formatMoney } from '../../../../../utils/format';
import { centsToAmount, toCents } from '../../../../../utils/money';
import { fundTotalCents } from '../../../../../utils/fundTotal';

export default function FundEscrowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { can, role: memberRole } = useBrandRole();

  const campaignQuery = useCampaign(campaignId);
  const brandProfileQuery = useBrandProfile();
  const campaign = campaignQuery.data;
  const brand = brandProfileQuery.data;

  const [paymentType, setPaymentType] = useState<'card' | 'manual'>('card');
  const [manualMethod, setManualMethod] = useState<'instapay' | 'vodafone_cash'>('instapay');
  const [txRef, setTxRef] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [manualSubmitted, setManualSubmitted] = useState(false);

  const [polling, setPolling] = useState(false);
  const [declinedError, setDeclinedError] = useState<string | null>(null);

  const fundEscrow = useFundEscrow(campaignId);
  const manualPayment = useManualEscrowPayment(campaignId);
  const publishCampaign = usePublishCampaign();
  const escrowQuery = useEscrowBalance(campaignId, { poll: polling });

  const slots = campaign?.slots ?? 1;
  const { singleMidpointCents, totalCents } = fundTotalCents(
    campaign?.budgetMin || '0.00',
    campaign?.budgetMax || '0.00',
    slots,
  );
  const totalAmountStr = centsToAmount(totalCents);

  // Poll for card funding completion then publish brief
  useEffect(() => {
    if (!polling) return;
    const escrow = escrowQuery.data;
    if (escrow && toCents(escrow.available) >= toCents(campaign?.budgetMin || '0.00')) {
      setPolling(false);
      publishCampaign.mutate(campaignId, {
        onSuccess: () => {
          router.push(`/brand/briefs/${campaignId}`);
        },
        onError: () => {
          router.push(`/brand/briefs/${campaignId}`);
        },
      });
    }
  }, [polling, escrowQuery.data, campaignId, campaign?.budgetMin, publishCampaign, router]);

  const handleStartCardPayment = () => {
    setDeclinedError(null);
    fundEscrow.mutate(
      { amount: totalCents / 100, method: 'card' },
      {
        onSuccess: (data) => {
          if (
            !data.checkoutUrl ||
            data.checkoutUrl === 'ugcx://payment-complete' ||
            data.checkoutUrl.includes('mock') ||
            data.checkoutUrl.includes('localhost')
          ) {
            publishCampaign.mutate(campaignId, {
              onSuccess: () => {
                router.push(`/brand/briefs/${campaignId}`);
              },
              onError: () => {
                router.push(`/brand/briefs/${campaignId}`);
              },
            });
            return;
          }
          window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
          setPolling(true);
        },
        onError: (err) => {
          setDeclinedError(
            extractErrorMessage(
              err,
              locale === 'ar'
                ? 'تم رفض عملية الدفع بالبطاقة. يرجى المحاولة مرة أخرى أو اختيار وسيلة أخرى.'
                : 'Payment card was declined. Please try again or select another method.',
            ),
          );
        },
      },
    );
  };

  const handleManualPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txRef.trim()) return;
    setDeclinedError(null);
    manualPayment.mutate(
      {
        method: manualMethod,
        transactionReference: txRef.trim(),
        senderAccount: senderAccount.trim() || undefined,
        amount: totalAmountStr,
      },
      {
        onSuccess: () => {
          setManualSubmitted(true);
        },
        onError: (err) => {
          setDeclinedError(
            extractErrorMessage(
              err,
              locale === 'ar'
                ? 'فشل تسجيل بيانات التحويل اليدوي. تحقق من البيانات.'
                : 'Failed to record manual transfer details.',
            ),
          );
        },
      },
    );
  };

  const isOwner = memberRole === 'owner' || can('fundEscrow');

  return (
    <AppShell activeNav="briefs">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <QueryStateView
          isLoading={campaignQuery.isLoading || brandProfileQuery.isLoading}
          isError={campaignQuery.isError}
          data={campaign}
          onRetry={() => campaignQuery.refetch()}
        >
          {(campaign) => (
            <div className="flex flex-col gap-6">
              {/* Header Title */}
              <div className="flex flex-col gap-1">
                <AppText
                  variant="caption"
                  tone="muted"
                  className="uppercase tracking-wider font-mono text-xs"
                >
                  {brand?.companyName || 'Brand'} ·{' '}
                  {locale === 'ar' ? 'تمويل الضمان' : 'Fund Escrow'}
                </AppText>
                <AppText variant="h1" weight={500}>
                  {locale === 'ar' ? 'إيداع ميزانية الحملة' : 'Fund Campaign Escrow'}
                </AppText>
                <AppText variant="body" tone="muted">
                  {campaign.title}
                </AppText>
              </div>

              {/* Read-only banner for non-owners */}
              {!isOwner && (
                <Card
                  variant="outlined"
                  padding="md"
                  style={{
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.hairline,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon name="info" size={20} color="primary" />
                    <div className="flex flex-col gap-0.5">
                      <AppText variant="body" weight={500} tone="primary">
                        {locale === 'ar'
                          ? 'صلاحية المالك مطلوبة للتمويل'
                          : 'Owner role required to fund'}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {locale === 'ar'
                          ? 'يمكن لمالك الحساب فقط إتمام عملية التمويل ونشر الحملة.'
                          : 'Only the brand account owner can fund escrow and publish briefs.'}
                      </AppText>
                    </div>
                  </div>
                </Card>
              )}

              {/* Charge Declined Banner */}
              {declinedError && (
                <Card
                  variant="outlined"
                  padding="md"
                  style={{
                    backgroundColor: '#fff5f5',
                    borderColor: '#fecaca',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Icon name="alert-triangle" size={20} color="danger" />
                      <div className="flex flex-col gap-0.5">
                        <AppText variant="body" weight={500} style={{ color: '#b91c1c' }}>
                          {locale === 'ar' ? 'فشلت العملية' : 'Charge declined'}
                        </AppText>
                        <AppText variant="caption" style={{ color: '#7f1d1d' }}>
                          {declinedError}
                        </AppText>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setDeclinedError(null)}>
                      {locale === 'ar' ? 'إعادة المحاولة' : 'Try again'}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Receipt Layout B */}
              <Receipt
                header={
                  <div className="flex flex-col items-center gap-1 py-1">
                    <AppText
                      variant="caption"
                      tone="muted"
                      className="uppercase tracking-widest font-mono text-[11px]"
                    >
                      {locale === 'ar' ? 'إيصال الإيداع الضامن' : 'Escrow Deposit Receipt'}
                    </AppText>
                    <AppText variant="h2" weight={500} tone="primary">
                      {formatMoney(totalAmountStr)}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {slots} {slots === 1 ? 'slot' : 'slots'} · {brand?.companyName || 'Brand'}
                    </AppText>
                  </div>
                }
                lines={[
                  [
                    locale === 'ar' ? 'طبيعة المحتوى' : 'Format',
                    `${campaign.videoType || 'Product showcase'} · ${campaign.durationSeconds || 30}s · ${campaign.language || 'Arabic'}`,
                  ],
                  [
                    locale === 'ar' ? 'نطاق الميزانية' : 'Budget range',
                    `${formatMoney(campaign.budgetMin)} - ${formatMoney(campaign.budgetMax)}`,
                  ],
                  [
                    locale === 'ar' ? 'سعر المنشئ التقديري' : 'Estimated creator price',
                    formatMoney(centsToAmount(singleMidpointCents)),
                  ],
                  [
                    locale === 'ar' ? 'عدد المنشئين المطلوب' : 'Creator slots',
                    `${slots} ${slots === 1 ? (locale === 'ar' ? 'منشئ' : 'creator') : locale === 'ar' ? 'منشئين' : 'creators'}`,
                  ],
                ]}
                total={
                  <div className="flex items-center justify-between w-full py-1">
                    <AppText variant="body" weight={500}>
                      {locale === 'ar' ? 'المبلغ الإجمالي للإيداع' : 'Total deposit required'}
                    </AppText>
                    <AppText variant="body" weight={500} tone="primary">
                      {formatMoney(totalAmountStr)}
                    </AppText>
                  </div>
                }
                footer={
                  <div
                    className="flex items-center gap-2 pt-2 text-xs"
                    style={{ color: colors.muted }}
                  >
                    <Icon name="shield-check" size={16} color="primary" />
                    <span>
                      {locale === 'ar'
                        ? 'محفوظ في حساب الضمان. يُصرف فقط بعد اعتمادك للفيديو.'
                        : 'Held in escrow. Released only when you approve a video.'}
                    </span>
                  </div>
                }
              />

              {/* Payment Methods Section (Only interactive for owner) */}
              {isOwner && !manualSubmitted && (
                <div className="flex flex-col gap-4">
                  <AppText variant="h3" weight={500}>
                    {locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                  </AppText>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <RadioCard
                      selected={paymentType === 'card'}
                      title={locale === 'ar' ? 'بطاقة بنكية (Paymob)' : 'Card (Paymob)'}
                      description={
                        locale === 'ar'
                          ? 'تفعيل فوري عبر فيزا أو ماستركارد'
                          : 'Instant activation via credit/debit card'
                      }
                      icon="credit-card"
                      onSelect={() => setPaymentType('card')}
                    />
                    <RadioCard
                      selected={paymentType === 'manual'}
                      title={
                        locale === 'ar' ? 'إنستاباي أو فودافون كاش' : 'InstaPay or Vodafone Cash'
                      }
                      description={
                        locale === 'ar'
                          ? 'تحويل يدوي ومراجعة المشرف'
                          : 'Manual bank or wallet transfer'
                      }
                      icon="wallet"
                      onSelect={() => setPaymentType('manual')}
                    />
                  </div>

                  {paymentType === 'card' && (
                    <div className="flex flex-col gap-3 pt-2">
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={fundEscrow.isPending || polling}
                        onClick={handleStartCardPayment}
                      >
                        {polling
                          ? locale === 'ar'
                            ? 'جاري التحقق من نجاح الدفع...'
                            : 'Waiting for payment confirmation...'
                          : locale === 'ar'
                            ? `دفع ${formatMoney(totalAmountStr)} وتفعيل الحملة`
                            : `Fund ${formatMoney(totalAmountStr)} & Activate Brief`}
                      </Button>
                    </div>
                  )}

                  {paymentType === 'manual' && (
                    <Card variant="outlined" padding="lg">
                      <form onSubmit={handleManualPaymentSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <AppText variant="caption" tone="muted">
                            {locale === 'ar' ? 'وسيلة التحويل' : 'Transfer Channel'}
                          </AppText>
                          <SegmentedControl
                            value={manualMethod}
                            onChange={(val) => setManualMethod(val as 'instapay' | 'vodafone_cash')}
                            options={[
                              { value: 'instapay', label: 'InstaPay' },
                              { value: 'vodafone_cash', label: 'Vodafone Cash' },
                            ]}
                          />
                        </div>

                        <TextInput
                          label={
                            locale === 'ar'
                              ? 'رقم المعاملة / الرقم المرجعي للتحويل'
                              : 'Transaction Reference / Transfer ID'
                          }
                          required
                          value={txRef}
                          onChange={(e) => setTxRef(e.target.value)}
                          placeholder="e.g. IP-9823418"
                        />

                        <TextInput
                          label={
                            locale === 'ar'
                              ? 'رقم هاتف أو حساب المحول (اختياري)'
                              : 'Sender phone or account number (optional)'
                          }
                          value={senderAccount}
                          onChange={(e) => setSenderAccount(e.target.value)}
                          placeholder="e.g. 010xxxxxxxx"
                        />

                        <div className="p-3 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                          <AppText variant="caption" tone="muted">
                            {locale === 'ar'
                              ? 'سيتم تفعيل الحملة ونشرها فور تحقق فريق العمل من وصول التحويل إلى الحساب المعتمد.'
                              : 'Brief goes live after our operations team verifies the transfer.'}
                          </AppText>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          fullWidth
                          disabled={!txRef.trim() || manualPayment.isPending}
                          loading={manualPayment.isPending}
                        >
                          {locale === 'ar'
                            ? 'تأكيد تسجيل التحويل'
                            : 'Submit Transfer for Verification'}
                        </Button>
                      </form>
                    </Card>
                  )}
                </div>
              )}

              {/* Manual payment submitted status */}
              {manualSubmitted && (
                <Card variant="elevated" padding="lg">
                  <div className="flex flex-col items-center text-center gap-3 py-4">
                    <StatusBadge
                      status="pending"
                      label={
                        locale === 'ar' ? 'بانتظار التحقق من التحويل' : 'Waiting for transfer check'
                      }
                    />
                    <AppText variant="h3" weight={500}>
                      {locale === 'ar' ? 'تم تسجيل طلب الإيداع' : 'Transfer Details Submitted'}
                    </AppText>
                    <AppText variant="body" tone="muted" className="max-w-md">
                      {locale === 'ar'
                        ? 'شكراً لك. يقوم فريق العمل بمراجعة رقم التحويل وسيتم تفعيل ونشر الحملة فور التأكيد.'
                        : 'Goes live after we check the transfer. Your brief will automatically activate once confirmed.'}
                    </AppText>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/brand/briefs/${campaignId}`)}
                    >
                      {locale === 'ar' ? 'العودة لتفاصيل الحملة' : 'Back to Brief Details'}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </QueryStateView>
      </div>
    </AppShell>
  );
}
