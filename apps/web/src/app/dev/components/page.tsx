'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import {
  AppText,
  Card,
  PressableCard,
  SignatureCard,
  Button,
  TextInput,
  FilterChip,
  StatusBadge,
  Tag,
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  ModalSheet,
  DataTable,
  LedgerTable,
  ListRow,
  KpiCells,
  Equation,
  Meter,
  MiniBar,
  KeyValueList,
  GroupHeader,
  AvatarStack,
  DueChip,
  Kbd,
  BarChart,
  Pipeline,
  HStepper,
  VerticalTimeline,
  SplitPane,
  Receipt,
  Tabs,
  SegmentedControl,
  RadioCard,
  Toggle,
  Checklist,
  RangeSlider,
  OtpInput,
  Dropzone,
  VideoPlayer,
} from '../../../components/ui';
import { colors, radius, spacing } from '../../../theme/tokens';
import { useTranslation } from '../../../i18n';

export default function ComponentGalleryPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { locale, toggleLocale } = useTranslation();

  // Interactive component states
  const [modalOpen, setModalOpen] = useState(false);
  const [textVal, setTextVal] = useState('2400.00');
  const [chipSelected, setChipSelected] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [segmentVal, setSegmentVal] = useState('monthly');
  const [radioSelected, setRadioSelected] = useState('card');
  const [toggleVal, setToggleVal] = useState(true);
  const [rangeLow, setRangeLow] = useState(1500);
  const [rangeHigh, setRangeHigh] = useState(4500);
  const [otpVal, setOtpVal] = useState('1234');
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>('item-1');
  const [checklistItems, setChecklistItems] = useState([
    { id: '1', label: 'Hook captured viewer in first 3 seconds', state: 'met' as const },
    { id: '2', label: 'Clear call to action before video ends', state: 'missing' as const },
    { id: '3', label: 'Spoke in requested Arabic dialect', state: 'unchecked' as const },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklistItems((items) =>
      items.map((i) =>
        i.id === id
          ? {
              ...i,
              state: i.state === 'met' ? 'missing' : i.state === 'missing' ? 'unchecked' : 'met',
            }
          : i,
      ),
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ backgroundColor: colors.canvas }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/10">
          <div className="flex flex-col">
            <AppText variant="displayMd" color="ink">
              Ledger Mono Design System
            </AppText>
            <span
              className="mono-caps"
              data-mono-caps="true"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: colors.muted,
              }}
            >
              Component Gallery · Phase W1 Visual Parity Check
            </span>
          </div>

          <button
            type="button"
            onClick={toggleLocale}
            className="px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.hairline}`,
            }}
          >
            <Icon name="globe" size={16} color="primary" />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 500,
                color: colors.primary,
              }}
            >
              {locale === 'en' ? 'Switch to Arabic (RTL)' : 'Switch to English (LTR)'}
            </span>
          </button>
        </div>

        {/* 1. Primitives: Cards, Hero Cards, Badges, Buttons */}
        <section className="flex flex-col gap-4">
          <GroupHeader label="1. Primitives & Surfaces" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card header={<AppText variant="label">Standard Card (Radius 14)</AppText>}>
              <AppText variant="body" color="body">
                Cards feature hairline border, 14px border radius, and elevation.card shadow.
              </AppText>
            </Card>

            <SignatureCard variant="hero">
              <div className="flex flex-col gap-2">
                <span
                  className="mono-caps text-emerald-400"
                  data-mono-caps="true"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                >
                  HERO GRID PAPER (RADIUS 16)
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '28px',
                    fontWeight: 500,
                  }}
                >
                  EGP 124,500.00
                </span>
                <div className="flex gap-2 mt-2">
                  <Button variant="mint" size="sm" title="Action Pill" />
                  <Tag>Dashed Tag</Tag>
                </div>
              </div>
            </SignatureCard>
          </div>

          {/* Badges & Tags */}
          <div className="flex items-center flex-wrap gap-2 p-4 bg-white rounded-xl border border-dashed border-[#b9c4bc]">
            <StatusBadge status="live" label="LIVE" />
            <StatusBadge status="submitted" label="SUBMITTED" />
            <StatusBadge status="in_progress" label="IN PRODUCTION" />
            <StatusBadge status="declined" label="DECLINED" />
            <StatusBadge status="draft" label="DRAFT" />
            <Tag>Custom Tag</Tag>
            <DueChip dueAt={new Date(Date.now() + 24 * 3600 * 1000)} />
            <Kbd>⌘K</Kbd>
          </div>

          {/* Buttons */}
          <div className="flex items-center flex-wrap gap-3 p-4 bg-white rounded-xl border border-dashed border-[#b9c4bc]">
            <Button variant="primary" title="Primary Button" count={12} />
            <Button variant="secondary" title="Secondary" />
            <Button variant="ghost" title="Ghost" icon="arrow-right" />
            <Button variant="danger" title="Danger" />
            <Button variant="danger-outline" title="Danger Outline" />
            <Button variant="mint" title="Mint" />
            <FilterChip
              label="Active Filter"
              selected={chipSelected}
              count={5}
              onClick={() => setChipSelected(!chipSelected)}
            />
          </div>
        </section>

        {/* 2. Data & Metric Components */}
        <section className="flex flex-col gap-4">
          <GroupHeader label="2. Data, Ledger & Math" />

          <KpiCells
            items={[
              { label: 'ESCROW BALANCE', value: 'EGP 32,500.00', tone: 'primary' },
              { label: 'OPEN BRIEFS', value: '4', hint: '2 closing soon' },
              { label: 'APPLICANTS', value: '18', hint: '6 awaiting review' },
              { label: 'DELIVERED', value: '12', tone: 'ink' },
            ]}
          />

          <Equation
            parts={[
              { label: 'Funded', valueCents: 500000 },
              { op: '-' },
              { label: 'Allocated', valueCents: 220000 },
              { op: '=' },
              { label: 'Available', valueCents: 280000, tone: 'primary' },
            ]}
          />

          <div className="flex flex-col gap-1.5 p-4 bg-white rounded-xl border border-dashed border-[#b9c4bc]">
            <AppText variant="caption" color="muted">
              MULTI-SEGMENT ESCROW METER
            </AppText>
            <Meter
              total={1000000}
              segments={[
                { cents: 500000, tone: 'ok', label: 'Funded' },
                { cents: 300000, tone: 'pend', label: 'Allocated' },
                { cents: 200000, tone: 'info', label: 'Released' },
              ]}
              height={10}
            />
          </div>

          {/* Ledger Table */}
          <Card
            bleed
            header={
              <div className="p-3">
                <AppText variant="label">Transactions Ledger</AppText>
              </div>
            }
          >
            <LedgerTable
              rows={[
                {
                  id: 'tx-1',
                  date: 'Oct 30, 2026',
                  title: 'Escrow Deposit · Card',
                  ref: 'BR-9F3C2A',
                  status: 'funded',
                  amountCents: 320000,
                  direction: 'in',
                  balanceCents: 320000,
                },
                {
                  id: 'tx-2',
                  date: 'Oct 29, 2026',
                  title: 'Creator Payout · InstaPay',
                  subtitle: 'Glow Lab Serum Campaign',
                  ref: 'CP-4A2D1B',
                  status: 'paid',
                  amountCents: 150000,
                  direction: 'out',
                  balanceCents: 170000,
                },
              ]}
            />
          </Card>
        </section>

        {/* 3. Layout, Timelines & Charts */}
        <section className="flex flex-col gap-4">
          <GroupHeader label="3. Charts, Pipelines & Timelines" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card header={<AppText variant="label">Spending Chart</AppText>}>
              <BarChart
                data={[
                  { label: 'Jun', valueCents: 420000 },
                  { label: 'Jul', valueCents: 680000 },
                  { label: 'Aug', valueCents: 510000 },
                  { label: 'Sep', valueCents: 940000 },
                  { label: 'Oct', valueCents: 1250000 },
                ]}
                max={1500000}
              />
            </Card>

            <Receipt
              header="Escrow Funding Receipt"
              lines={[
                ['Campaign', 'Summer Skincare Campaign'],
                ['Budget', 'EGP 3,200.00'],
                ['Platform Fee (10%)', 'EGP 320.00'],
              ]}
              total="EGP 3,520.00"
              footer="Receipt ref: RCT-772910 · Held in secure custody"
            />
          </div>

          <Card header={<AppText variant="label">Workflow Pipeline</AppText>}>
            <Pipeline
              stages={[
                { key: 'applied', label: 'Applied', count: 12 },
                { key: 'shortlisted', label: 'Shortlisted', count: 4 },
                { key: 'accepted', label: 'In Production', count: 2 },
                { key: 'approved', label: 'Completed', count: 8 },
              ]}
            />
          </Card>

          <Card header={<AppText variant="label">Horizontal Stepper</AppText>}>
            <HStepper
              steps={[
                { label: 'Brief Created', date: 'Oct 20', state: 'done' },
                { label: 'Escrow Funded', date: 'Oct 22', state: 'done' },
                { label: 'Shipment Sent', date: 'Oct 25', state: 'current' },
                { label: 'Video Review', state: 'todo' },
                { label: 'Payout', state: 'todo' },
              ]}
            />
          </Card>

          <Card header={<AppText variant="label">Vertical Timeline</AppText>}>
            <VerticalTimeline
              steps={[
                {
                  icon: 'check',
                  title: 'Deliverable Version 2 Uploaded',
                  detail: 'Creator uploaded revised 30s cut with requested captions.',
                  date: 'Yesterday at 4:15 PM',
                  state: 'done',
                },
                {
                  icon: 'clock',
                  title: 'Brand Review in Progress',
                  detail: 'Review deadline in 24 hours.',
                  date: 'Today',
                  state: 'current',
                  action: <Button variant="primary" size="sm" title="Approve Video" />,
                },
              ]}
            />
          </Card>
        </section>

        {/* 4. Inputs & Interactive Controls */}
        <section className="flex flex-col gap-4">
          <GroupHeader label="4. Form Inputs & Interactive Controls" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="flex flex-col gap-4">
              <AppText variant="label">Segmented Control</AppText>
              <SegmentedControl
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'monthly', label: 'Monthly', count: 3 },
                  { value: 'yearly', label: 'Yearly' },
                ]}
                value={segmentVal}
                onChange={setSegmentVal}
              />

              <AppText variant="label" className="mt-2">
                Radio Cards
              </AppText>
              <div className="flex flex-col gap-2">
                <RadioCard
                  title="Credit / Debit Card"
                  description="Instant escrow funding via Paymob gateway"
                  icon="credit-card"
                  selected={radioSelected === 'card'}
                  onSelect={() => setRadioSelected('card')}
                />
                <RadioCard
                  title="InstaPay Direct"
                  description="Manual transfer verified within 2 hours"
                  icon="bank"
                  selected={radioSelected === 'instapay'}
                  onSelect={() => setRadioSelected('instapay')}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <AppText variant="label">Toggle Switch</AppText>
                <Toggle
                  checked={toggleVal}
                  onChange={setToggleVal}
                  label={toggleVal ? 'Notifications Active' : 'Muted'}
                />
              </div>
            </Card>

            <Card className="flex flex-col gap-4">
              <AppText variant="label">Range Slider (Budget Min/Max)</AppText>
              <RangeSlider
                min={500}
                max={10000}
                step={250}
                valueLow={rangeLow}
                valueHigh={rangeHigh}
                onChange={(l, h) => {
                  setRangeLow(l);
                  setRangeHigh(h);
                }}
              />

              <AppText variant="label" className="mt-2">
                6-Digit OTP Box (LTR enforced)
              </AppText>
              <OtpInput value={otpVal} onChange={setOtpVal} length={6} />

              <AppText variant="label" className="mt-2">
                Checklist Component
              </AppText>
              <Checklist items={checklistItems} onToggle={toggleChecklistItem} />
            </Card>
          </div>

          {/* Dropzone & Video Player */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card header={<AppText variant="label">Deliverable Upload Dropzone</AppText>}>
              <Dropzone onFile={(f) => alert(`Selected: ${f.name}`)} />
            </Card>

            <Card header={<AppText variant="label">Video Player with Versions</AppText>}>
              <VideoPlayer
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                versions={[
                  { id: 'v1', label: 'V1 Initial', src: '#' },
                  { id: 'v2', label: 'V2 Final Cut', src: '#' },
                ]}
                activeVersion="v2"
                expiresInSeconds={3540}
              />
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
