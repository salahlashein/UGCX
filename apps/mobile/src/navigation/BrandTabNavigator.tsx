import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type {
  BrandDashboardStackParamList,
  BrandBriefsStackParamList,
  BrandProposalsStackParamList,
  BrandChatsStackParamList,
  BrandProfileStackParamList,
} from './types';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Icon } from '../components/ui/Icon';
import { FloatingTabBar } from './FloatingTabBar';

// Brand screens
import { BrandDashboardScreen } from '../screens/brand/BrandDashboardScreen';
import { MyBriefsScreen } from '../screens/brand/MyBriefsScreen';
import { PostBriefScreen } from '../screens/brand/PostBriefScreen';
import { CampaignWizardScreen } from '../screens/brand/CampaignWizardScreen';
import { ProposalsInboxScreen } from '../screens/brand/ProposalsInboxScreen';
import { ProposalsOverviewScreen } from '../screens/brand/ProposalsOverviewScreen';
import { AcceptProposalScreen } from '../screens/brand/AcceptProposalScreen';
import { CreatorProfilePreviewScreen } from '../screens/brand/CreatorProfilePreviewScreen';
import { EditLiveBriefScreen } from '../screens/brand/EditLiveBriefScreen';
import { FundEscrowScreen } from '../screens/brand/FundEscrowScreen';
import { CollaborationDetailScreen } from '../screens/brand/CollaborationDetailScreen';
import { ReviewDeliverableScreen } from '../screens/brand/ReviewDeliverableScreen';
import { BrandChatsScreen } from '../screens/brand/BrandChatsScreen';
import { BrandProfileScreen } from '../screens/brand/BrandProfileScreen';
import { EditBrandProfileScreen } from '../screens/brand/EditBrandProfileScreen';
import { BrandBillingScreen } from '../screens/brand/BrandBillingScreen';
import { BrandSetupScreen } from '../screens/brand/BrandSetupScreen';
import { BrandPhoneVerificationScreen } from '../screens/brand/BrandPhoneVerificationScreen';
import { BrandTeamScreen } from '../screens/brand/BrandTeamScreen';
import { ProductsListScreen } from '../screens/brand/ProductsListScreen';
import { ProductFormScreen } from '../screens/brand/ProductFormScreen';

// Shared screens
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { CollaborationChatScreen } from '../screens/shared/CollaborationChatScreen';

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator<BrandDashboardStackParamList>();
const BriefsStack = createNativeStackNavigator<BrandBriefsStackParamList>();
const ProposalsStack = createNativeStackNavigator<BrandProposalsStackParamList>();
const ChatsStack = createNativeStackNavigator<BrandChatsStackParamList>();
const ProfileStack = createNativeStackNavigator<BrandProfileStackParamList>();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="BrandDashboard" component={BrandDashboardScreen} />
      <DashboardStack.Screen name="Notifications" component={NotificationsScreen} />
    </DashboardStack.Navigator>
  );
}

function BriefsStackNavigator() {
  const { t } = useTranslation();
  return (
    <BriefsStack.Navigator>
      <BriefsStack.Screen
        name="MyBriefs"
        component={MyBriefsScreen}
        options={{ headerShown: false }}
      />
      <BriefsStack.Screen
        name="PostBrief"
        component={PostBriefScreen}
        options={{ title: t('brand.brief.header') }}
      />
      <BriefsStack.Screen
        name="CampaignWizard"
        component={CampaignWizardScreen}
        options={{ title: t('brand.wizard.title') }}
      />
      <BriefsStack.Screen
        name="EditLiveBrief"
        component={EditLiveBriefScreen}
        options={{ title: t('brand.editLiveBrief.title', 'Edit brief') }}
      />
      <BriefsStack.Screen
        name="FundEscrow"
        component={FundEscrowScreen}
        options={{ title: t('brand.fundEscrow.title', 'Fund escrow') }}
      />
      <BriefsStack.Screen
        name="ProposalsInbox"
        component={ProposalsInboxScreen}
        options={{ title: t('brand.proposals.title') }}
      />
      <BriefsStack.Screen
        name="CreatorProfilePreview"
        component={CreatorProfilePreviewScreen}
        options={{ title: t('creator.profile.title', 'Creator profile') }}
      />
      <BriefsStack.Screen
        name="AcceptProposal"
        component={AcceptProposalScreen}
        options={{ title: t('brand.acceptProposal.title') }}
      />
      <BriefsStack.Screen
        name="CollaborationDetail"
        component={CollaborationDetailScreen}
        options={{ title: t('brand.collaboration.title') }}
      />
      <BriefsStack.Screen
        name="CollaborationChat"
        component={CollaborationChatScreen}
        options={{ title: t('chat.title') }}
      />
      <BriefsStack.Screen
        name="ReviewDeliverable"
        component={ReviewDeliverableScreen}
        options={{ title: t('brand.review.title', 'Review deliverable') }}
      />
    </BriefsStack.Navigator>
  );
}

function ProposalsStackNavigator() {
  const { t } = useTranslation();
  return (
    <ProposalsStack.Navigator>
      <ProposalsStack.Screen
        name="ProposalsAcrossBriefs"
        component={ProposalsOverviewScreen}
        options={{ title: t('brand.proposals.title') }}
      />
      <ProposalsStack.Screen
        name="ProposalsInbox"
        component={ProposalsInboxScreen}
        options={{ title: t('brand.proposals.title') }}
      />
      <ProposalsStack.Screen
        name="CreatorProfilePreview"
        component={CreatorProfilePreviewScreen}
        options={{ title: t('creator.profile.title', 'Creator profile') }}
      />
      <ProposalsStack.Screen
        name="AcceptProposal"
        component={AcceptProposalScreen}
        options={{ title: t('brand.acceptProposal.title') }}
      />
      <ProposalsStack.Screen
        name="CollaborationDetail"
        component={CollaborationDetailScreen}
        options={{ title: t('brand.collaboration.title') }}
      />
      <ProposalsStack.Screen
        name="ReviewDeliverable"
        component={ReviewDeliverableScreen}
        options={{ title: t('brand.review.title', 'Review deliverable') }}
      />
      <ProposalsStack.Screen
        name="CollaborationChat"
        component={CollaborationChatScreen}
        options={{ title: t('chat.title') }}
      />
    </ProposalsStack.Navigator>
  );
}

function ChatsStackNavigator() {
  return (
    <ChatsStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatsStack.Screen name="BrandChats" component={BrandChatsScreen} />
      <ChatsStack.Screen name="CollaborationChat" component={CollaborationChatScreen} />
    </ChatsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const { t } = useTranslation();
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="BrandProfile"
        component={BrandProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditBrandProfile"
        component={EditBrandProfileScreen}
        options={{ title: t('brand.profile.edit') }}
      />
      <ProfileStack.Screen
        name="BrandBilling"
        component={BrandBillingScreen}
        options={{ title: t('brand.billing.title', 'Billing') }}
      />
      <ProfileStack.Screen
        name="BrandSetup"
        component={BrandSetupScreen}
        options={{ title: t('brand.setup.title') }}
      />
      <ProfileStack.Screen
        name="BrandPhoneVerification"
        component={BrandPhoneVerificationScreen}
        options={{ title: t('brand.verify.title') }}
      />
      <ProfileStack.Screen
        name="BrandTeam"
        component={BrandTeamScreen}
        options={{ title: t('brand.team.title') }}
      />
      <ProfileStack.Screen
        name="ProductsList"
        component={ProductsListScreen}
        options={{ title: t('brand.products.title') }}
      />
      <ProfileStack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={{ title: t('brand.products.addNew') }}
      />
    </ProfileStack.Navigator>
  );
}

/**
 * TASK-P1-11: Brand 5-tab navigator.
 * Follows Artboard 3g and DESIGN.md tab ordering: Dashboard, Briefs, Proposals, Chats, Profile.
 */
export function BrandTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'none',
        tabBarIcon: ({ focused }) => {
          let iconName: React.ComponentProps<typeof Icon>['name'] = 'circle';
          if (route.name === 'BrandDashboardTab') iconName = 'home';
          else if (route.name === 'BrandBriefsTab') iconName = 'file-text';
          else if (route.name === 'BrandProposalsTab') iconName = 'users';
          else if (route.name === 'BrandChatsTab') iconName = 'message-circle';
          else if (route.name === 'BrandProfileTab') iconName = 'user';

          return <Icon name={iconName} size={20} color={focused ? 'primary' : 'borderStrong'} />;
        },
      })}
    >
      <Tab.Screen name="BrandDashboardTab" options={{ tabBarLabel: t('nav.dashboard') }}>
        {() => (
          <ErrorBoundary>
            <DashboardStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="BrandBriefsTab" options={{ tabBarLabel: t('nav.briefs') }}>
        {() => (
          <ErrorBoundary>
            <BriefsStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="BrandProposalsTab" options={{ tabBarLabel: t('nav.proposals') }}>
        {() => (
          <ErrorBoundary>
            <ProposalsStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="BrandChatsTab" options={{ tabBarLabel: t('nav.chats') }}>
        {() => (
          <ErrorBoundary>
            <ChatsStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="BrandProfileTab" options={{ tabBarLabel: t('nav.profile') }}>
        {() => (
          <ErrorBoundary>
            <ProfileStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
