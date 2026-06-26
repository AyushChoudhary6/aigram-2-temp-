import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { User } from '../types';
import { ROUTES } from '../constants';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import AIToolsScreen from '../screens/main/AIToolsScreen';
import PracticeScreen from '../screens/main/PracticeScreen';
import GamifiedPracticeScreen from '../screens/main/GamifiedPracticeScreen';
import ChallengeDetailScreen from '../screens/main/ChallengeDetailScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Custom floating navbar
import FloatingNavbar from '../components/FloatingNavbar';

const Tab = createBottomTabNavigator();
const MainStack = createStackNavigator();

interface MainNavigatorProps {
  user: User;
  onLogout: () => void;
}

const TabNavigator: React.FC<MainNavigatorProps> = ({ user, onLogout }) => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingNavbar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 0,
        },
        sceneContainerStyle: { flex: 1, backgroundColor: 'transparent' },
      }}
      sceneContainerStyle={{ flex: 1 }}
    >
      <Tab.Screen
        name={ROUTES.PRACTICE}
        options={{ title: 'Practice' }}
      >
        {(props) => <PracticeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name={ROUTES.AI_TOOLS}
        options={{ title: 'Marketplace' }}
      >
        {(props) => <AIToolsScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name={ROUTES.HOME}
        options={{ title: 'Home' }}
      >
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name={ROUTES.PROFILE}
        options={{ title: 'Profile' }}
      >
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC<MainNavigatorProps> = ({ user, onLogout }) => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <MainStack.Screen name={ROUTES.TAB_NAVIGATOR}>
        {(props) => <TabNavigator {...props} user={user} onLogout={onLogout} />}
      </MainStack.Screen>
      <MainStack.Screen name={ROUTES.GAMIFIED_PRACTICE} component={GamifiedPracticeScreen} />
      <MainStack.Screen name={ROUTES.CHALLENGE_DETAIL} component={ChallengeDetailScreen} />
    </MainStack.Navigator>
  );
};

export default MainNavigator;
