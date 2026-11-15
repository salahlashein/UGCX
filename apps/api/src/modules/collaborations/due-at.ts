/**
 * Pure helper for computing collaboration due dates (TASK-W4-02 / DEC-W402).
 *
 * 1. Start = receivedAt when campaign.needsShipping is true, else createdAt of collaboration.
 * 2. dueAt = start + proposal.deliveryDays days, or null when start is unknown.
 */
export function computeDueAt(
  collaboration: { receivedAt?: Date | string | null; createdAt?: Date | string | null },
  campaign?: { needsShipping?: boolean | null } | null,
  proposal?: { deliveryDays?: number | null } | null,
): string | null {
  if (!proposal || typeof proposal.deliveryDays !== 'number') {
    return null;
  }

  const needsShipping = campaign?.needsShipping ?? false;
  const startRaw = needsShipping ? collaboration.receivedAt : collaboration.createdAt;

  if (!startRaw) {
    return null;
  }

  const startDate = new Date(startRaw);
  if (isNaN(startDate.getTime())) {
    return null;
  }

  const dueMs = startDate.getTime() + proposal.deliveryDays * 24 * 60 * 60 * 1000;
  return new Date(dueMs).toISOString();
}
