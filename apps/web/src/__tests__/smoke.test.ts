import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { colors, radius, spacing } from '../theme/tokens';
import { typography } from '../theme/typography';
import { formatAmount, formatMoney, getInitials } from '../utils/format';
import { decodeJwtPayload } from '../store/authStore';
import { FEATURE_FLAGS } from '../config/features';

describe('ReelPal Web Soft Launch Smoke Suite', () => {
  it('enforces the palette tokens (direction A) and font weights 400/500 only', () => {
    assert.equal(colors.canvas, '#f7f6f2');
    assert.equal(colors.primary, '#2f5d46');
    assert.equal(colors.surface, '#ffffff');
    assert.equal(colors.surfaceDark, '#17241c');
    assert.equal(colors.dashLine, '#cfcbc0');
    assert.equal(radius.xl, 18);
    assert.equal(radius.card, 14);
    assert.equal(radius.hero, 16);
    assert.equal(spacing.md, 16);

    for (const [role, spec] of Object.entries(typography)) {
      assert.ok(
        spec.weight === 400 || spec.weight === 500,
        `Typography role ${role} must use weight 400 or 500`,
      );
    }
  });

  it('formats EGP currency and initials deterministically without float drift', () => {
    assert.equal(formatAmount('3500.00'), '3,500.00');
    assert.equal(formatAmount(12500), '12,500.00');
    assert.equal(formatMoney('2400', 'EGP'), 'EGP 2,400.00');
    assert.equal(getInitials('Glow Lab'), 'GL');
    assert.equal(getInitials('Nour'), 'NO');
  });

  it('decodes JWT payload sub and role cleanly', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'u-123', role: 'brand' })).toString(
      'base64url',
    );
    const token = `header.${payload}.sig`;
    const decoded = decodeJwtPayload(token);
    assert.equal(decoded.sub, 'u-123');
    assert.equal(decoded.role, 'brand');
  });

  it('keeps high-risk deferred features gated off in DEFAULT_FEATURE_FLAGS', () => {
    assert.equal(FEATURE_FLAGS.productCatalog, false);
    assert.equal(FEATURE_FLAGS.campaignWizardMultiStep, false);
    assert.equal(FEATURE_FLAGS.brandTeamManagement, false);
    assert.equal(FEATURE_FLAGS.automatedPayouts, false);
  });
});
