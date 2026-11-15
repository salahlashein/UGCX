import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { AppText } from './ui/Text';
import { Button } from './ui/Button';
import { spacing } from '../theme/tokens';

interface Props {
  checkoutUrl: string;
  onRedirectDetected?: () => void;
}

const REDIRECT_URL = 'ugcx://payment-complete';
const isWeb = Platform.OS === 'web';

/**
 * TASK-P2-13: Reusable Paymob checkout component extracted from AcceptProposalScreen.
 * Handles in-app WebView on native with deep-link redirect detection,
 * and a new-tab fallback on web.
 */
export function PaymobCheckout({ checkoutUrl, onRedirectDetected }: Props) {
  const { t } = useTranslation();

  const handleNavigationChange = (navState: WebViewNavigation) => {
    if (navState.url.startsWith(REDIRECT_URL)) {
      onRedirectDetected?.();
    }
  };

  if (isWeb) {
    return (
      <View style={styles.center}>
        <AppText variant="body" color="body" style={styles.textCenter}>
          {t('brand.acceptProposal.openPaymentHint')}
        </AppText>
        <Button
          title={t('brand.acceptProposal.openPayment')}
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
            }
            onRedirectDetected?.();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: checkoutUrl }}
        onShouldStartLoadWithRequest={(request) => {
          if (request.url.startsWith(REDIRECT_URL)) {
            onRedirectDetected?.();
            return false;
          }
          return true;
        }}
        onNavigationStateChange={handleNavigationChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  textCenter: { textAlign: 'center' },
});

