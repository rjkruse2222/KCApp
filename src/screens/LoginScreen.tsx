import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/auth';
import { COLORS } from '../config/constants';

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const { login } = useAuthStore();

  useEffect(() => {
    checkAppleSignIn();
  }, []);

  const checkAppleSignIn = async () => {
    const available = await AuthService.isAppleSignInAvailable();
    setAppleSignInAvailable(available);
  };

  const handleSignIn = async (provider: 'google' | 'microsoft' | 'apple') => {
    setIsLoading(true);
    setLoadingProvider(provider);

    try {
      let result;

      switch (provider) {
        case 'google':
          result = await AuthService.signInWithGoogle();
          break;
        case 'microsoft':
          result = await AuthService.signInWithMicrosoft();
          break;
        case 'apple':
          result = await AuthService.signInWithApple();
          break;
      }

      await login(result.user, result.accessToken, result.refreshToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      Alert.alert('Sign In Error', message);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="calculator-variant"
          size={80}
          color={COLORS.primary}
        />
        <Text variant="headlineLarge" style={styles.title}>
          KCApp
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          CPA Firm Management
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Text variant="bodyMedium" style={styles.signInText}>
          Sign in to continue
        </Text>

        <Button
          mode="contained"
          onPress={() => handleSignIn('google')}
          disabled={isLoading}
          style={[styles.button, styles.googleButton]}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon={() =>
            loadingProvider === 'google' ? (
              <ActivityIndicator color="#fff" size={20} />
            ) : (
              <MaterialCommunityIcons name="google" size={24} color="#fff" />
            )
          }
        >
          Continue with Google
        </Button>

        <Button
          mode="contained"
          onPress={() => handleSignIn('microsoft')}
          disabled={isLoading}
          style={[styles.button, styles.microsoftButton]}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon={() =>
            loadingProvider === 'microsoft' ? (
              <ActivityIndicator color="#fff" size={20} />
            ) : (
              <MaterialCommunityIcons name="microsoft" size={24} color="#fff" />
            )
          }
        >
          Continue with Microsoft
        </Button>

        {(Platform.OS === 'ios' || appleSignInAvailable) && (
          <Button
            mode="contained"
            onPress={() => handleSignIn('apple')}
            disabled={isLoading}
            style={[styles.button, styles.appleButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon={() =>
              loadingProvider === 'apple' ? (
                <ActivityIndicator color="#fff" size={20} />
              ) : (
                <MaterialCommunityIcons name="apple" size={24} color="#fff" />
              )
            }
          >
            Continue with Apple
          </Button>
        )}
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    marginTop: 8,
    color: COLORS.gray600,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  signInText: {
    textAlign: 'center',
    marginBottom: 24,
    color: COLORS.gray600,
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
  buttonContent: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  microsoftButton: {
    backgroundColor: '#00A4EF',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  footer: {
    paddingVertical: 24,
  },
  footerText: {
    textAlign: 'center',
    color: COLORS.gray500,
  },
});
