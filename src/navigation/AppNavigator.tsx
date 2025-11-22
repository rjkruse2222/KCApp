import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useResponsive } from '../hooks/useResponsive';
import { RootStackParamList, MainTabParamList } from '../types';
import { COLORS } from '../config/constants';
import { Sidebar } from '../components/web/Sidebar';

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

// Web-optimized linking configuration
const linking = {
  prefixes: ['kcapp://', 'https://kcapp.com'],
  config: {
    screens: {
      Auth: 'login',
      Main: {
        screens: {
          Dashboard: '',
          TimeTracking: 'time',
          Mileage: 'mileage',
          Clients: 'clients',
          More: 'more',
        },
      },
      ClientDetail: 'clients/:clientId',
      TimeEntryDetail: 'time/:entryId',
      MileageDetail: 'mileage/:entryId',
      CloudFolder: 'clients/:clientId/documents',
      Report: 'clients/:clientId/report',
      Settings: 'settings',
    },
  },
};

function MainTabs() {
  const { isWeb, isDesktop, isTablet } = useResponsive();
  const showBottomTabs = !isWeb || (!isDesktop && !isTablet);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        tabBarStyle: showBottomTabs
          ? {
              paddingBottom: 8,
              paddingTop: 8,
              height: 60,
            }
          : { display: 'none' }, // Hide tabs on web desktop
        headerStyle: {
          backgroundColor: isWeb && (isDesktop || isTablet) ? '#fff' : COLORS.primary,
        },
        headerTintColor: isWeb && (isDesktop || isTablet) ? COLORS.gray800 : '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        // On web desktop, don't show header since we have sidebar
        headerShown: !isWeb || (!isDesktop && !isTablet),
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

function WebLayout({ children }: { children: React.ReactNode }) {
  const { isDesktop, isTablet } = useResponsive();

  return (
    <View style={styles.webContainer}>
      <Sidebar collapsed={isTablet && !isDesktop} />
      <View style={styles.webContent}>{children}</View>
    </View>
  );
}

function AuthenticatedNavigator() {
  const { isWeb, isDesktop, isTablet } = useResponsive();
  const useWebLayout = isWeb && (isDesktop || isTablet);

  const navigator = (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: useWebLayout ? '#fff' : COLORS.primary,
        },
        headerTintColor: useWebLayout ? COLORS.gray800 : '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        // Web-specific animations
        ...(Platform.OS === 'web' && {
          animation: 'fade',
        }),
      }}
    >
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
    </Stack.Navigator>
  );

  if (useWebLayout) {
    return <WebLayout>{navigator}</WebLayout>;
  }

  return navigator;
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isWeb } = useResponsive();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer
      linking={isWeb ? linking : undefined}
      documentTitle={{
        formatter: (options, route) =>
          `${options?.title ?? route?.name ?? 'KCApp'} - KCApp`,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={LoginScreen} />
        </Stack.Navigator>
      ) : (
        <AuthenticatedNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    ...(Platform.OS === 'web' && {
      minHeight: '100vh' as any,
    }),
  },
  webContent: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
});
