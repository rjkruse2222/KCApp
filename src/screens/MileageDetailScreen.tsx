import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  TextInput,
  Button,
  Chip,
  RadioButton,
  Portal,
  Dialog,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMileageStore } from '../store/mileageStore';
import { useClientStore } from '../store/clientStore';
import { RootStackParamList, MileagePurpose, Location } from '../types';
import { COLORS, IRS_MILEAGE_RATES } from '../config/constants';
import { format } from 'date-fns';

type RouteProps = RouteProp<RootStackParamList, 'MileageDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MileageDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { entryId } = route.params;

  const { entries, addManualEntry, updateEntry, deleteEntry } = useMileageStore();
  const { clients, loadClients } = useClientStore();

  const existingEntry = entryId ? entries.find((e) => e.id === entryId) : null;
  const isNewEntry = !existingEntry;

  const [description, setDescription] = useState(existingEntry?.description || '');
  const [selectedClientId, setSelectedClientId] = useState(existingEntry?.clientId || '');
  const [purpose, setPurpose] = useState<MileagePurpose>(existingEntry?.purpose || 'business');
  const [distanceMiles, setDistanceMiles] = useState(existingEntry?.distanceMiles.toString() || '');
  const [notes, setNotes] = useState(existingEntry?.notes || '');
  const [startAddress, setStartAddress] = useState(existingEntry?.startLocation.address || '');
  const [endAddress, setEndAddress] = useState(existingEntry?.endLocation?.address || '');
  const [showClientPicker, setShowClientPicker] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!distanceMiles || parseFloat(distanceMiles) <= 0) {
      Alert.alert('Error', 'Please enter a valid distance');
      return;
    }

    const now = new Date().toISOString();
    const reimbursementRate = IRS_MILEAGE_RATES[purpose];

    try {
      if (isNewEntry) {
        const startLocation: Location = {
          latitude: 0,
          longitude: 0,
          address: startAddress.trim() || undefined,
          timestamp: now,
        };
        const endLocation: Location = {
          latitude: 0,
          longitude: 0,
          address: endAddress.trim() || undefined,
          timestamp: now,
        };

        await addManualEntry({
          clientId: selectedClientId || undefined,
          description: description.trim(),
          startLocation,
          endLocation,
          distanceMiles: parseFloat(distanceMiles),
          startTime: now,
          endTime: now,
          purpose,
          reimbursementRate,
          notes: notes.trim() || undefined,
          status: 'completed',
        });
      } else {
        await updateEntry(existingEntry!.id, {
          description: description.trim(),
          clientId: selectedClientId || undefined,
          distanceMiles: parseFloat(distanceMiles),
          purpose,
          reimbursementRate,
          notes: notes.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save mileage entry');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this trip?',
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
  const reimbursementRate = IRS_MILEAGE_RATES[purpose];
  const reimbursementAmount = (parseFloat(distanceMiles) || 0) * reimbursementRate;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Trip Details" />
        <Card.Content>
          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            placeholder="e.g., Client meeting downtown"
            style={styles.input}
          />

          <Text variant="bodyMedium" style={styles.label}>
            Client (Optional)
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowClientPicker(true)}
            style={styles.clientButton}
            contentStyle={styles.clientButtonContent}
          >
            {selectedClient?.name || 'Select a client (optional)'}
          </Button>

          <TextInput
            label="Distance (miles) *"
            value={distanceMiles}
            onChangeText={setDistanceMiles}
            mode="outlined"
            keyboardType="decimal-pad"
            right={<TextInput.Affix text="mi" />}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Locations" />
        <Card.Content>
          <TextInput
            label="Start Location"
            value={startAddress}
            onChangeText={setStartAddress}
            mode="outlined"
            placeholder="Starting address"
            style={styles.input}
          />
          <TextInput
            label="End Location"
            value={endAddress}
            onChangeText={setEndAddress}
            mode="outlined"
            placeholder="Ending address"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Purpose" />
        <Card.Content>
          <RadioButton.Group value={purpose} onValueChange={(v) => setPurpose(v as MileagePurpose)}>
            <RadioButton.Item
              label={`Business (${IRS_MILEAGE_RATES.business * 100}¢/mi)`}
              value="business"
            />
            <RadioButton.Item
              label={`Medical (${IRS_MILEAGE_RATES.medical * 100}¢/mi)`}
              value="medical"
            />
            <RadioButton.Item
              label={`Charity (${IRS_MILEAGE_RATES.charity * 100}¢/mi)`}
              value="charity"
            />
            <RadioButton.Item
              label="Personal (not deductible)"
              value="personal"
            />
          </RadioButton.Group>

          {purpose !== 'personal' && (
            <View style={styles.reimbursementRow}>
              <Text variant="bodyLarge">Estimated Reimbursement:</Text>
              <Text variant="titleLarge" style={styles.reimbursement}>
                ${reimbursementAmount.toFixed(2)}
              </Text>
            </View>
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
          <Card.Title title="Trip Info" />
          <Card.Content>
            <Text variant="bodySmall" style={styles.infoText}>
              Started: {format(new Date(existingEntry.startTime), 'MMM d, yyyy h:mm a')}
            </Text>
            {existingEntry.endTime && (
              <Text variant="bodySmall" style={styles.infoText}>
                Ended: {format(new Date(existingEntry.endTime), 'MMM d, yyyy h:mm a')}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.infoText}>
              Status: {existingEntry.status}
            </Text>
            {existingEntry.startLocation.address && (
              <Text variant="bodySmall" style={styles.infoText}>
                From: {existingEntry.startLocation.address}
              </Text>
            )}
            {existingEntry.endLocation?.address && (
              <Text variant="bodySmall" style={styles.infoText}>
                To: {existingEntry.endLocation.address}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      <View style={styles.actions}>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.actionButton}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSave} style={styles.actionButton}>
          {isNewEntry ? 'Create Trip' : 'Save Changes'}
        </Button>
      </View>

      {!isNewEntry && (
        <Button
          mode="text"
          onPress={handleDelete}
          textColor={COLORS.error}
          style={styles.deleteButton}
        >
          Delete Trip
        </Button>
      )}

      {/* Client Picker Dialog */}
      <Portal>
        <Dialog visible={showClientPicker} onDismiss={() => setShowClientPicker(false)}>
          <Dialog.Title>Select Client</Dialog.Title>
          <Dialog.Content>
            <Chip
              selected={!selectedClientId}
              onPress={() => {
                setSelectedClientId('');
                setShowClientPicker(false);
              }}
              style={styles.clientChip}
            >
              No Client
            </Chip>
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
  reimbursementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  reimbursement: {
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
    marginTop: 8,
  },
  clientChip: {
    marginBottom: 4,
  },
  bottomPadding: {
    height: 24,
  },
});
