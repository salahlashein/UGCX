import { I18nManager, Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors } from '../../theme/tokens';
import { typography, type TypographyRole } from '../../theme/typography';
import { fontFamilyFor, LINE_HEIGHT_MULTIPLIER_AR } from '../../theme/fonts';
import i18n from '../../i18n';

type ColorRole = keyof typeof colors;

interface Props extends TextProps {
  variant?: TypographyRole;
  color?: ColorRole;
}

/**
 * TASK-P1-009: the app's only text primitive (DES-P1-004). Resolves
 * `fontFamily` at render time, not from a token baked in at module import,
 * because StyleSheet.create runs before initI18n() resolves the locale.
 * Never sets `textAlign` (R2): React Native's unset default already
 * follows reading direction.
 */
export function AppText({ variant = 'body', color = 'body', style, ...props }: Props) {
  const isArabic = i18n.language === 'ar' || I18nManager.isRTL;
  const role = typography[variant];
  const family = fontFamilyFor(role.weight, isArabic);
  const lineHeight = Math.round(role.lineHeight * (isArabic ? LINE_HEIGHT_MULTIPLIER_AR : 1));

  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      style={[
        {
          fontFamily: family,
          fontWeight: String(role.weight) as TextStyle['fontWeight'],
          fontSize: role.fontSize,
          lineHeight,
          letterSpacing: isArabic ? 0 : role.letterSpacing,
          color: colors[color],
          writingDirection: isArabic ? 'rtl' : 'ltr',
        },
        style,
      ]}
      {...props}
    />
  );
}

// Exported as `Text` too so a screen's import line is the only diff needed
// when Wave 1 swaps `import { Text } from 'react-native'` for this module.
export { AppText as Text };
