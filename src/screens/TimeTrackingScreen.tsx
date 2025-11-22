import React, { useEffect, useState, useCallback } from 'react';
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
  SegmentedButtons,
  Button,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTimeStore } from '../store/timeStore';
import { useClientStore } from '../store/clientStore';
import { TimeEntry, RootStackParamList } from '../types';
import { COLORS } from '../config/constants';
import { format, differenceInSeconds } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function TimeTrackingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    entries,
    activeEntry,
    loadEntries,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    deleteEntry,
  } = useTimeStore();
  const { clients, loadClients, getClientById } = useClientStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showQuickStartDialog, setShowQuickStartDialog] = useState(false);
  const [quickStartDescription, setQuickStartDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    loadEntries();
    loadClients();
  }, []);

  // Timer for active entry display
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEntry?.status === 'running') {
      interval = setInterval(() => {
        const start = new Date(activeEntry.startTime);
        const now = new Date();
        const elapsed = differenceInSeconds(now, start) + (activeEntry.durationMinutes || 0) * 60;
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickStart = async () => {
    if (!quickStartDescription.trim() || !selectedClientId) {
      Alert.alert('Error', 'Please enter a description and select a client');
      return;
    }
    try {
      await startTimer(selectedClientId, quickStartDescription.trim());
      setShowQuickStartDialog(false);
      setQuickStartDescription('');
      setSelectedClientId(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    Alert.alert(
      'Stop Timer',
      'Are you sure you want to stop the current timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          onPress: async () => {
            await stopTimer();
          },
        },
      ]
    );
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientById(entry.clientId)?.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'billable') return matchesSearch && entry.billable;
    if (filter === 'nonbillable') return matchesSearch && !entry.billable;
    return matchesSearch;
  });

  const renderTimeEntry = ({ item }: { item: TimeEntry }) => {
    const client = getClientById(item.clientId);
    const isActive = item.id === activeEntry?.id;

    return (
      <Card
        style={[styles.entryCard, isActive && styles.activeEntryCard]}
        onPress={() => navigation.navigate('TimeEntryDetail', { entryId: item.id })}
      >
        <Card.Content>
          <View style={styles.entryHeader}>
            <View style={styles.entryTitleContainer}>
              <Text variant="titleMedium" numberOfLines={1}>
                {item.description}
              </Text>
              <Text variant="bodySmall" style={styles.clientName}>
                {client?.name || 'Unknown Client'}
              </Text>
            </View>
            <View style={styles.entryDuration}>
              {isActive ? (
                <Text variant="titleMedium" style={styles.activeTime}>
                  {formatElapsedTime(elapsedTime)}
                </Text>
              ) : (
                <Text variant="titleMedium">
                  {formatDuration(item.durationMinutes || 0)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.entryFooter}>
            <Text variant="bodySmall" style={styles.entryDate}>
              {format(new Date(item.startTime), 'MMM d, yyyy • h:mm a')}
            </Text>
            <View style={styles.entryChips}>
              {item.billable && (
                <Chip compact style={styles.chip}>
                  Billable
                </Chip>
              )}
              {isActive && (
                <Chip
                  compact
                  style={[styles.chip, { backgroundColor: COLORS.success }]}
                  textStyle={{ color: '#fff' }}
                >
                  {item.status === 'running' ? 'Running' : 'Paused'}
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
      {/* Active Timer Banner */}
      {activeEntry && (
        <Card style={styles.activeTimerBanner}>
          <Card.Content>
            <View style={styles.activeTimerContent}>
              <View style={styles.activeTimerInfo}>
                <MaterialCommunityIcons
                  name={activeEntry.status === 'running' ? 'clock-outline' : 'pause-circle'}
                  size={32}
                  color={COLORS.primary}
                />
                <View style={styles.activeTimerText}>
                  <Text variant="titleMedium">{activeEntry.description}</Text>
                  <Text variant="headlineMedium" style={styles.activeTimerDisplay}>
                    {formatElapsedTime(elapsedTime)}
                  </Text>
                </View>
              </View>
              <View style={styles.activeTimerActions}>
                {activeEntry.status === 'running' ? (
                  <Button
                    mode="outlined"
                    icon="pause"
                    onPress={pauseTimer}
                    compact
                  >
                    Pause
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    icon="play"
                    onPress={resumeTimer}
                    compact
                  >
                    Resume
                  </Button>
                )}
                <Button
                  mode="contained"
                  icon="stop"
                  onPress={handleStopTimer}
                  compact
                  style={styles.stopButton}
                >
                  Stop
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search entries..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'billable', label: 'Billable' },
            { value: 'nonbillable', label: 'Non-Billable' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Entries List */}
      <FlatList
        data={filteredEntries}
        renderItem={renderTimeEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={64}
              color={COLORS.gray400}
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              No time entries yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to log your first time entry
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          if (!activeEntry) {
            setShowQuickStartDialog(true);
          } else {
            navigation.navigate('TimeEntryDetail', {});
          }
        }}
      />

      {/* Quick Start Dialog */}
      <Portal>
        <Dialog visible={showQuickStartDialog} onDismiss={() => setShowQuickStartDialog(false)}>
          <Dialog.Title>Start Timer</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="What are you working on?"
              value={quickStartDescription}
              onChangeText={setQuickStartDescription}
              mode="outlined"
              style={styles.dialogInput}
            />
            <Text variant="bodyMedium" style={styles.dialogLabel}>
              Select Client
            </Text>
            <View style={styles.clientChips}>
              {clients.filter((c) => c.isActive).map((client) => (
                <Chip
                  key={client.id}
                  selected={selectedClientId === client.id}
                  onPress={() => setSelectedClientId(client.id)}
                  style={styles.clientChip}
                >
                  {client.name}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowQuickStartDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleQuickStart}>
              Start
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
  activeTimerBanner: {
    margin: 16,
    backgroundColor: '#e6f0ff',
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  activeTimerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeTimerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeTimerText: {
    marginLeft: 12,
    flex: 1,
  },
  activeTimerDisplay: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  activeTimerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchbar: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginTop: 8,
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
  entryDuration: {
    alignItems: 'flex-end',
  },
  activeTime: {
    color: COLORS.success,
    fontWeight: '700',
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
    backgroundColor: COLORS.primary,
  },
  dialogInput: {
    marginBottom: 16,
  },
  dialogLabel: {
    marginBottom: 8,
    color: COLORS.gray600,
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
