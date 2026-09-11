import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type {
  BrandCampaignsStackParamList,
  BrandProductsStackParamList,
  BrandProfileStackParamList,
} from './types';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CampaignsListScreen } from '../screens/brand/CampaignsListScreen';
import { CampaignWizardScreen } from '../screens/brand/CampaignWizardScreen';
import { ProposalsInboxScreen } from '../screens/brand/ProposalsInboxScreen';
import { AcceptProposalScreen } from '../screens/brand/AcceptProposalScreen';
import { CollaborationDetailScreen } from '../screens/brand/CollaborationDetailScreen';
import { CollaborationChatScreen } from '../screens/shared/CollaborationChatScreen';
import { ProductsListScreen } from '../screens/brand/ProductsListScreen';
import { ProductFormScreen } from '../screens/brand/ProductFormScreen';
import { BrandProfileScreen } from '../screens/brand/BrandProfileScreen';

const Tab = createBottomTabNavigator();
const CampaignsStack = createNativeStackNavigator<BrandCampaignsStackParamList>();
const ProductsStack = createNativeStackNavigator<BrandProductsStackParamList>();
const ProfileStack = createNativeStackNavigator<BrandProfileStackParamList>();

function CampaignsStackNavigator() {
  const { t } = useTranslation();
  return (
    <CampaignsStack.Navigator>
      <CampaignsStack.Screen
        name="CampaignsList"
        component={CampaignsListScreen}
        options={{ title: t('brand.campaigns.title') }}
      />
      <CampaignsStack.Screen
        name="CampaignWizard"
        component={CampaignWizardScreen}
        options={{ title: t('brand.wizard.title') }}
      />
      <CampaignsStack.Screen
        name="ProposalsInbox"
        component={ProposalsInboxScreen}
        options={{ title: t('brand.proposals.title') }}
      />
      <CampaignsStack.Screen
        name="AcceptProposal"
        component={AcceptProposalScreen}
        options={{ title: t('brand.acceptProposal.title') }}
      />
      <CampaignsStack.Screen
        name="CollaborationDetail"
        component={CollaborationDetailScreen}
        options={{ title: t('brand.collaboration.title') }}
      />
      <CampaignsStack.Screen
        name="CollaborationChat"
        component={CollaborationChatScreen}
        options={{ title: t('chat.title') }}
      />
    </CampaignsStack.Navigator>
  );
}

function ProductsStackNavigator() {
  const { t } = useTranslation();
  return (
    <ProductsStack.Navigator>
      <ProductsStack.Screen
        name="ProductsList"
        component={ProductsListScreen}
        options={{ title: t('brand.products.title') }}
      />
      <ProductsStack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={{ title: t('brand.products.addNew') }}
      />
    </ProductsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const { t } = useTranslation();
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="BrandProfile"
        component={BrandProfileScreen}
        options={{ title: t('brand.profile.title') }}
      />
    </ProfileStack.Navigator>
  );
}

/** TASK-P1-003: REQ-003 brand tab set. RISK-003: no shared screen reads user.role. */
export function BrandTabNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="CampaignsTab" options={{ tabBarLabel: t('nav.campaigns') }}>
        {() => (
          <ErrorBoundary>
            <CampaignsStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="ProductsTab" options={{ tabBarLabel: t('nav.products') }}>
        {() => (
          <ErrorBoundary>
            <ProductsStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="ProfileTab" options={{ tabBarLabel: t('nav.profile') }}>
        {() => (
          <ErrorBoundary>
            <ProfileStackNavigator />
          </ErrorBoundary>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
