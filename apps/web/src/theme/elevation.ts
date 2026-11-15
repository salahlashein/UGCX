/**
 * TASK-W1-003: Web shadow elevation tokens matching DESIGN.md.
 */

export const elevation = {
  none: 'none',
  card: '0 1px 3px rgba(23, 36, 28, 0.06)',
  raised: '0 2px 8px rgba(23, 36, 28, 0.06)',
  soft: '0 6px 18px rgba(23, 36, 28, 0.07)',
} as const;

export type ElevationRole = keyof typeof elevation;
