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
