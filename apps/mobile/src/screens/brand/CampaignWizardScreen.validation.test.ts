import { campaignWizardSchema, numericString } from './CampaignWizardScreen';

const validValues = {
  productId: 'product-1',
  niche: 'beauty_personal_care',
  language: 'en',
  videoType: 'unboxing',
  durationSeconds: '30',
  scriptMode: 'brand',
  script: 'Say hello',
  talkingPoints: 'point one',
  doNotSay: 'competitor names',
  needsShipping: true,
  slots: '2',
};

/**
 * TASK-P1-015: this mirrors the API's missingPublishFields validation
 * (REQ-004) so the wizard can show inline errors before the publish call,
 * per TASK-P1-006's directory spec.
 */
describe('CampaignWizardScreen validation', () => {
  it('accepts a fully filled-in form', () => {
    const result = campaignWizardSchema.safeParse(validValues);
    expect(result.success).toBe(true);
  });

  it('rejects a missing niche, mirroring the API required-before-publish field', () => {
    const rest: Partial<typeof validValues> = { ...validValues };
    delete rest.niche;
    const result = campaignWizardSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects a missing productId', () => {
    const result = campaignWizardSchema.safeParse({ ...validValues, productId: '' });
    expect(result.success).toBe(false);
  });

  describe('numericString', () => {
    const durationSchema = numericString(5, 600);

    it('accepts a value inside the bounds', () => {
      expect(durationSchema.safeParse('30').success).toBe(true);
    });

    it('rejects a value below the minimum', () => {
      expect(durationSchema.safeParse('1').success).toBe(false);
    });

    it('rejects a value above the maximum', () => {
      expect(durationSchema.safeParse('1000').success).toBe(false);
    });

    it('rejects a non-numeric value', () => {
      expect(durationSchema.safeParse('not-a-number').success).toBe(false);
    });
  });
});
