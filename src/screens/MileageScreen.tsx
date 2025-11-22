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
  Chip,
  Searchbar,
  Button,
  Portal,
  Dialog,
  TextInput,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMileageStore } from '../store/mileageStore';
import { useClientStore } from '../store/clientStore';
import { LocationService } from '../services/location';
import { MileageEntry, MileagePurpose, RootStackParamList, Location } from '../types';
import { COLORS, IRS_MILEAGE_RATES } from '../config/constants';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MileageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    entries,
    activeEntry,
    isTracking,
    loadEntries,
    startTracking,
    stopTracking,
    cancelTracking,
    updateLocation,
    getTotalReimbursement,
  } = useMileageStore();
  const { clients, loadClients, getClientById } = useClientStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [tripDescription, setTripDescription] = useState('');
  const [tripPurpose, setTripPurpose] = useState<MileagePurpose>('business');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  useEffect(() => {
    loadEntries();
    loadClients();
    checkPermissions();
  }, []);

  useEffect(() => {
    // Start location tracking if there's an active entry
    if (isTracking && activeEntry) {
      startLocationTracking();
    }
    return () => {
      LocationService.stopForegroundTracking();
    };
  }, [isTracking]);

  const checkPermissions = async () => {
    const permissions = await LocationService.checkPermissions();
    if (!permissions.foreground) {
      const granted = await LocationService.requestPermissions();
      if (!granted.foreground) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to track mileage.'
        );
      }
    }
  };

  const startLocationTracking = async () => {
    await LocationService.startForegroundTracking((location) => {
      updateLocation(location);
      setCurrentLocation(location);
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleStartTrip = async () => {
    if (!tripDescription.trim()) {
      Alert.alert('Error', 'Please enter a trip description');
      return;
    }

    setIsStartingTrip(true);
    try {
      const startLocation = await LocationService.getCurrentLocation();
      await startTracking(
        tripDescription.trim(),
        tripPurpose,
        startLocation,
        selectedClientId || undefined
      );
      setShowStartDialog(false);
      setTripDescription('');
      setSelectedClientId(null);
      await startLocationTracking();
    } catch (error) {
      Alert.alert('Error', 'Failed to start trip. Please check location permissions.');
    } finally {
      setIsStartingTrip(false);
    }
  };

  const handleStopTrip = async () => {
    Alert.alert(
      'End Trip',
      'Are you sure you want to end this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          onPress: async () => {
            try {
              const endLocation = await LocationService.getCurrentLocation();
              await stopTracking(endLocation);
              LocationService.stopForegroundTracking();
            } catch (error) {
              Alert.alert('Error', 'Failed to end trip');
            }
          },
        },
      ]
    );
  };

  const handleCancelTrip = async () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip? All data will be lost.',
      [
        { text: 'Keep Tracking', style: 'cancel' },
        {
          text: 'Cancel Trip',
          style: 'destructive',
          onPress: async () => {
            await cancelTracking();
            LocationService.stopForegroundTracking();
          },
        },
      ]
    );
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.clientId &&
        getClientById(entry.clientId)?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch && entry.status !== 'cancelled';
  });

  const totalReimbursement = getTotalReimbursement();

  const renderMileageEntry = ({ item }: { item: MileageEntry }) => {
    const client = item.clientId ? getClientById(item.clientId) : null;
    const isActive = item.id === activeEntry?.id;
    const reimbursement = item.distanceMiles * item.reimbursementRate;

    return (
      <Card
        style={[styles.entryCard, isActive && styles.activeEntryCard]}
        onPress={() => navigation.navigate('MileageDetail', { entryId: item.id })}
      >
        <Card.Content>
          <View style={styles.entryHeader}>
            <View style={styles.entryTitleContainer}>
              <Text variant="titleMedium" numberOfLines={1}>
                {item.description}
              </Text>
              {client && (
                <Text variant="bodySmall" style={styles.clientName}>
                  {client.name}
                </Text>
              )}
            </View>
            <View style={styles.entryDistance}>
              <Text variant="titleMedium">{item.distanceMiles.toFixed(1)} mi</Text>
              <Text variant="bodySmall" style={styles.reimbursement}>
                ${reimbursement.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.entryFooter}>
            <Text variant="bodySmall" style={styles.entryDate}>
              {format(new Date(item.startTime), 'MMM d, yyyy • h:mm a')}
            </Text>
            <View style={styles.entryChips}>
              <Chip compact style={styles.purposeChip}>
                {item.purpose.charAt(0).toUpperCase() + item.purpose.slice(1)}
              </Chip>
              {isActive && (
                <Chip
                  compact
                  style={[styles.chip, { backgroundColor: COLORS.success }]}
                  textStyle={{ color: '#fff' }}
                >
                  Tracking
                </Chip>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Active Trip Banner */}
      {isTracking && activeEntry && (
        <Card style={styles.activeTripBanner}>
          <Card.Content>
            <View style={styles.activeTripHeader}>
              <MaterialCommunityIcons name="car" size={32} color={COLORS.success} />
              <View style={styles.activeTripInfo}>
                <Text variant="titleMedium">{activeEntry.description}</Text>
                <Text variant="headlineMedium" style={styles.activeTripDistance}>
                  {activeEntry.distanceMiles.toFixed(2)} miles
                </Text>
              </View>
            </View>
            {currentLocation?.address && (
              <Text variant="bodySmall" style={styles.currentAddress}>
                Current: {currentLocation.address}
              </Text>
            )}
            <View style={styles.activeTripActions}>
              <Button
                mode="outlined"
                icon="close"
                onPress={handleCancelTrip}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                icon="flag-checkered"
                onPress={handleStopTrip}
                style={styles.endButton}
              >
                End Trip
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Card.Content style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Total Miles
            </Text>
            <Text variant="titleLarge" style={styles.summaryValue}>
              {entries
                .filter((e) => e.status === 'completed')
                .reduce((sum, e) => sum + e.distanceMiles, 0)
                .toFixed(1)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Reimbursement
            </Text>
            <Text variant="titleLarge" style={styles.summaryValue}>
              ${totalReimbursement.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Total Trips
            </Text>
            <Text variant="titleLarge" style={styles.summaryValue}>
              {entries.filter((e) => e.status === 'completed').length}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search trips..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Entries List */}
      <FlatList
        data={filteredEntries}
        renderItem={renderMileageEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="car" size={64} color={COLORS.gray400} />
            <Text variant="titleMedium" style={styles.emptyText}>
              No trips recorded yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to start tracking a trip
            </Text>
          </View>
        }
      />

      {/* FAB */}
      {!isTracking && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setShowStartDialog(true)}
        />
      )}

      {/* Start Trip Dialog */}
      <Portal>
        <Dialog visible={showStartDialog} onDismiss={() => setShowStartDialog(false)}>
          <Dialog.Title>Start New Trip</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Trip Description"
              value={tripDescription}
              onChangeText={setTripDescription}
              mode="outlined"
              style={styles.dialogInput}
              placeholder="e.g., Client meeting downtown"
            />

            <Text variant="bodyMedium" style={styles.dialogLabel}>
              Purpose
            </Text>
            <RadioButton.Group
              value={tripPurpose}
              onValueChange={(value) => setTripPurpose(value as MileagePurpose)}
            >
              <View style={styles.radioRow}>
                <RadioButton.Item
                  label={`Business (${IRS_MILEAGE_RATES.business * 100}¢/mi)`}
                  value="business"
                  style={styles.radioItem}
                />
              </View>
              <View style={styles.radioRow}>
                <RadioButton.Item
                  label={`Medical (${IRS_MILEAGE_RATES.medical * 100}¢/mi)`}
                  value="medical"
                  style={styles.radioItem}
                />
              </View>
              <View style={styles.radioRow}>
                <RadioButton.Item
                  label={`Charity (${IRS_MILEAGE_RATES.charity * 100}¢/mi)`}
                  value="charity"
                  style={styles.radioItem}
                />
              </View>
            </RadioButton.Group>

            <Text variant="bodyMedium" style={styles.dialogLabel}>
              Assign to Client (Optional)
            </Text>
            <View style={styles.clientChips}>
              {clients.filter((c) => c.isActive).map((client) => (
                <Chip
                  key={client.id}
                  selected={selectedClientId === client.id}
                  onPress={() =>
                    setSelectedClientId(selectedClientId === client.id ? null : client.id)
                  }
                  style={styles.clientChip}
                >
                  {client.name}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowStartDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleStartTrip}
              disabled={isStartingTrip}
              icon={isStartingTrip ? () => <ActivityIndicator size={16} color="#fff" /> : 'car'}
            >
              {isStartingTrip ? 'Starting...' : 'Start Trip'}
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
  activeTripBanner: {
    margin: 16,
    backgroundColor: '#e6ffed',
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTripInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activeTripDistance: {
    fontWeight: '700',
    color: COLORS.success,
  },
  currentAddress: {
    color: COLORS.gray600,
    marginTop: 8,
  },
  activeTripActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    borderColor: COLORS.gray400,
  },
  endButton: {
    backgroundColor: COLORS.success,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: COLORS.gray500,
  },
  summaryValue: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gray300,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  entryCard: {
    marginBottom: 12,
  },
  activeEntryCard: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  clientName: {
    color: COLORS.gray500,
    marginTop: 4,
  },
  entryDistance: {
    alignItems: 'flex-end',
  },
  reimbursement: {
    color: COLORS.success,
    fontWeight: '600',
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  entryDate: {
    color: COLORS.gray500,
  },
  entryChips: {
    flexDirection: 'row',
    gap: 8,
  },
  purposeChip: {
    height: 24,
  },
  chip: {
    height: 24,
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
    backgroundColor: COLORS.secondary,
  },
  dialogInput: {
    marginBottom: 16,
  },
  dialogLabel: {
    marginBottom: 8,
    marginTop: 8,
    color: COLORS.gray600,
  },
  radioRow: {
    marginVertical: -8,
  },
  radioItem: {
    paddingVertical: 0,
  },
  clientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clientChip: {
    marginBottom: 4,
  },
});
