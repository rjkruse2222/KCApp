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
  TextInput,
  Button,
  Chip,
  Switch,
  SegmentedButtons,
  Portal,
  Dialog,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTimeStore } from '../store/timeStore';
import { useClientStore } from '../store/clientStore';
import { RootStackParamList, TimeEntry } from '../types';
import { COLORS, APP_CONFIG } from '../config/constants';
import { format } from 'date-fns';

type RouteProps = RouteProp<RootStackParamList, 'TimeEntryDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function TimeEntryDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { entryId, clientId: defaultClientId } = route.params;

  const { entries, addManualEntry, updateEntry, deleteEntry } = useTimeStore();
  const { clients, loadClients } = useClientStore();

  const existingEntry = entryId ? entries.find((e) => e.id === entryId) : null;
  const isNewEntry = !existingEntry;

  const [description, setDescription] = useState(existingEntry?.description || '');
  const [selectedClientId, setSelectedClientId] = useState(
    existingEntry?.clientId || defaultClientId || ''
  );
  const [billable, setBillable] = useState(existingEntry?.billable ?? true);
  const [hourlyRate, setHourlyRate] = useState(
    existingEntry?.hourlyRate?.toString() || APP_CONFIG.defaults.hourlyRate.toString()
  );
  const [notes, setNotes] = useState(existingEntry?.notes || '');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [showClientPicker, setShowClientPicker] = useState(false);

  useEffect(() => {
    loadClients();
    if (existingEntry?.durationMinutes) {
      const h = Math.floor(existingEntry.durationMinutes / 60);
      const m = existingEntry.durationMinutes % 60;
      setHours(h.toString());
      setMinutes(m.toString());
    }
  }, []);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!selectedClientId) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    const durationMinutes = parseInt(hours) * 60 + parseInt(minutes);

    try {
      if (isNewEntry) {
        await addManualEntry({
          clientId: selectedClientId,
          description: description.trim(),
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMinutes,
          billable,
          hourlyRate: billable ? parseFloat(hourlyRate) : undefined,
          notes: notes.trim() || undefined,
          status: 'completed',
        });
      } else {
        await updateEntry(existingEntry!.id, {
          description: description.trim(),
          clientId: selectedClientId,
          durationMinutes,
          billable,
          hourlyRate: billable ? parseFloat(hourlyRate) : undefined,
          notes: notes.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save time entry');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this time entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(existingEntry!.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const calculateAmount = () => {
    if (!billable) return 0;
    const durationMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0');
    const rate = parseFloat(hourlyRate || '0');
    return (durationMinutes / 60) * rate;
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Entry Details" />
        <Card.Content>
          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            placeholder="What did you work on?"
            style={styles.input}
          />

          <Text variant="bodyMedium" style={styles.label}>
            Client *
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowClientPicker(true)}
            style={styles.clientButton}
            contentStyle={styles.clientButtonContent}
          >
            {selectedClient?.name || 'Select a client'}
          </Button>

          <Text variant="bodyMedium" style={styles.label}>
            Duration
          </Text>
          <View style={styles.durationRow}>
            <View style={styles.durationInput}>
              <TextInput
                label="Hours"
                value={hours}
                onChangeText={setHours}
                mode="outlined"
                keyboardType="numeric"
              />
            </View>
            <Text variant="headlineSmall" style={styles.durationSeparator}>
              :
            </Text>
            <View style={styles.durationInput}>
              <TextInput
                label="Minutes"
                value={minutes}
                onChangeText={setMinutes}
                mode="outlined"
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Billing" />
        <Card.Content>
          <View style={styles.switchRow}>
            <Text variant="bodyLarge">Billable</Text>
            <Switch value={billable} onValueChange={setBillable} />
          </View>

          {billable && (
            <>
              <TextInput
                label="Hourly Rate ($)"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                mode="outlined"
                keyboardType="decimal-pad"
                left={<TextInput.Affix text="$" />}
                style={styles.input}
              />
              <View style={styles.amountRow}>
                <Text variant="bodyLarge">Total Amount:</Text>
                <Text variant="titleLarge" style={styles.amount}>
                  ${calculateAmount().toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Notes" />
        <Card.Content>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Add any additional notes..."
          />
        </Card.Content>
      </Card>

      {existingEntry && (
        <Card style={styles.card}>
          <Card.Title title="Entry Info" />
          <Card.Content>
            <Text variant="bodySmall" style={styles.infoText}>
              Created: {format(new Date(existingEntry.createdAt), 'MMM d, yyyy h:mm a')}
            </Text>
            <Text variant="bodySmall" style={styles.infoText}>
              Last Updated: {format(new Date(existingEntry.updatedAt), 'MMM d, yyyy h:mm a')}
            </Text>
            <Text variant="bodySmall" style={styles.infoText}>
              Status: {existingEntry.status}
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.actions}>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.actionButton}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSave} style={styles.actionButton}>
          {isNewEntry ? 'Create Entry' : 'Save Changes'}
        </Button>
      </View>

      {!isNewEntry && (
        <Button
          mode="text"
          onPress={handleDelete}
          textColor={COLORS.error}
          style={styles.deleteButton}
        >
          Delete Entry
        </Button>
      )}

      {/* Client Picker Dialog */}
      <Portal>
        <Dialog visible={showClientPicker} onDismiss={() => setShowClientPicker(false)}>
          <Dialog.Title>Select Client</Dialog.Title>
          <Dialog.Content>
            <View style={styles.clientList}>
              {clients
                .filter((c) => c.isActive)
                .map((client) => (
                  <Chip
                    key={client.id}
                    selected={selectedClientId === client.id}
                    onPress={() => {
                      setSelectedClientId(client.id);
                      setShowClientPicker(false);
                    }}
                    style={styles.clientChip}
                  >
                    {client.name}
                  </Chip>
                ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClientPicker(false)}>Cancel</Button>
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: COLORS.gray600,
  },
  clientButton: {
    marginBottom: 16,
  },
  clientButtonContent: {
    justifyContent: 'flex-start',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  durationInput: {
    flex: 1,
  },
  durationSeparator: {
    marginHorizontal: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: 16,
    borderRadius: 8,
  },
  amount: {
    color: COLORS.success,
    fontWeight: '700',
  },
  infoText: {
    color: COLORS.gray500,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  clientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clientChip: {
    marginBottom: 4,
  },
  bottomPadding: {
    height: 24,
  },
});
