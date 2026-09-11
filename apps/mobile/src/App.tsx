import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from './i18n';
import { queryClient } from './services/queryClient';
import { RootNavigator } from './navigation/RootNavigator';
import { LoadingState } from './components/ui/LoadingState';
import { usePushRegistration } from './hooks/usePushRegistration';
import { useAppFonts } from './theme/fonts';

// TASK-P1-013: foreground notifications still show a banner (EDGE-P1-003
// otherwise leaves the user unaware anything happened).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function PushRegistration() {
  usePushRegistration();
  return null;
}

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const { loaded: fontsLoaded } = useAppFonts();

  useEffect(() => {
    initI18n().finally(() => setI18nReady(true));
  }, []);

  // EDGE-P1-001: LoadingState must not depend on AppText, since it renders
  // before fonts resolve.
  if (!i18nReady || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <LoadingState />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <PushRegistration />
              <RootNavigator />
              <StatusBar style="dark" />
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
