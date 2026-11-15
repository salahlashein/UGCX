export type StatusTone = 'ok' | 'pend' | 'info' | 'bad' | 'neu';

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  // ok: green
  live: 'ok',
  open: 'ok',
  approved: 'ok',
  accepted: 'ok',
  funded: 'ok',
  paid: 'ok',
  verified: 'ok',
  cleared: 'ok',
  completed: 'ok',

  // pend: amber / orange
  submitted: 'pend',
  delivered: 'pend',
  shortlisted: 'pend',
  shipped: 'pend',
  applied: 'pend',
  pending: 'pend',
  paused: 'pend',

  // info: blue
  in_progress: 'info',
  in_production: 'info',
  released: 'info',

  // bad: red / coral
  declined: 'bad',
  cancelled: 'bad',
  payment_failed: 'bad',
  rejected: 'bad',
  revision_requested: 'bad',

  // neu: gray / muted
  draft: 'neu',
};

/**
 * Maps a domain status value to one standard badge tone (REQ-W105).
 * The lookup is case-insensitive. Unknown statuses fall back to 'neu'.
 */
export function statusTone(_domain?: string, value?: string | null): StatusTone {
  if (!value) return 'neu';
  const normalized = value.trim().toLowerCase();
  return STATUS_TONE_MAP[normalized] ?? 'neu';
}
