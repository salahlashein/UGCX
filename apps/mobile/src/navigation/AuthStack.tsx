import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { OnboardingRoleScreen } from '../screens/auth/OnboardingRoleScreen';
import { OnboardingPhoneNumberScreen } from '../screens/auth/OnboardingPhoneNumberScreen';
import { OnboardingOtpScreen } from '../screens/auth/OnboardingOtpScreen';
import { OnboardingBasicsScreen } from '../screens/auth/OnboardingBasicsScreen';
import { OnboardingPortfolioScreen } from '../screens/auth/OnboardingPortfolioScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingRole" component={OnboardingRoleScreen} />
      <Stack.Screen name="OnboardingPhoneNumber" component={OnboardingPhoneNumberScreen} />
      <Stack.Screen name="OnboardingOtp" component={OnboardingOtpScreen} />
      <Stack.Screen name="OnboardingBasics" component={OnboardingBasicsScreen} />
      <Stack.Screen name="OnboardingPortfolio" component={OnboardingPortfolioScreen} />
    </Stack.Navigator>
  );
}
