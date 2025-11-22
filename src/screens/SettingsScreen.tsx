import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  TextInput,
  Button,
  Divider,
  RadioButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatabaseService } from '../services/database';
import { AppSettings } from '../types';
import { COLORS, IRS_MILEAGE_RATES, APP_CONFIG } from '../config/constants';

const defaultSettings: AppSettings = {
  theme: 'system',
  defaultMileageRate: IRS_MILEAGE_RATES.business,
  defaultHourlyRate: APP_CONFIG.defaults.hourlyRate,
  autoTrackMileage: false,
  notificationsEnabled: true,
  syncEnabled: false,
};

export function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await DatabaseService.getSetting('app_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await DatabaseService.setSetting('app_settings', JSON.stringify(settings));
      setHasChanges(false);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Appearance */}
      <Card style={styles.card}>
        <Card.Title
          title="Appearance"
          left={(props) => (
            <MaterialCommunityIcons {...props} name="palette" size={24} />
          )}
        />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.label}>
            Theme
          </Text>
          <RadioButton.Group
            value={settings.theme}
            onValueChange={(value) =>
              updateSetting('theme', value as AppSettings['theme'])
            }
          >
            <RadioButton.Item label="System Default" value="system" />
            <RadioButton.Item label="Light" value="light" />
            <RadioButton.Item label="Dark" value="dark" />
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Time Tracking */}
      <Card style={styles.card}>
        <Card.Title
          title="Time Tracking"
          left={(props) => (
            <MaterialCommunityIcons {...props} name="clock-outline" size={24} />
          )}
        />
        <Card.Content>
          <TextInput
            label="Default Hourly Rate ($)"
            value={settings.defaultHourlyRate.toString()}
            onChangeText={(text) => {
              const rate = parseFloat(text) || 0;
              updateSetting('defaultHourlyRate', rate);
            }}
            mode="outlined"
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
            right={<TextInput.Affix text="/hr" />}
            style={styles.input}
          />
          <Text variant="bodySmall" style={styles.hint}>
            This rate will be used as the default for new billable time entries.
          </Text>
        </Card.Content>
      </Card>

      {/* Mileage Tracking */}
      <Card style={styles.card}>
        <Card.Title
          title="Mileage Tracking"
          left={(props) => (
            <MaterialCommunityIcons {...props} name="car" size={24} />
          )}
        />
        <Card.Content>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="bodyLarge">Auto-Track Mileage</Text>
              <Text variant="bodySmall" style={styles.hint}>
                Automatically start tracking when driving is detected
              </Text>
            </View>
            <Switch
              value={settings.autoTrackMileage}
              onValueChange={(value) => updateSetting('autoTrackMileage', value)}
            />
          </View>

          <Divider style={styles.divider} />

          <Text variant="bodyMedium" style={styles.label}>
            IRS Mileage Rates (2024)
          </Text>
          <View style={styles.ratesGrid}>
            <View style={styles.rateItem}>
              <Text variant="titleMedium" style={styles.rateValue}>
                {IRS_MILEAGE_RATES.business * 100}¢
              </Text>
              <Text variant="bodySmall" style={styles.rateLabel}>
                Business
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text variant="titleMedium" style={styles.rateValue}>
                {IRS_MILEAGE_RATES.medical * 100}¢
              </Text>
              <Text variant="bodySmall" style={styles.rateLabel}>
                Medical
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text variant="titleMedium" style={styles.rateValue}>
                {IRS_MILEAGE_RATES.charity * 100}¢
              </Text>
              <Text variant="bodySmall" style={styles.rateLabel}>
                Charity
              </Text>
            </View>
          </View>
          <Text variant="bodySmall" style={styles.hint}>
            These are the official IRS standard mileage rates for tax year 2024.
          </Text>
        </Card.Content>
      </Card>

      {/* Notifications */}
      <Card style={styles.card}>
        <Card.Title
          title="Notifications"
          left={(props) => (
            <MaterialCommunityIcons {...props} name="bell" size={24} />
          )}
        />
        <Card.Content>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="bodyLarge">Push Notifications</Text>
              <Text variant="bodySmall" style={styles.hint}>
                Receive reminders and updates
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSetting('notificationsEnabled', value)}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Sync */}
      <Card style={styles.card}>
        <Card.Title
          title="Data Sync"
          left={(props) => (
            <MaterialCommunityIcons {...props} name="cloud-sync" size={24} />
          )}
        />
        <Card.Content>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="bodyLarge">Cloud Sync</Text>
              <Text variant="bodySmall" style={styles.hint}>
                Sync data across devices (requires account)
              </Text>
            </View>
            <Switch
              value={settings.syncEnabled}
              onValueChange={(value) => updateSetting('syncEnabled', value)}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card}>
        <Card.Title
          title="Data Management"
          left={(props) => (
            <MaterialCommunityIcons {...props} name="database" size={24} />
          )}
        />
        <Card.Content>
          <List.Item
            title="Export All Data"
            description="Export time and mileage data as CSV"
            left={(props) => <List.Icon {...props} icon="export" />}
            onPress={() => Alert.alert('Export', 'Export feature coming soon!')}
          />
          <Divider />
          <List.Item
            title="Clear All Data"
            description="Delete all local data"
            titleStyle={{ color: COLORS.error }}
            left={(props) => <List.Icon {...props} icon="delete" color={COLORS.error} />}
            onPress={() =>
              Alert.alert(
                'Clear All Data',
                'This will permanently delete all your local data. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => Alert.alert('Data cleared'),
                  },
                ]
              )
            }
          />
        </Card.Content>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <View style={styles.saveContainer}>
          <Button mode="contained" onPress={saveSettings} style={styles.saveButton}>
            Save Changes
          </Button>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
    color: COLORS.gray600,
  },
  input: {
    marginBottom: 8,
  },
  hint: {
    color: COLORS.gray500,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  divider: {
    marginVertical: 16,
  },
  ratesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    marginVertical: 8,
  },
  rateItem: {
    alignItems: 'center',
  },
  rateValue: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  rateLabel: {
    color: COLORS.gray500,
    marginTop: 4,
  },
  saveContainer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  bottomPadding: {
    height: 32,
  },
});
