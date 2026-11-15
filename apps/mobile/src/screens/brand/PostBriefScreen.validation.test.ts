import {
  BRIEF_STEP_FIELDS,
  BRIEF_STEPS,
  postBriefSchema,
  transformBriefPayload,
} from './PostBriefScreen';

describe('PostBriefScreen steps', () => {
  it('checks every form field on exactly one step before the review', () => {
    const stepped = BRIEF_STEPS.flatMap((step) => BRIEF_STEP_FIELDS[step]).sort();
    const schemaFields = Object.keys(postBriefSchema.shape).sort();
    expect(stepped).toEqual(schemaFields);
    expect(BRIEF_STEP_FIELDS.review).toEqual([]);
  });
});

const validValues = {
  title: 'Skincare Routine Video',
  videoType: 'unboxing' as const,
  durationSeconds: '30',
  language: 'ar' as const,
  budgetMin: '500',
  budgetMax: '1500',
  needsShipping: true,
};

describe('PostBriefScreen validation', () => {
  it('fails when a title has only two characters', () => {
    const result = postBriefSchema.safeParse({
      ...validValues,
      title: 'Ab',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
    }
  });

  it('fails when budgetMax is below budgetMin and names budgetMax', () => {
    const result = postBriefSchema.safeParse({
      ...validValues,
      budgetMin: '2000',
      budgetMax: '1000',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('budgetMax'));
      expect(issue).toBeDefined();
      expect(issue?.message).toBe('brand.brief.errors.budgetMax');
    }
  });

  it('fails when duration is 4 and passes when duration is 5', () => {
    const failResult = postBriefSchema.safeParse({
      ...validValues,
      durationSeconds: '4',
    });
    expect(failResult.success).toBe(false);

    const passResult = postBriefSchema.safeParse({
      ...validValues,
      durationSeconds: '5',
    });
    expect(passResult.success).toBe(true);
  });

  it('defaults the niche to beauty and sends the niche the brand picks', () => {
    expect(transformBriefPayload(postBriefSchema.parse(validValues)).niche).toBe(
      'beauty_personal_care',
    );
    const picked = postBriefSchema.parse({ ...validValues, niche: 'fashion' });
    expect(transformBriefPayload(picked).niche).toBe('fashion');
  });

  it('rejects a niche that is not in the list', () => {
    expect(postBriefSchema.safeParse({ ...validValues, niche: 'cars' }).success).toBe(false);
  });

  it('produces budgetMin and budgetMax as two decimal strings from a valid payload', () => {
    const parsed = postBriefSchema.parse(validValues);
    const transformed = transformBriefPayload(parsed);

    expect(transformed.budgetMin).toBe('500.00');
    expect(transformed.budgetMax).toBe('1500.00');
    expect(typeof transformed.budgetMin).toBe('string');
    expect(typeof transformed.budgetMax).toBe('string');
  });
});
