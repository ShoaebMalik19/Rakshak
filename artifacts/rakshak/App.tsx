import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import JourneyScreen from './screens/JourneyScreen';
import DetectScreen from './screens/DetectScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import IncomingCallScreen from './screens/IncomingCallScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const BG = '#FAF6EF';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: BG, primary: '#C0445A', card: '#FFFFFF', border: '#F0E8DC' },
};

/** Readable URLs on web (/map, /journey, ...) and deep links on native (rakshak://journey). */
const linking = {
  prefixes: ['rakshak://'],
  config: {
    screens: {
      Onboarding: 'welcome',
      Main: { screens: { Home: '', Map: 'map', Journey: 'journey', Tools: 'tools', Profile: 'profile' } },
      IncomingCall: 'call',
    },
  },
};

const TAB_ICONS: Record<string, [string, string]> = {
  Home: ['home', 'home-outline'],
  Map: ['map', 'map-outline'],
  Journey: ['navigate', 'navigate-outline'],
  Tools: ['shield', 'shield-outline'],
  Profile: ['person', 'person-outline'],
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarActiveTintColor: '#C0445A',
        tabBarInactiveTintColor: '#9C8878',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0E8DC',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => {
          const [on, off] = TAB_ICONS[route.name] ?? ['home', 'home-outline'];
          return <Ionicons name={(focused ? on : off) as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Tools" component={DetectScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/** On a desktop browser, show the app in a phone-width column instead of stretching it. */
function WebFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.webOuter}>
      <View style={styles.webInner}>{children}</View>
    </View>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const userData = await AsyncStorage.getItem('userName');
        setShowOnboarding(!userData);
      } catch {
        setShowOnboarding(true);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) await SplashScreen.hideAsync().catch(() => {});
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C0445A" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppProvider>
            <WebFrame>
              <NavigationContainer linking={linking as any} theme={navTheme} documentTitle={{ formatter: (_, route) => `Rakshak · ${route?.name ?? ''}` }}>
                <Stack.Navigator
                  initialRouteName={showOnboarding ? 'Onboarding' : 'Main'}
                  screenOptions={{ headerShown: false, cardStyle: { backgroundColor: BG } }}
                >
                  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                  <Stack.Screen name="Main" component={TabNavigator} />
                  <Stack.Screen
                    name="IncomingCall"
                    component={IncomingCallScreen}
                    options={{ presentation: 'modal', gestureEnabled: false }}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </WebFrame>
          </AppProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webOuter: { flex: 1, backgroundColor: '#EFE7DA', alignItems: 'center' },
  webInner: {
    flex: 1, width: '100%', maxWidth: 480, backgroundColor: BG, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 0 },
  },
});
