import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MainLayout from '../layouts/MainLayout';
import HomeScreen from '../screens/HomeScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutUs from '../screens/AboutUs';
import Dashboard from '../screens/Dashboard';
import ContactsScreen from '../screens/Contacts';
import InitialScan from '../screens/InitialScan';
import OnboardingScreen from '../screens/OnboardingScreen'; // Import onboarding screen
import NotificationHandlerScreen from '../screens/NotificationHandlerScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [selectedFolders, setSelectedFolders] = useState([
    'Download', 'DCIM', 'Documents', 'Pictures', 'Music'
  ]);

  const [isOnboarded, setIsOnboarded] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
      setIsOnboarded(hasOnboarded !== null);
    };
    checkOnboarding();
  }, []);

  if (isOnboarded === null) return null; // Show a loading screen if needed

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        <Stack.Screen name="NotificationHandler">
          {() => (
            <MainLayout>
              <NotificationHandlerScreen />
            </MainLayout>
          )}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {() => (
            <MainLayout>
              <HomeScreen />
            </MainLayout>
          )}
        </Stack.Screen>
        <Stack.Screen name="Scan">
          {() => (
            <MainLayout>
              <InitialScan />
              {/* <NewInitialScan /> */}
            </MainLayout>
          )}
        </Stack.Screen>
        <Stack.Screen name="Results">
          {() => (
            <MainLayout>
              <ResultsScreen />
            </MainLayout>
          )}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {() => (
            <MainLayout>
              <SettingsScreen selectedFolders={selectedFolders} setSelectedFolders={setSelectedFolders} />
            </MainLayout>
          )}
        </Stack.Screen>
        <Stack.Screen name="AboutUs">
          {() => (
            <MainLayout>
              <AboutUs />
            </MainLayout>
          )}
        </Stack.Screen>
        <Stack.Screen name="Dashboard">
          {() => (
            <MainLayout>
              <Dashboard />
            </MainLayout>
          )}
        </Stack.Screen>
        <Stack.Screen name="Contacts">
          {() => (
            <MainLayout>
              <ContactsScreen />
            </MainLayout>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
