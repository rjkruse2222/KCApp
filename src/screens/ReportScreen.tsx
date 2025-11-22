import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  IconButton,
  FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useClientStore } from '../store/clientStore';
import { RootStackParamList } from '../types';
import { COLORS } from '../config/constants';

type RouteProps = RouteProp<RootStackParamList, 'Report'>;

export function ReportScreen() {
  const route = useRoute<RouteProps>();
  const { clientId, reportUrl } = route.params;

  const { getClientById } = useClientStore();
  const client = getClientById(clientId);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleOpenInBrowser = () => {
    Linking.openURL(reportUrl);
  };

  const handleRefresh = () => {
    setHasError(false);
    setIsLoading(true);
  };

  if (!reportUrl) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="chart-bar"
          size={64}
          color={COLORS.gray400}
        />
        <Text variant="titleMedium" style={styles.emptyText}>
          No report configured
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          Configure a report URL in the client settings.
        </Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={64}
          color={COLORS.error}
        />
        <Text variant="titleMedium" style={styles.errorText}>
          Failed to load report
        </Text>
        <Text variant="bodyMedium" style={styles.errorSubtext}>
          The report could not be loaded. This might be due to embedding
          restrictions or network issues.
        </Text>
        <View style={styles.errorActions}>
          <FAB
            icon="refresh"
            label="Retry"
            onPress={handleRefresh}
            style={styles.errorButton}
          />
          <FAB
            icon="open-in-new"
            label="Open in Browser"
            onPress={handleOpenInBrowser}
            style={[styles.errorButton, { backgroundColor: COLORS.primary }]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.headerTitle}>
          {client?.name}'s Report
        </Text>
        <View style={styles.headerActions}>
          <IconButton icon="refresh" onPress={handleRefresh} />
          <IconButton icon="open-in-new" onPress={handleOpenInBrowser} />
        </View>
      </View>

      <WebView
        source={{ uri: reportUrl }}
        style={styles.webview}
        startInLoadingState
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 400) {
            setHasError(true);
          }
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Loading report...
            </Text>
          </View>
        )}
        // Enable JavaScript for Power BI, Looker, etc.
        javaScriptEnabled
        domStorageEnabled
        // Allow third-party cookies for authentication
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        // Security settings
        originWhitelist={['*']}
        mixedContentMode="compatibility"
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.gray500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: COLORS.gray600,
  },
  emptySubtext: {
    marginTop: 8,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    color: COLORS.error,
  },
  errorSubtext: {
    marginTop: 8,
    color: COLORS.gray500,
    textAlign: 'center',
    maxWidth: 300,
  },
  errorActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
  },
  errorButton: {
    backgroundColor: COLORS.gray600,
  },
});
