import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FOUNDING_BRAND_LOGOS,
  PLATFORM_FEE_PERCENT,
  landingCopy,
} from '../components/landing/content';

/** Returns the shape of a value: object keys and array lengths, not the text. */
function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shapeOf);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, shapeOf(v)]),
    );
  }
  return typeof value;
}

function leafStrings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => leafStrings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      leafStrings(v, path ? `${path}.${k}` : k),
    );
  }
  return [];
}

describe('landing page content', () => {
  it('English and Arabic have the same keys and the same list lengths', () => {
    assert.deepEqual(shapeOf(landingCopy.ar), shapeOf(landingCopy.en));
  });

  it('no text is empty in either language', () => {
    for (const locale of ['en', 'ar'] as const) {
      const empty = leafStrings(landingCopy[locale])
        .filter(([path, text]) => text.trim() === '' && path !== 'compare.columns[0]')
        .map(([path]) => path);
      assert.deepEqual(empty, [], `${locale} has empty text at ${empty.join(', ')}`);
    }
  });

  it('Arabic text is translated, not copied from English', () => {
    const en = new Map(leafStrings(landingCopy.en));
    const allowedSame = new Set(['compare.columns[0]', 'compare.columns[3]', 'footer.rights']);
    const copied = leafStrings(landingCopy.ar)
      .filter(([path, text]) => en.get(path) === text && !allowedSame.has(path))
      .filter(([path]) => !path.startsWith('proof.facts') || path.endsWith('.label'))
      .filter(([path]) => !/amount$|availableValue$|^creators\.rows\[\d\]\.dir$/.test(path))
      .map(([path]) => path);
    assert.deepEqual(copied, []);
  });

  it('shows no brand logos until a brand agrees in writing', () => {
    assert.equal(FOUNDING_BRAND_LOGOS.length, 0);
  });

  it('shows the same fee as the API default PLATFORM_FEE_RATE of 0.10', () => {
    assert.equal(PLATFORM_FEE_PERCENT, 10);
  });

  it('the creator example statement adds up: 1,500 + 900 - 2,000 = 400', () => {
    // Every amount has two decimals, so removing "," and "." gives integer cents.
    const cents = landingCopy.en.creators.rows.map((r) => Number(r.amount.replace(/[,.]/g, '')));
    assert.equal(
      cents.reduce((a, b) => a + b, 0),
      40000,
    );
    assert.equal(landingCopy.en.creators.availableValue, 'EGP 400.00');
  });
});
