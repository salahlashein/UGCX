import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import { useAcceptProposal, useCollaboration } from '../../hooks/api/useCollaborations';
import { parseApiError } from '../../services/apiError';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandCampaignsStackParamList, 'AcceptProposal'>;

const REDIRECT_URL = 'ugcx://payment-complete';
const POLL_TIMEOUT_MS = 60_000;
// react-native-webview has no web implementation at all (it renders
// "does not support this platform" there). On web there is also no way to
// read a cross-origin iframe's navigation, so the deep-link redirect this
// screen watches for on native cannot be observed on web either. Payment
// truth always comes from the collaboration status poll below, never from
// the redirect itself, so on web this just opens the checkout in a new tab
// and starts that same poll immediately instead of waiting for a redirect
// it cannot see.
const isWeb = Platform.OS === 'web';

/**
 * TASK-P1-007/DES-P1-003: Paymob checkout in an in-app WebView, REQ-005's
 * poll-and-60s-timeout, EDGE-P1-002.
 */
export function AcceptProposalScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const acceptProposal = useAcceptProposal();
  const [collaborationId, setCollaborationId] = useState<string | undefined>();
  const [polling, setPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    acceptProposal.mutate(route.params.proposalId, {
      onSuccess: (data) => setCollaborationId(data.collaborationId),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collaborationQuery = useCollaboration(collaborationId, { poll: polling });
  const status = collaborationQuery.data?.status;

  useEffect(() => {
    if (polling && status && status !== 'pending_payment') {
      setPolling(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [polling, status]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startPolling = () => {
    setPolling(true);
    timeoutRef.current = setTimeout(() => {
      setPolling(false);
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);
  };

  const handleNavigationChange = (navState: WebViewNavigation) => {
    if (navState.url.startsWith(REDIRECT_URL) && !polling && status === 'pending_payment') {
      startPolling();
    }
  };

  // The mutation is fired from an effect, which runs after the first paint,
  // so the first render lands here in 'idle' state with no data yet. Treat
  // idle the same as pending rather than falling through to the WebView
  // below with an unresolved checkoutUrl.
  if (acceptProposal.isIdle || acceptProposal.isPending) {
    return <LoadingState />;
  }

  if (acceptProposal.isError) {
    return <ErrorState message={parseApiError(acceptProposal.error).message} />;
  }

  // H1: only 'funded' means escrow actually holds the money. Every other
  // status the poll can land on (payment_failed, cancelled) must not show
  // the success state.
  if (status === 'funded') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.funded}>{t('brand.acceptProposal.funded')}</Text>
        <Button
          title={t('common.done')}
          onPress={() =>
            navigation.replace('CollaborationDetail', { collaborationId: collaborationId! })
          }
        />
      </SafeAreaView>
    );
  }

  if (status && status !== 'pending_payment') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.timeout}>{t('brand.acceptProposal.failed')}</Text>
        <Button title={t('common.back')} variant="secondary" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  if (timedOut) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.timeout}>{t('brand.acceptProposal.timeout')}</Text>
        <Button title={t('common.back')} variant="secondary" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  if (polling) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.waiting}>{t('brand.acceptProposal.waiting')}</Text>
      </SafeAreaView>
    );
  }

  if (!acceptProposal.data) {
    return <LoadingState />;
  }

  const checkoutUrl = acceptProposal.data.checkoutUrl;

  if (isWeb) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.waiting}>{t('brand.acceptProposal.openPaymentHint')}</Text>
        <Button
          title={t('brand.acceptProposal.openPayment')}
          onPress={() => {
            window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
            startPolling();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: checkoutUrl }}
        onShouldStartLoadWithRequest={(request) => {
          if (request.url.startsWith(REDIRECT_URL)) {
            startPolling();
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
  waiting: { ...typography.body, color: colors.body },
  timeout: { ...typography.body, color: colors.body, textAlign: 'center' },
  funded: { ...typography.title, color: colors.success },
});
