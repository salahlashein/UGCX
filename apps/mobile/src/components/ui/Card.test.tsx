import { cardTextColor, type CardTone } from './Card';

const ALL_TONES: CardTone[] = [
  'canvas',
  'soft',
  'strong',
  'cream',
  'coral',
  'forest',
  'dark',
  'peach',
  'mint',
  'yellow',
  'mustard',
];

const DARK_TEXT_TONES: CardTone[] = ['coral', 'forest', 'dark'];

/** TASK-P1-016: `cardTextColor` across all 11 tones. */
describe('cardTextColor', () => {
  it.each(ALL_TONES)('resolves a text color for tone "%s"', (tone) => {
    const expected = DARK_TEXT_TONES.includes(tone) ? 'onPrimary' : 'ink';
    expect(cardTextColor(tone)).toBe(expected);
  });

  it('returns onPrimary only for coral, forest and dark', () => {
    const onPrimaryTones = ALL_TONES.filter((tone) => cardTextColor(tone) === 'onPrimary');
    expect(onPrimaryTones.sort()).toEqual([...DARK_TEXT_TONES].sort());
  });
});
