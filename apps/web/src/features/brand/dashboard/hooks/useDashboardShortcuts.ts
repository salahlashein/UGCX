'use client';

import type { useRouter } from 'next/navigation';
import { useKeyboardShortcut } from '../../../../hooks/useKeyboardShortcut';

export function useDashboardShortcuts(
  router: ReturnType<typeof useRouter>,
  can: (action: any) => boolean,
) {
  useKeyboardShortcut('n', (e) => {
    if (can('createBrief')) {
      e.preventDefault();
      router.push('/brand/briefs/new');
    }
  });
  useKeyboardShortcut('p', (e) => {
    e.preventDefault();
    router.push('/brand/proposals');
  });
  useKeyboardShortcut('r', (e) => {
    e.preventDefault();
    router.push('/brand/briefs');
  });
  useKeyboardShortcut('w', (e) => {
    if (can('viewBilling')) {
      e.preventDefault();
      router.push('/brand/billing');
    }
  });
}
