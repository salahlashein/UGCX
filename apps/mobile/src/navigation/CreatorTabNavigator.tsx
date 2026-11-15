import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type {
  CreatorHomeStackParamList,
  CreatorDiscoverStackParamList,
  CreatorWorkStackParamList,
  CreatorEarningsStackParamList,
  CreatorProfileStackParamList,
} from './types';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FloatingTabBar } from './FloatingTabBar';

// Screens
import { CreatorHomeScreen } from '../screens/creator/CreatorHomeScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { PendingVettingScreen } from '../screens/creator/PendingVettingScreen';
import { CampaignDiscoveryScreen } from '../screens/creator/CampaignDiscoveryScreen';
import { CampaignDetailScreen } from '../screens/creator/CampaignDetailScreen';
import { CollaborationStatusScreen } from '../screens/creator/CollaborationStatusScreen';
import { DeliverableUploadScreen } from '../screens/creator/DeliverableUploadScreen';
import { CollaborationChatScreen } from '../screens/shared/CollaborationChatScreen';
import { PayoutsScreen } from '../screens/creator/PayoutsScreen';
import { CreatorProfileScreen } from '../screens/creator/CreatorProfileScreen';
import { EditProfileScreen } from '../screens/creator/EditProfileScreen';
import { MyProposalsScreen } from '../screens/creator/MyProposalsScreen';
import { Icon } from '../components/ui/Icon';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<CreatorHomeStackParamList>();
const DiscoverStack = createNativeStackNavigator<CreatorDiscoverStackParamList>();
const WorkStack = createNativeStackNavigator<CreatorWorkStackParamList>();
const EarningsStack = createNativeStackNavigator<CreatorEarningsStackParamList>();
const ProfileStack = createNativeStackNavigator<CreatorProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={CreatorHomeScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="PendingVetting" component={PendingVettingScreen} />
    </HomeStack.Navigator>
  );
}

function DiscoverStackNavigator() {
  return (
    <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscoverStack.Screen name="Discover" component={CampaignDiscoveryScreen} />
      <DiscoverStack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
    </DiscoverStack.Navigator>
  );
}

function WorkStackNavigator() {
  return (
    <WorkStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkStack.Screen name="WorkStatus" component={CollaborationStatusScreen} />
      <WorkStack.Screen name="DeliverableUpload" component={DeliverableUploadScreen} />
      <WorkStack.Screen name="CollaborationChat" component={CollaborationChatScreen} />
    </WorkStack.Navigator>
  );
}

function EarningsStackNavigator() {
  return (
    <EarningsStack.Navigator screenOptions={{ headerShown: false }}>
      <EarningsStack.Screen name="Earnings" component={PayoutsScreen} />
    </EarningsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={CreatorProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="MyProposals" component={MyProposalsScreen} />
    </ProfileStack.Navigator>
  );
}

export function CreatorTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'none',
        tabBarIcon: ({ focused }) => {
          let iconName: React.ComponentProps<typeof Icon>['name'] = 'circle';
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'DiscoverTab') iconName = 'search';
          else if (route.name === 'WorkTab') iconName = 'briefcase';
          else if (route.name === 'EarningsTab') iconName = 'dollar-sign';
          else if (route.name === 'ProfileTab') iconName = 'user';
          return <Icon name={iconName} size={20} color={focused ? 'primary' : 'borderStrong'} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" options={{ tabBarLabel: t('nav.home', 'Home') }}>
        {() => (
          <ErrorBoundary>
            <HomeStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="DiscoverTab" options={{ tabBarLabel: t('nav.discover', 'Discover') }}>
        {() => (
          <ErrorBoundary>
            <DiscoverStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="WorkTab" options={{ tabBarLabel: t('nav.work', 'Work') }}>
        {() => (
          <ErrorBoundary>
            <WorkStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="EarningsTab" options={{ tabBarLabel: t('nav.earnings', 'Earnings') }}>
        {() => (
          <ErrorBoundary>
            <EarningsStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="ProfileTab" options={{ tabBarLabel: t('nav.profile', 'Profile') }}>
        {() => (
          <ErrorBoundary>
            <ProfileStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
