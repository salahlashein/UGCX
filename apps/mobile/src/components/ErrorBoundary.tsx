import { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import i18n from '../i18n';
import { logger } from '../services/logger';
import { spacing } from '../theme/tokens';
import { Screen } from './ui/Screen';
import { AppText } from './ui/Text';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * React only exposes error-boundary behavior (getDerivedStateFromError /
 * componentDidCatch) through class components — there is no hook
 * equivalent, so this is the one intentional exception to "functional
 * components with hooks only" (Code Guidelines). One boundary wraps each
 * tab navigator so one screen's crash does not blank the whole app
 * (RISK-003-adjacent robustness).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    logger.error('Unhandled error in a tab navigator', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Screen>
          <View style={styles.container}>
            <AppText variant="body" color="danger" style={styles.text}>
              {i18n.t('common.error.generic')}
            </AppText>
            <Button
              title={i18n.t('common.retry')}
              onPress={() => this.setState({ hasError: false })}
            />
          </View>
        </Screen>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { marginBottom: spacing.md, textAlign: 'center' },
});
