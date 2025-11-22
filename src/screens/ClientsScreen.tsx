import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  FAB,
  Searchbar,
  Avatar,
  IconButton,
  Portal,
  Dialog,
  TextInput,
  Button,
  Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useClientStore } from '../store/clientStore';
import { useTimeStore } from '../store/timeStore';
import { useMileageStore } from '../store/mileageStore';
import { Client, RootStackParamList } from '../types';
import { COLORS } from '../config/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ClientsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { clients, loadClients, addClient, deleteClient } = useClientStore();
  const { getTotalTimeForClient } = useTimeStore();
  const { getTotalMileageForClient } = useMileageStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const handleAddClient = async () => {
    if (!newClient.name.trim()) {
      Alert.alert('Error', 'Please enter a client name');
      return;
    }

    try {
      await addClient({
        name: newClient.name.trim(),
        email: newClient.email.trim() || undefined,
        phone: newClient.phone.trim() || undefined,
        address: newClient.address.trim() || undefined,
        isActive: true,
      });
      setShowAddDialog(false);
      setNewClient({ name: '', email: '', phone: '', address: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to add client');
    }
  };

  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete "${client.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(client.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete client');
            }
          },
        },
      ]
    );
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = showInactive || client.isActive;
    return matchesSearch && matchesActive;
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const renderClient = ({ item }: { item: Client }) => {
    const totalTime = getTotalTimeForClient(item.id);
    const totalMileage = getTotalMileageForClient(item.id);
    const initials = item.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <Card
        style={[styles.clientCard, !item.isActive && styles.inactiveCard]}
        onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
      >
        <Card.Content style={styles.clientContent}>
          <Avatar.Text
            size={50}
            label={initials}
            style={[
              styles.avatar,
              { backgroundColor: item.isActive ? COLORS.primary : COLORS.gray400 },
            ]}
          />
          <View style={styles.clientInfo}>
            <Text variant="titleMedium" style={!item.isActive && styles.inactiveText}>
              {item.name}
            </Text>
            {item.email && (
              <Text variant="bodySmall" style={styles.clientEmail}>
                {item.email}
              </Text>
            )}
            <View style={styles.clientStats}>
              <View style={styles.stat}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color={COLORS.gray500}
                />
                <Text variant="bodySmall" style={styles.statText}>
                  {formatDuration(totalTime)}
                </Text>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="car" size={14} color={COLORS.gray500} />
                <Text variant="bodySmall" style={styles.statText}>
                  {totalMileage.toFixed(1)} mi
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.clientActions}>
            {(item.oneDriveFolderUrl || item.googleDriveFolderUrl) && (
              <IconButton
                icon="folder"
                size={20}
                onPress={() =>
                  navigation.navigate('CloudFolder', {
                    clientId: item.id,
                    provider: item.oneDriveFolderUrl ? 'onedrive' : 'googledrive',
                  })
                }
              />
            )}
            {item.reportUrl && (
              <IconButton
                icon="chart-bar"
                size={20}
                onPress={() =>
                  navigation.navigate('Report', {
                    clientId: item.id,
                    reportUrl: item.reportUrl!,
                  })
                }
              />
            )}
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search clients..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          <Text variant="bodyMedium">Show inactive clients</Text>
          <Switch value={showInactive} onValueChange={setShowInactive} />
        </View>
      </View>

      {/* Clients List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-group"
              size={64}
              color={COLORS.gray400}
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              No clients yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to add your first client
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddDialog(true)}
      />

      {/* Add Client Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Client</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Client Name *"
              value={newClient.name}
              onChangeText={(text) => setNewClient({ ...newClient, name: text })}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Email"
              value={newClient.email}
              onChangeText={(text) => setNewClient({ ...newClient, email: text })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.dialogInput}
            />
            <TextInput
              label="Phone"
              value={newClient.phone}
              onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.dialogInput}
            />
            <TextInput
              label="Address"
              value={newClient.address}
              onChangeText={(text) => setNewClient({ ...newClient, address: text })}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddClient}>
              Add Client
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchbar: {
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  listContent: {
    padding: 16,
  },
  clientCard: {
    marginBottom: 12,
  },
  inactiveCard: {
    opacity: 0.7,
  },
  clientContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  inactiveText: {
    color: COLORS.gray500,
  },
  clientEmail: {
    color: COLORS.gray500,
    marginTop: 2,
  },
  clientStats: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: COLORS.gray500,
  },
  clientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
  },
  dialogInput: {
    marginBottom: 12,
  },
});
