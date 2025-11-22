import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme, configureFonts } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { DatabaseService } from './src/services/database';
import { COLORS } from './src/config/constants';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

// Custom theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primaryLight,
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.success,
    error: COLORS.error,
    background: COLORS.background,
    surface: COLORS.surface,
  },
};

function AppContent() {
  const { loadStoredAuth, isLoading: authLoading } = useAuthStore();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await DatabaseService.initialize();
      setDbInitialized(true);

      // Load stored authentication
      await loadStoredAuth();
    } catch (error) {
      console.error('App initialization error:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
    }
  };

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {initError}</Text>
        <Text style={styles.errorHint}>Please restart the app</Text>
      </View>
    );
  }

  if (!dbInitialized || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading KCApp...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <AppContent />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
  errorHint: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.gray500,
  },
});
