import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, List, Avatar, Divider, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';
import { COLORS, APP_CONFIG } from '../config/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CSV',
          onPress: () => {
            // TODO: Implement CSV export
            Alert.alert('Export', 'CSV export coming soon!');
          },
        },
        {
          text: 'PDF',
          onPress: () => {
            // TODO: Implement PDF export
            Alert.alert('Export', 'PDF export coming soon!');
          },
        },
      ]
    );
  };

  const getProviderIcon = () => {
    switch (user?.provider) {
      case 'google':
        return 'google';
      case 'microsoft':
        return 'microsoft';
      case 'apple':
        return 'apple';
      default:
        return 'account';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Card */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          {user?.photoUrl ? (
            <Avatar.Image size={60} source={{ uri: user.photoUrl }} />
          ) : (
            <Avatar.Text
              size={60}
              label={user?.displayName?.charAt(0) || 'U'}
              style={{ backgroundColor: COLORS.primary }}
            />
          )}
          <View style={styles.profileInfo}>
            <Text variant="titleLarge">{user?.displayName || 'User'}</Text>
            <Text variant="bodyMedium" style={styles.email}>
              {user?.email}
            </Text>
            <View style={styles.providerBadge}>
              <MaterialCommunityIcons
                name={getProviderIcon()}
                size={16}
                color={COLORS.gray600}
              />
              <Text variant="bodySmall" style={styles.providerText}>
                Signed in with {user?.provider}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Settings Section */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        SETTINGS
      </Text>
      <Card style={styles.menuCard}>
        <List.Item
          title="App Settings"
          description="Preferences, defaults, notifications"
          left={(props) => <List.Icon {...props} icon="cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Settings')}
        />
        <Divider />
        <List.Item
          title="Vehicles"
          description="Manage your vehicles for mileage tracking"
          left={(props) => <List.Icon {...props} icon="car" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Vehicles', 'Vehicle management coming soon!')}
        />
        <Divider />
        <List.Item
          title="Categories & Tags"
          description="Customize time entry categories"
          left={(props) => <List.Icon {...props} icon="tag" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Categories', 'Category management coming soon!')}
        />
      </Card>

      {/* Data Section */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        DATA
      </Text>
      <Card style={styles.menuCard}>
        <List.Item
          title="Export Data"
          description="Export time and mileage data"
          left={(props) => <List.Icon {...props} icon="export" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleExportData}
        />
        <Divider />
        <List.Item
          title="Sync Status"
          description="Last synced: Never"
          left={(props) => <List.Icon {...props} icon="cloud-sync" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Sync', 'Cloud sync coming soon!')}
        />
        <Divider />
        <List.Item
          title="Backup & Restore"
          description="Backup your data to the cloud"
          left={(props) => <List.Icon {...props} icon="backup-restore" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Backup', 'Backup feature coming soon!')}
        />
      </Card>

      {/* Reports Section */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        REPORTS
      </Text>
      <Card style={styles.menuCard}>
        <List.Item
          title="Time Summary"
          description="View time tracking reports"
          left={(props) => <List.Icon {...props} icon="clock-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Reports', 'Time reports coming soon!')}
        />
        <Divider />
        <List.Item
          title="Mileage Summary"
          description="View mileage and reimbursement reports"
          left={(props) => <List.Icon {...props} icon="map-marker-distance" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Reports', 'Mileage reports coming soon!')}
        />
        <Divider />
        <List.Item
          title="IRS Mileage Log"
          description="Generate IRS-compliant mileage logs"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Reports', 'IRS log generation coming soon!')}
        />
      </Card>

      {/* Support Section */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        SUPPORT
      </Text>
      <Card style={styles.menuCard}>
        <List.Item
          title="Help Center"
          description="Get help using the app"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Linking.openURL('https://help.kcapp.com')}
        />
        <Divider />
        <List.Item
          title="Contact Support"
          description="Email us for assistance"
          left={(props) => <List.Icon {...props} icon="email" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Linking.openURL(`mailto:${APP_CONFIG.supportEmail}`)}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Linking.openURL('https://kcapp.com/privacy')}
        />
        <Divider />
        <List.Item
          title="Terms of Service"
          left={(props) => <List.Icon {...props} icon="file-document-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Linking.openURL('https://kcapp.com/terms')}
        />
      </Card>

      {/* Account Section */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        ACCOUNT
      </Text>
      <Card style={styles.menuCard}>
        <List.Item
          title="Sign Out"
          titleStyle={{ color: COLORS.error }}
          left={(props) => <List.Icon {...props} icon="logout" color={COLORS.error} />}
          onPress={handleLogout}
        />
      </Card>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text variant="bodySmall" style={styles.appInfoText}>
          {APP_CONFIG.appName} v{APP_CONFIG.version}
        </Text>
        <Text variant="bodySmall" style={styles.appInfoText}>
          Made with ❤️ for CPAs
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  profileCard: {
    margin: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  email: {
    color: COLORS.gray600,
    marginTop: 2,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  providerText: {
    color: COLORS.gray600,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    color: COLORS.gray500,
    letterSpacing: 1,
  },
  menuCard: {
    marginHorizontal: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    color: COLORS.gray500,
    marginVertical: 2,
  },
});
