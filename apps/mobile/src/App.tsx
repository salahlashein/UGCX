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

import { Alert, Platform } from 'react-native';
import { OfflineBanner } from './components/OfflineBanner';

if (Platform.OS === 'web') {
  Alert.alert = (title: string, message?: string, buttons?: Array<{ text?: string; onPress?: () => void; style?: string }>) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    console.log('[Alert.alert]', text);
    if (!buttons || buttons.length <= 1) {
      buttons?.[0]?.onPress?.();
      return;
    }
    const confirmBtn = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];
    confirmBtn?.onPress?.();
  };
}

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
  const [locale, setLocale] = useState<string>(i18n.language || 'en');
  const { loaded: fontsLoaded } = useAppFonts();

  useEffect(() => {
    initI18n().finally(() => {
      setLocale(i18n.language || 'en');
      setI18nReady(true);
    });
  }, []);

  useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      setLocale(lng);
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
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

  const isRtl = locale === 'ar';

  return (
    <GestureHandlerRootView style={{ flex: 1, direction: isRtl ? 'rtl' : 'ltr' }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <OfflineBanner />
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
