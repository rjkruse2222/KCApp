import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList, MainTabParamList } from '../types';
import { COLORS } from '../config/constants';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TimeTrackingScreen } from '../screens/TimeTrackingScreen';
import { MileageScreen } from '../screens/MileageScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { ClientDetailScreen } from '../screens/ClientDetailScreen';
import { TimeEntryDetailScreen } from '../screens/TimeEntryDetailScreen';
import { MileageDetailScreen } from '../screens/MileageDetailScreen';
import { CloudFolderScreen } from '../screens/CloudFolderScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="TimeTracking"
        component={TimeTrackingScreen}
        options={{
          tabBarLabel: 'Time',
          headerTitle: 'Time Tracking',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Mileage"
        component={MileageScreen}
        options={{
          tabBarLabel: 'Mileage',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="car" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dots-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ClientDetail"
              component={ClientDetailScreen}
              options={{ title: 'Client Details' }}
            />
            <Stack.Screen
              name="TimeEntryDetail"
              component={TimeEntryDetailScreen}
              options={{ title: 'Time Entry' }}
            />
            <Stack.Screen
              name="MileageDetail"
              component={MileageDetailScreen}
              options={{ title: 'Trip Details' }}
            />
            <Stack.Screen
              name="CloudFolder"
              component={CloudFolderScreen}
              options={{ title: 'Documents' }}
            />
            <Stack.Screen
              name="Report"
              component={ReportScreen}
              options={{ title: 'Report' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
