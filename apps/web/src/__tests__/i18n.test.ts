import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';
import { interpolate, resolveDotPath } from '../i18n';

function extractLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...extractLeafKeys(value as Record<string, unknown>, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

describe('i18n Localization Parity & Utilities Suite', () => {
  it('asserts 100% leaf key parity between en.json and ar.json with 0 missing keys', () => {
    const enKeys = new Set(extractLeafKeys(en as Record<string, unknown>));
    const arKeys = new Set(extractLeafKeys(ar as Record<string, unknown>));

    const missingInAr = [...enKeys].filter((key) => !arKeys.has(key));
    const missingInEn = [...arKeys].filter((key) => !enKeys.has(key));

    assert.equal(missingInAr.length, 0, `Missing in ar.json: ${missingInAr.join(', ')}`);
    assert.equal(missingInEn.length, 0, `Missing in en.json: ${missingInEn.join(', ')}`);
    assert.equal(enKeys.size, arKeys.size, 'Total leaf key count must be identical');
    assert.ok(enKeys.size > 0, 'Translation dictionary must contain keys');
  });

  it('interpolates template parameters accurately', () => {
    const singleParam = interpolate('Hello {{name}}', { name: 'Antigravity' });
    assert.equal(singleParam, 'Hello Antigravity');

    const multiParam = interpolate('Code: {{code}}, Status: {{status}}', {
      code: 101,
      status: 'active',
    });
    assert.equal(multiParam, 'Code: 101, Status: active');

    const withoutParams = interpolate('Hello world');
    assert.equal(withoutParams, 'Hello world');

    const missingParam = interpolate('User: {{user}}, Role: {{role}}', { user: 'Admin' });
    assert.equal(missingParam, 'User: Admin, Role: ');
  });

  it('validates common dictionary entries in en and ar', () => {
    assert.equal(en.common.appName, 'ReelPal');
    assert.equal(ar.common.appName, 'ريل بال');
    assert.equal(typeof en.common.loading, 'string');
    assert.equal(typeof ar.common.loading, 'string');
  });

  it('resolves dot paths and falls back to English when undefined in Arabic', () => {
    const enVal = resolveDotPath(en as Record<string, unknown>, 'common.appName');
    assert.equal(enVal, 'ReelPal');

    const arVal = resolveDotPath(ar as Record<string, unknown>, 'common.appName');
    assert.equal(arVal, 'ريل بال');

    // Simulate missing key in Arabic dictionary
    const mockAr: Record<string, unknown> = {};
    const mockEn: Record<string, unknown> = {
      feature: {
        newKey: 'New Feature English',
      },
    };

    const resolved =
      resolveDotPath(mockAr, 'feature.newKey') ??
      resolveDotPath(mockEn, 'feature.newKey') ??
      'fallback';
    assert.equal(resolved, 'New Feature English');
  });
});
