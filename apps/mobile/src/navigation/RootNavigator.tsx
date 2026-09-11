import { NavigationContainer } from '@react-navigation/native';
import { useAuthSession } from '../hooks/useAuthSession';
import { LoadingState } from '../components/ui/LoadingState';
import { navigationRef } from './navigationRef';
import { AuthStack } from './AuthStack';
import { BrandTabNavigator } from './BrandTabNavigator';
import { CreatorTabNavigator } from './CreatorTabNavigator';

/**
 * TASK-P1-003: REQ-001/REQ-003. Exactly one code path per role — this is
 * the only place `user.role` decides which screens exist (RISK-003).
 */
export function RootNavigator() {
  const { user, isLoading } = useAuthSession();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!user ? (
        <AuthStack />
      ) : user.role === 'brand' ? (
        <BrandTabNavigator />
      ) : (
        <CreatorTabNavigator />
      )}
    </NavigationContainer>
  );
}
