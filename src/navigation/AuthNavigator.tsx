import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { User } from '../types';
import { ROUTES } from '../constants';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const AuthStack = createStackNavigator();

interface AuthNavigatorProps {
  onAuthSuccess?: (user: User) => void;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = () => {
  return (
    <AuthStack.Navigator
      initialRouteName={ROUTES.LOGIN}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <AuthStack.Screen name={ROUTES.LOGIN}>
        {(props) => <LoginScreen {...props} />}
      </AuthStack.Screen>

      <AuthStack.Screen name="Register">
        {(props) => <RegisterScreen {...props} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
