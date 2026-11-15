'use client';

import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if target is an editable input or textarea unless it has a modifier
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (isInput && !e.metaKey && !e.ctrlKey) {
        return;
      }

      if (e.key.toLowerCase() === key.toLowerCase()) {
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, handler, enabled]);
}
