import React, { useEffect } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth, useUser } from '../context/AppContext';

import { User as AppUser } from '../types';
import { ROUTES } from '../constants';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const RootStack = createStackNavigator();

interface AppNavigatorProps {}

const AppNavigator: React.FC<AppNavigatorProps> = () => {
  const { isLoaded, isSignedIn, user, signOut } = useAuth();

  const handleAuthSuccess = (userData: AppUser) => {
    // Handled by Firebase listener globally now
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
  };

  console.log('AppNavigator: isLoaded =', isLoaded, 'user =', user?.name || 'null');

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
      }}
    >
      {user ? (
        <RootStack.Screen name={ROUTES.MAIN_STACK}>
          {(props) => (
            <MainNavigator
              {...props}
              user={user}
              onLogout={handleLogout}
            />
          )}
        </RootStack.Screen>
      ) : (
        <RootStack.Screen name={ROUTES.AUTH_STACK}>
          {(props) => (
            <AuthNavigator
              {...props}
              onAuthSuccess={handleAuthSuccess}
            />
          )}
        </RootStack.Screen>
      )}
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0B',
  },
});

export default AppNavigator;
