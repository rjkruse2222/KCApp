import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  TextInput,
  Divider,
  List,
  IconButton,
  Switch,
  Portal,
  Dialog,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useClientStore } from '../store/clientStore';
import { useTimeStore } from '../store/timeStore';
import { useMileageStore } from '../store/mileageStore';
import { RootStackParamList, ReportType } from '../types';
import { COLORS } from '../config/constants';

type RouteProps = RouteProp<RootStackParamList, 'ClientDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ClientDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { clientId } = route.params;

  const { getClientById, updateClient, deleteClient } = useClientStore();
  const { getEntriesForClient: getTimeEntries, getTotalTimeForClient } = useTimeStore();
  const { getEntriesForClient: getMileageEntries, getTotalMileageForClient } = useMileageStore();

  const client = getClientById(clientId);
  const timeEntries = getTimeEntries(clientId);
  const mileageEntries = getMileageEntries(clientId);
  const totalTime = getTotalTimeForClient(clientId);
  const totalMileage = getTotalMileageForClient(clientId);

  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(client);
  const [showCloudDialog, setShowCloudDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [cloudProvider, setCloudProvider] = useState<'onedrive' | 'googledrive'>('onedrive');
  const [folderUrl, setFolderUrl] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [reportType, setReportType] = useState<ReportType>('powerbi');

  useEffect(() => {
    if (client) {
      setEditedClient(client);
    }
  }, [client]);

  if (!client || !editedClient) {
    return (
      <View style={styles.container}>
        <Text>Client not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      await updateClient(clientId, editedClient);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update client');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete "${client.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(clientId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete client');
            }
          },
        },
      ]
    );
  };

  const handleAddCloudFolder = async () => {
    if (!folderUrl.trim()) {
      Alert.alert('Error', 'Please enter a folder URL');
      return;
    }

    try {
      // Extract folder ID from URL based on provider
      let folderId = '';
      if (cloudProvider === 'googledrive') {
        // Google Drive folder URL format: https://drive.google.com/drive/folders/FOLDER_ID
        const match = folderUrl.match(/folders\/([^/?]+)/);
        folderId = match ? match[1] : '';
        await updateClient(clientId, {
          googleDriveFolderId: folderId,
          googleDriveFolderUrl: folderUrl.trim(),
        });
      } else {
        // OneDrive folder URL format varies, store the full URL
        await updateClient(clientId, {
          oneDriveFolderId: folderUrl.trim(), // Will need to extract ID via API
          oneDriveFolderUrl: folderUrl.trim(),
        });
      }
      setShowCloudDialog(false);
      setFolderUrl('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add cloud folder');
    }
  };

  const handleAddReport = async () => {
    if (!reportUrl.trim()) {
      Alert.alert('Error', 'Please enter a report URL');
      return;
    }

    try {
      await updateClient(clientId, {
        reportUrl: reportUrl.trim(),
        reportType,
      });
      setShowReportDialog(false);
      setReportUrl('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add report');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={initials}
            style={{ backgroundColor: client.isActive ? COLORS.primary : COLORS.gray400 }}
          />
          <View style={styles.headerInfo}>
            {isEditing ? (
              <TextInput
                value={editedClient.name}
                onChangeText={(text) =>
                  setEditedClient({ ...editedClient, name: text })
                }
                mode="outlined"
                dense
                style={styles.editInput}
              />
            ) : (
              <Text variant="headlineSmall" style={styles.clientName}>
                {client.name}
              </Text>
            )}
            <View style={styles.activeSwitch}>
              <Text variant="bodyMedium">Active</Text>
              <Switch
                value={editedClient.isActive}
                onValueChange={(value) =>
                  setEditedClient({ ...editedClient, isActive: value })
                }
                disabled={!isEditing}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Card */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text variant="titleLarge" style={styles.statValue}>
              {formatDuration(totalTime)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Time
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="car" size={24} color={COLORS.secondary} />
            <Text variant="titleLarge" style={styles.statValue}>
              {totalMileage.toFixed(1)} mi
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Mileage
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="file-document"
              size={24}
              color={COLORS.accent}
            />
            <Text variant="titleLarge" style={styles.statValue}>
              {timeEntries.length + mileageEntries.length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Entries
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Contact Info */}
      <Card style={styles.sectionCard}>
        <Card.Title title="Contact Information" />
        <Card.Content>
          {isEditing ? (
            <>
              <TextInput
                label="Email"
                value={editedClient.email || ''}
                onChangeText={(text) =>
                  setEditedClient({ ...editedClient, email: text })
                }
                mode="outlined"
                keyboardType="email-address"
                style={styles.editInput}
              />
              <TextInput
                label="Phone"
                value={editedClient.phone || ''}
                onChangeText={(text) =>
                  setEditedClient({ ...editedClient, phone: text })
                }
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.editInput}
              />
              <TextInput
                label="Address"
                value={editedClient.address || ''}
                onChangeText={(text) =>
                  setEditedClient({ ...editedClient, address: text })
                }
                mode="outlined"
                multiline
                style={styles.editInput}
              />
            </>
          ) : (
            <>
              {client.email && (
                <List.Item
                  title={client.email}
                  left={(props) => <List.Icon {...props} icon="email" />}
                  onPress={() => Linking.openURL(`mailto:${client.email}`)}
                />
              )}
              {client.phone && (
                <List.Item
                  title={client.phone}
                  left={(props) => <List.Icon {...props} icon="phone" />}
                  onPress={() => Linking.openURL(`tel:${client.phone}`)}
                />
              )}
              {client.address && (
                <List.Item
                  title={client.address}
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                  titleNumberOfLines={2}
                />
              )}
              {!client.email && !client.phone && !client.address && (
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No contact information added
                </Text>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* Cloud Storage */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="Cloud Storage"
          right={() => (
            <IconButton
              icon="plus"
              onPress={() => setShowCloudDialog(true)}
            />
          )}
        />
        <Card.Content>
          {client.googleDriveFolderUrl && (
            <List.Item
              title="Google Drive"
              description="Connected folder"
              left={(props) => (
                <List.Icon {...props} icon="google-drive" color="#4285F4" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                navigation.navigate('CloudFolder', {
                  clientId,
                  provider: 'googledrive',
                })
              }
            />
          )}
          {client.oneDriveFolderUrl && (
            <List.Item
              title="OneDrive"
              description="Connected folder"
              left={(props) => (
                <List.Icon {...props} icon="microsoft-onedrive" color="#0078D4" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                navigation.navigate('CloudFolder', {
                  clientId,
                  provider: 'onedrive',
                })
              }
            />
          )}
          {!client.googleDriveFolderUrl && !client.oneDriveFolderUrl && (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No cloud folders connected
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Reports */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="Reports"
          right={() => (
            <IconButton
              icon="plus"
              onPress={() => setShowReportDialog(true)}
            />
          )}
        />
        <Card.Content>
          {client.reportUrl ? (
            <List.Item
              title={client.reportType?.toUpperCase() || 'Custom Report'}
              description={client.reportUrl}
              descriptionNumberOfLines={1}
              left={(props) => <List.Icon {...props} icon="chart-bar" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                navigation.navigate('Report', {
                  clientId,
                  reportUrl: client.reportUrl!,
                })
              }
            />
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No reports configured
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Notes */}
      <Card style={styles.sectionCard}>
        <Card.Title title="Notes" />
        <Card.Content>
          {isEditing ? (
            <TextInput
              value={editedClient.notes || ''}
              onChangeText={(text) =>
                setEditedClient({ ...editedClient, notes: text })
              }
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.editInput}
            />
          ) : (
            <Text variant="bodyMedium" style={client.notes ? {} : styles.emptyText}>
              {client.notes || 'No notes added'}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        {isEditing ? (
          <>
            <Button
              mode="outlined"
              onPress={() => {
                setEditedClient(client);
                setIsEditing(false);
              }}
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.actionButton}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button
              mode="outlined"
              onPress={() => setIsEditing(true)}
              style={styles.actionButton}
              icon="pencil"
            >
              Edit
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              style={[styles.actionButton, styles.deleteButton]}
              icon="delete"
            >
              Delete
            </Button>
          </>
        )}
      </View>

      {/* Cloud Folder Dialog */}
      <Portal>
        <Dialog visible={showCloudDialog} onDismiss={() => setShowCloudDialog(false)}>
          <Dialog.Title>Add Cloud Folder</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={cloudProvider}
              onValueChange={(value) =>
                setCloudProvider(value as 'onedrive' | 'googledrive')
              }
              buttons={[
                { value: 'googledrive', label: 'Google Drive' },
                { value: 'onedrive', label: 'OneDrive' },
              ]}
              style={styles.segmentedButtons}
            />
            <TextInput
              label="Folder URL"
              value={folderUrl}
              onChangeText={setFolderUrl}
              mode="outlined"
              placeholder={
                cloudProvider === 'googledrive'
                  ? 'https://drive.google.com/drive/folders/...'
                  : 'https://onedrive.live.com/...'
              }
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCloudDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddCloudFolder}>
              Add Folder
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Report Dialog */}
        <Dialog visible={showReportDialog} onDismiss={() => setShowReportDialog(false)}>
          <Dialog.Title>Add Report</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
              buttons={[
                { value: 'powerbi', label: 'Power BI' },
                { value: 'looker', label: 'Looker' },
                { value: 'custom', label: 'Custom' },
              ]}
              style={styles.segmentedButtons}
            />
            <TextInput
              label="Report URL"
              value={reportUrl}
              onChangeText={setReportUrl}
              mode="outlined"
              placeholder="https://..."
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowReportDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddReport}>
              Add Report
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  clientName: {
    fontWeight: '600',
  },
  activeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    color: COLORS.gray500,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.gray200,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  emptyText: {
    color: COLORS.gray500,
    fontStyle: 'italic',
  },
  editInput: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  dialogInput: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 24,
  },
});
