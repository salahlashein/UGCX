'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppText,
  Button,
  Card,
  PageHeader,
  QueryStateView,
  SegmentedControl,
  Tabs,
  TextInput,
} from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n';
import { extractErrorMessage } from '../../services/apiHelpers';
import { formatMoney } from '../../utils/format';
import {
  parseManualPayment,
  payoutMethodFor,
  useAdminCreators,
  useAdminPayouts,
  useMarkPaid,
  usePendingEscrow,
  useVerifyEscrow,
  useVetCreator,
  type AdminCreator,
  type AdminPayout,
  type AdminPendingEscrow,
  type PayoutMethod,
} from '../../hooks/api/useAdmin';

type Section = 'creators' | 'payments' | 'payouts';
type Locale = 'en' | 'ar';

const methodLabel = (method: string, locale: Locale): string =>
  ({
    instapay: locale === 'ar' ? 'إنستاباي' : 'InstaPay',
    vodafone_cash: locale === 'ar' ? 'فودافون كاش' : 'Vodafone Cash',
    mobile_wallet: locale === 'ar' ? 'محفظة موبايل' : 'Mobile wallet',
    bank_transfer: locale === 'ar' ? 'تحويل بنكي' : 'Bank transfer',
  })[method] ?? method;

const formatDate = (iso: string, locale: Locale): string =>
  new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** One label/value pair in a row. Long values wrap instead of widening the page. */
function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <span
        className={`break-words ${mono ? 'font-mono text-sm' : ''}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </div>
  );
}

/** Shows an action error under its row, or nothing. */
function RowError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <AppText variant="caption" tone="danger">
      {extractErrorMessage(error)}
    </AppText>
  );
}

function CreatorRow({ creator, locale }: { creator: AdminCreator; locale: Locale }) {
  const vet = useVetCreator();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Field
            label={locale === 'ar' ? 'الاسم' : 'Name'}
            value={creator.displayName || creator.user?.email || '—'}
          />
          <Field label={locale === 'ar' ? 'المدينة' : 'City'} value={creator.city || '—'} />
          <Field
            label={locale === 'ar' ? 'المجالات' : 'Niches'}
            value={
              creator.niches.length
                ? creator.niches
                    .map((n) => n.replace(/_/g, ' '))
                    .join(locale === 'ar' ? '، ' : ', ')
                : '—'
            }
          />
          <Field
            label={locale === 'ar' ? 'السعر الأساسي' : 'Base price'}
            value={creator.basePrice ? formatMoney(creator.basePrice) : '—'}
          />
        </div>
        {creator.verificationClipUrl && (
          <a
            href={creator.verificationClipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-sm w-fit"
          >
            {locale === 'ar' ? 'شوف فيديو التحقق' : 'Watch verification clip'}
          </a>
        )}

        {rejecting ? (
          <div className="flex flex-col gap-3">
            <TextInput
              label={
                locale === 'ar' ? 'سبب الرفض (الكريتور هيشوفه)' : 'Reason (the creator sees it)'
              }
              value={reason}
              onChangeText={setReason}
              multiline
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                size="sm"
                loading={vet.isPending}
                onClick={() =>
                  vet.mutate({
                    id: creator.id,
                    status: 'rejected',
                    reason: reason.trim() || undefined,
                  })
                }
              >
                {locale === 'ar' ? 'تأكيد الرفض' : 'Confirm reject'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
                {locale === 'ar' ? 'رجوع' : 'Cancel'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={vet.isPending}
              onClick={() => vet.mutate({ id: creator.id, status: 'approved' })}
            >
              {locale === 'ar' ? 'موافقة' : 'Approve'}
            </Button>
            <Button variant="danger-outline" size="sm" onClick={() => setRejecting(true)}>
              {locale === 'ar' ? 'رفض' : 'Reject'}
            </Button>
          </div>
        )}
        <RowError error={vet.error} />
      </div>
    </Card>
  );
}

function PaymentRow({ payment, locale }: { payment: AdminPendingEscrow; locale: Locale }) {
  const verify = useVerifyEscrow();
  const [confirming, setConfirming] = useState<'approve' | 'reject' | null>(null);
  const { method, reference } = parseManualPayment(payment.fundingPaymobOrderId);
  const amount = formatMoney(payment.fundingRequestedAmount);

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field
            label={locale === 'ar' ? 'البراند' : 'Brand'}
            value={payment.brand?.companyName || payment.brand?.user?.email || '—'}
          />
          <Field label={locale === 'ar' ? 'الموجز' : 'Brief'} value={payment.title} />
          <Field label={locale === 'ar' ? 'المبلغ' : 'Amount'} value={amount} />
          <Field
            label={locale === 'ar' ? 'الطريقة' : 'Method'}
            value={methodLabel(method, locale)}
          />
          <Field label={locale === 'ar' ? 'رقم العملية' : 'Reference'} value={reference} mono />
          <Field
            label={locale === 'ar' ? 'تاريخ الموجز' : 'Brief created'}
            value={formatDate(payment.createdAt, locale)}
          />
        </div>

        {confirming ? (
          <div className="flex flex-col gap-3">
            <AppText variant="body">
              {confirming === 'approve'
                ? locale === 'ar'
                  ? `اتأكدت إن ${amount} وصلوا برقم العملية ${reference}؟ الموجز هيتنشر والفلوس تدخل الضمان.`
                  : `Did ${amount} arrive with reference ${reference}? The brief goes live and the money enters escrow.`
                : locale === 'ar'
                  ? 'رفض الدفعة؟ البراند هيحتاج يبعت تاني.'
                  : 'Reject this payment? The brand has to submit it again.'}
            </AppText>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={confirming === 'approve' ? 'primary' : 'danger'}
                size="sm"
                loading={verify.isPending}
                onClick={() =>
                  verify.mutate({ id: payment.id, approved: confirming === 'approve' })
                }
              >
                {confirming === 'approve'
                  ? locale === 'ar'
                    ? 'أيوه، الفلوس وصلت'
                    : 'Yes, it arrived'
                  : locale === 'ar'
                    ? 'أيوه، ارفض'
                    : 'Yes, reject'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                {locale === 'ar' ? 'رجوع' : 'Cancel'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => setConfirming('approve')}>
              {locale === 'ar' ? 'تأكيد الدفع' : 'Confirm payment'}
            </Button>
            <Button variant="danger-outline" size="sm" onClick={() => setConfirming('reject')}>
              {locale === 'ar' ? 'رفض' : 'Reject'}
            </Button>
          </div>
        )}
        <RowError error={verify.error} />
      </div>
    </Card>
  );
}

function PayoutRow({ payout, locale }: { payout: AdminPayout; locale: Locale }) {
  const markPaid = useMarkPaid();
  const detail = payout.creator?.payoutDetail ?? null;
  const [method, setMethod] = useState<PayoutMethod>(payoutMethodFor(detail?.method));
  const [reference, setReference] = useState('');
  const amount = formatMoney(payout.creatorPrice);

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field
            label={locale === 'ar' ? 'الكريتور' : 'Creator'}
            value={payout.creator?.displayName || payout.creator?.user?.email || '—'}
          />
          <Field
            label={locale === 'ar' ? 'الموجز' : 'Brief'}
            value={payout.campaign?.title || '—'}
          />
          <Field
            label={locale === 'ar' ? 'المبلغ اللي هيتحوّل' : 'Amount to send'}
            value={amount}
          />
        </div>

        {detail ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
            <Field
              label={locale === 'ar' ? 'حوّل على' : 'Send by'}
              value={methodLabel(detail.method, locale)}
            />
            <Field
              label={locale === 'ar' ? 'الحساب' : 'Account'}
              value={detail.accountIdentifier}
              mono
            />
            <Field label={locale === 'ar' ? 'باسم' : 'Holder'} value={detail.holderName} />
          </div>
        ) : (
          <AppText variant="caption" tone="danger">
            {locale === 'ar'
              ? 'الكريتور لسه مضافش بيانات التحويل. اطلب منه يضيفها من صفحة الأرباح.'
              : 'This creator has no payout account yet. Ask them to add one on their earnings page.'}
          </AppText>
        )}

        <div className="flex flex-col gap-3">
          <SegmentedControl
            value={method}
            onChange={(val) => setMethod(val as PayoutMethod)}
            options={(['instapay', 'vodafone_cash', 'bank_transfer'] as const).map((m) => ({
              value: m,
              label: methodLabel(m, locale),
            }))}
          />
          <TextInput
            label={locale === 'ar' ? 'رقم عملية التحويل' : 'Transfer reference'}
            value={reference}
            onChangeText={setReference}
            mono
          />
          <Button
            variant="primary"
            size="sm"
            disabled={!reference.trim() || markPaid.isPending}
            loading={markPaid.isPending}
            onClick={() =>
              markPaid.mutate({ collaborationId: payout.id, method, reference: reference.trim() })
            }
          >
            {locale === 'ar' ? `اتحوّل ${amount}` : `Mark ${amount} as paid`}
          </Button>
        </div>
        <RowError error={markPaid.error} />
      </div>
    </Card>
  );
}

function CreatorsSection({ locale }: { locale: Locale }) {
  const query = useAdminCreators('pending');
  return (
    <QueryStateView
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      data={query.data}
      onRetry={() => query.refetch()}
      isEmpty={(d) => d.data.length === 0}
      emptyTitle={locale === 'ar' ? 'مفيش كريتورز مستنيين' : 'No creators waiting'}
      emptyMessage={
        locale === 'ar' ? 'الكريتورز الجداد هيظهروا هنا.' : 'New creators show up here.'
      }
    >
      {(d) => (
        <div className="flex flex-col gap-3">
          {d.data.map((c) => (
            <CreatorRow key={c.id} creator={c} locale={locale} />
          ))}
        </div>
      )}
    </QueryStateView>
  );
}

function PaymentsSection({ locale }: { locale: Locale }) {
  const query = usePendingEscrow();
  return (
    <QueryStateView
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      data={query.data}
      onRetry={() => query.refetch()}
      isEmpty={(d) => d.data.length === 0}
      emptyTitle={locale === 'ar' ? 'مفيش دفعات مستنية' : 'No payments waiting'}
      emptyMessage={
        locale === 'ar'
          ? 'لما براند يبعت رقم عملية InstaPay أو Vodafone Cash، هيظهر هنا.'
          : 'When a brand submits an InstaPay or Vodafone Cash reference, it shows up here.'
      }
    >
      {(d) => (
        <div className="flex flex-col gap-3">
          {d.data.map((p) => (
            <PaymentRow key={p.id} payment={p} locale={locale} />
          ))}
        </div>
      )}
    </QueryStateView>
  );
}

function PayoutsSection({ locale }: { locale: Locale }) {
  const query = useAdminPayouts();
  return (
    <QueryStateView
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      data={query.data}
      onRetry={() => query.refetch()}
      isEmpty={(d) => d.data.length === 0}
      emptyTitle={locale === 'ar' ? 'مفيش تحويلات مستنية' : 'No payouts waiting'}
      emptyMessage={
        locale === 'ar'
          ? 'لما براند يوافق على فيديو، الكريتور هيظهر هنا عشان تحوّله.'
          : 'When a brand approves a video, the creator shows up here to be paid.'
      }
    >
      {(d) => (
        <div className="flex flex-col gap-3">
          {d.data.map((p) => (
            <PayoutRow key={p.id} payout={p} locale={locale} />
          ))}
        </div>
      )}
    </QueryStateView>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { locale, toggleLocale } = useTranslation();
  const { user, isAuthenticated, isLoading, clearAuth } = useAuthStore();
  const [section, setSection] = useState<Section>('payments');

  // The middleware also blocks this route. This check covers a stale session.
  if (isLoading) return null;
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <AppText variant="body" tone="muted">
          {locale === 'ar' ? 'الصفحة دي للأدمن بس.' : 'This page is for admins only.'}
        </AppText>
      </div>
    );
  }

  const lc = locale as Locale;

  return (
    <div className="min-h-screen" dir={lc === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        <PageHeader
          overline="ReelPal · Admin"
          title={lc === 'ar' ? 'لوحة الإدارة' : 'Admin'}
          actions={
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={toggleLocale}>
                {lc === 'ar' ? 'EN' : 'ع'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearAuth();
                  router.replace('/login');
                }}
              >
                {lc === 'ar' ? 'خروج' : 'Sign out'}
              </Button>
            </div>
          }
        />

        <Tabs
          items={[
            { key: 'payments', label: lc === 'ar' ? 'دفعات مستنية' : 'Payments' },
            { key: 'payouts', label: lc === 'ar' ? 'تحويلات للكريتورز' : 'Payouts' },
            { key: 'creators', label: lc === 'ar' ? 'كريتورز جداد' : 'Creators' },
          ]}
          active={section}
          onChange={(key) => setSection(key as Section)}
        />

        {section === 'payments' && <PaymentsSection locale={lc} />}
        {section === 'payouts' && <PayoutsSection locale={lc} />}
        {section === 'creators' && <CreatorsSection locale={lc} />}
      </div>
    </div>
  );
}
