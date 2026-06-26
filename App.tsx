import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { setAudioModeAsync } from 'expo-audio';

const DarkGlassTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00D084',
    background: '#0B0B0B',
    card: '#0B0B0B',
    text: '#E8F5E8',
    border: 'rgba(255,255,255,0.10)',
    notification: '#00D084',
  },
};

export default function App() {
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          interruptionMode: 'mixWithOthers',
        });
      } catch (e) {
        console.log('Audio setup error:', e);
      }
    };
    setupAudio();
  }, []);

  return (
    <AuthProvider>     
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0B0B0B' }}>
        <SafeAreaProvider>
          <AppProvider>
            <NavigationContainer theme={DarkGlassTheme}>
              <AppNavigator />
            </NavigationContainer>
            <StatusBar style="light" />
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

