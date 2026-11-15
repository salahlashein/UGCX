import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';
import i18n, { applyLayoutDirection, setAppLocale } from './index';

jest.mock('../services/secureStorage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  StorageKeys: { LOCALE: 'ugcx.locale' },
}));

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: {} }, ar: { translation: {} } },
    lng: 'en',
    interpolation: { escapeValue: false },
  });
});

/**
 * TASK-P1-004/REQ-008: the most this environment can verify without a
 * device or simulator is that Arabic drives I18nManager.forceRTL(true)
 * and English drives forceRTL(false) — the actual mirrored-layout
 * rendering itself is the plan's Manual QA checklist item 1, verified on
 * a physical device, not here.
 */
describe('i18n RTL bootstrap', () => {
  it('forces RTL layout direction for Arabic', () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL');
    const allowRTL = jest.spyOn(I18nManager, 'allowRTL');
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });

    applyLayoutDirection('ar');

    expect(allowRTL).toHaveBeenCalledWith(true);
    expect(forceRTL).toHaveBeenCalledWith(true);
  });

  it('forces LTR layout direction for English', () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL');
    const allowRTL = jest.spyOn(I18nManager, 'allowRTL');
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });

    applyLayoutDirection('en');

    expect(allowRTL).toHaveBeenCalledWith(false);
    expect(forceRTL).toHaveBeenCalledWith(false);
  });

  it('is a no-op when the requested direction already matches the current one', () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL');
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    forceRTL.mockClear();

    applyLayoutDirection('en');

    expect(forceRTL).not.toHaveBeenCalled();
  });

  it('setAppLocale reports directionChanged when switching en -> ar', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });

    const result = await setAppLocale('ar');

    expect(result.directionChanged).toBe(true);
  });
});

describe('i18n parity', () => {
  function getLeaves(obj: Record<string, any>, prefix = ''): Record<string, string> {
    const leaves: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(leaves, getLeaves(value, fullPath));
      } else {
        leaves[fullPath] = String(value);
      }
    }
    return leaves;
  }

  const en = require('./en.json');
  const ar = require('./ar.json');
  const enLeaves = getLeaves(en);
  const arLeaves = getLeaves(ar);

  it('ensures key parity between en.json and ar.json in both directions', () => {
    const enMissingInAr: string[] = [];
    for (const key of Object.keys(enLeaves)) {
      if (!(key in arLeaves)) {
        enMissingInAr.push(key);
      }
    }
    const arMissingInEn: string[] = [];
    for (const key of Object.keys(arLeaves)) {
      if (!(key in enLeaves)) {
        arMissingInEn.push(key);
      }
    }
    expect(enMissingInAr).toEqual([]);
    expect(arMissingInEn).toEqual([]);
  });

  it('ensures no value in ar.json equals its en.json counterpart, with allowlist', () => {
    const identicalKeys: string[] = [];
    // Allowlist for proper nouns, acronyms, or codes (e.g. EGP, brand name if identical)
    const allowedIdentical = new Set([
      'common.appName',
      'brand.billing.currency',
    ]);

    for (const [key, enVal] of Object.entries(enLeaves)) {
      if (allowedIdentical.has(key)) continue;
      const arVal = arLeaves[key];
      if (arVal === enVal && typeof enVal === 'string' && enVal.trim() !== '') {
        identicalKeys.push(key);
      }
    }
    expect(identicalKeys).toEqual([]);
  });

  it('ensures every NotificationEvent value has a copy key for at least one role', () => {
    const events: string[] = [
      'brief_published',
      'proposal_received',
      'proposal_shortlisted',
      'proposal_declined',
      'escrow_funded',
      'shipment_confirmed',
      'shipment_received',
      'deliverable_submitted',
      'revision_requested',
      'escrow_released',
      'message_received',
      'payout_sent',
    ];

    for (const ev of events) {
      const brandKey = `notif.brand.${ev}`;
      const creatorKey = `notif.creator.${ev}`;
      const hasBrand = brandKey in enLeaves;
      const hasCreator = creatorKey in enLeaves;
      expect(hasBrand || hasCreator).toBe(true);
    }
  });

  it('ensures every chat.system event has an en.json and ar.json key', () => {
    const systemKeys = [
      'chat.system.escrow_funded_brand',
      'chat.system.escrow_funded_creator',
      'chat.system.shipment_confirmed',
      'chat.system.shipment_received',
      'chat.system.deliverable_submitted_brand',
      'chat.system.deliverable_submitted_creator',
      'chat.system.revision_requested_brand',
      'chat.system.revision_requested_creator',
      'chat.system.escrow_released_brand',
      'chat.system.escrow_released_creator',
    ];

    for (const key of systemKeys) {
      expect(key in enLeaves).toBe(true);
      expect(key in arLeaves).toBe(true);
    }
  });
});

