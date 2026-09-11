import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing } from '../../theme/tokens';
import { Icon } from './Icon';
import { AppText } from './Text';
import { Button } from './Button';

interface Props {
  message?: string;
  onRetry?: () => void;
}

/** TASK-P1-020: canvas, not cream — cream stays reserved for neutral/positive (DES-P1-011). No animation. */
export function ErrorState({ message, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Icon name="alert-triangle" size={40} color="danger" />
      <AppText variant="titleSm" color="ink" style={styles.title}>
        {t('common.error.title')}
      </AppText>
      <AppText variant="body" color="body" accessibilityRole="alert" style={styles.message}>
        {message ?? t('common.error.generic')}
      </AppText>
      {onRetry ? (
        <View style={styles.retry}>
          <Button title={t('common.retry')} variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { marginTop: spacing.sm, textAlign: 'center' },
  message: { marginTop: spacing.xxs, textAlign: 'center' },
  retry: { marginTop: spacing.md, minWidth: 160 },
});
