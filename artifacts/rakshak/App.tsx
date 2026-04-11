import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

import { AppProvider } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import JourneyScreen from './screens/JourneyScreen';
import DetectScreen from './screens/DetectScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import IncomingCallScreen from './screens/IncomingCallScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarActiveTintColor: '#C0445A',
        tabBarInactiveTintColor: '#9C8878',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0E8DC',
          height: 62,
          paddingBottom: 8,
        },
        tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => {
          const icons: Record<string, string> = {
            Home: focused ? 'home' : 'home-outline',
            Map: focused ? 'map' : 'map-outline',
            Journey: focused ? 'navigate' : 'navigate-outline',
            Detect: focused ? 'scan' : 'scan-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={(icons[route.name] || 'home') as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Detect" component={DetectScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const userData = await AsyncStorage.getItem('userName');
        setShowOnboarding(!userData);
      } catch {
        setShowOnboarding(true);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF6EF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C0445A" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {showOnboarding && (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              )}
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen
                name="IncomingCall"
                component={IncomingCallScreen}
                options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
