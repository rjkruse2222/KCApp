import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useTimeStore } from '../store/timeStore';
import { useMileageStore } from '../store/mileageStore';
import { useClientStore } from '../store/clientStore';
import { RootStackParamList } from '../types';
import { COLORS } from '../config/constants';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { entries: timeEntries, activeEntry, loadEntries: loadTimeEntries } = useTimeStore();
  const { entries: mileageEntries, isTracking, loadEntries: loadMileageEntries, getTotalReimbursement } = useMileageStore();
  const { clients, loadClients } = useClientStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadTimeEntries(),
      loadMileageEntries(),
      loadClients(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate stats
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const weeklyTime = timeEntries
    .filter((e) => {
      const date = new Date(e.startTime);
      return date >= weekStart && date <= weekEnd && e.status === 'completed';
    })
    .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

  const monthlyMileage = mileageEntries
    .filter((e) => {
      const date = new Date(e.startTime);
      return date >= monthStart && date <= monthEnd && e.status === 'completed';
    })
    .reduce((sum, e) => sum + e.distanceMiles, 0);

  const monthlyReimbursement = getTotalReimbursement();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Card */}
      <Surface style={styles.welcomeCard} elevation={1}>
        <View style={styles.welcomeRow}>
          {user?.photoUrl ? (
            <Avatar.Image size={50} source={{ uri: user.photoUrl }} />
          ) : (
            <Avatar.Text
              size={50}
              label={user?.displayName?.charAt(0) || 'U'}
              style={{ backgroundColor: COLORS.primary }}
            />
          )}
          <View style={styles.welcomeText}>
            <Text variant="titleMedium">Welcome back,</Text>
            <Text variant="headlineSmall" style={styles.userName}>
              {user?.displayName || 'User'}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Active Tracking Alert */}
      {(activeEntry || isTracking) && (
        <Card style={styles.activeCard}>
          <Card.Content style={styles.activeContent}>
            <MaterialCommunityIcons
              name={activeEntry ? 'clock-outline' : 'car'}
              size={24}
              color={COLORS.success}
            />
            <View style={styles.activeTextContainer}>
              <Text variant="titleSmall" style={styles.activeTitle}>
                {activeEntry ? 'Timer Running' : 'Trip in Progress'}
              </Text>
              <Text variant="bodySmall" style={styles.activeSubtitle}>
                {activeEntry?.description || 'Tracking mileage...'}
              </Text>
            </View>
            <Button
              mode="contained"
              compact
              onPress={() => {
                // Navigate to appropriate screen
              }}
            >
              View
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={32}
              color={COLORS.primary}
            />
            <Text variant="headlineMedium" style={styles.statValue}>
              {formatDuration(weeklyTime)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              This Week
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="car" size={32} color={COLORS.secondary} />
            <Text variant="headlineMedium" style={styles.statValue}>
              {monthlyMileage.toFixed(1)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Miles This Month
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons
              name="currency-usd"
              size={32}
              color={COLORS.accent}
            />
            <Text variant="headlineMedium" style={styles.statValue}>
              ${monthlyReimbursement.toFixed(0)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Reimbursement
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons
              name="account-group"
              size={32}
              color={COLORS.info}
            />
            <Text variant="headlineMedium" style={styles.statValue}>
              {clients.filter((c) => c.isActive).length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Active Clients
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Quick Actions
      </Text>
      <View style={styles.actionsRow}>
        <Button
          mode="contained"
          icon="clock-plus"
          style={styles.actionButton}
          onPress={() => navigation.navigate('TimeEntryDetail', {})}
        >
          Log Time
        </Button>
        <Button
          mode="contained"
          icon="car-clock"
          style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
          onPress={() => navigation.navigate('MileageDetail', {})}
        >
          Log Trip
        </Button>
      </View>

      {/* Recent Activity */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Recent Activity
      </Text>
      {timeEntries.slice(0, 3).map((entry) => (
        <Card
          key={entry.id}
          style={styles.activityCard}
          onPress={() => navigation.navigate('TimeEntryDetail', { entryId: entry.id })}
        >
          <Card.Content style={styles.activityContent}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={COLORS.primary}
            />
            <View style={styles.activityText}>
              <Text variant="bodyLarge">{entry.description}</Text>
              <Text variant="bodySmall" style={styles.activityMeta}>
                {format(new Date(entry.startTime), 'MMM d, yyyy')} •{' '}
                {entry.durationMinutes ? formatDuration(entry.durationMinutes) : 'In progress'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}

      {mileageEntries.slice(0, 2).map((entry) => (
        <Card
          key={entry.id}
          style={styles.activityCard}
          onPress={() => navigation.navigate('MileageDetail', { entryId: entry.id })}
        >
          <Card.Content style={styles.activityContent}>
            <MaterialCommunityIcons name="car" size={24} color={COLORS.secondary} />
            <View style={styles.activityText}>
              <Text variant="bodyLarge">{entry.description}</Text>
              <Text variant="bodySmall" style={styles.activityMeta}>
                {format(new Date(entry.startTime), 'MMM d, yyyy')} •{' '}
                {entry.distanceMiles.toFixed(1)} miles
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  welcomeCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
  },
  userName: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  activeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#e6ffed',
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  activeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  activeTitle: {
    color: COLORS.success,
    fontWeight: '600',
  },
  activeSubtitle: {
    color: COLORS.gray600,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  statCard: {
    width: '46%',
    margin: '2%',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontWeight: '700',
    marginTop: 8,
    color: COLORS.gray800,
  },
  statLabel: {
    color: COLORS.gray500,
    marginTop: 4,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
    marginLeft: 12,
  },
  activityMeta: {
    color: COLORS.gray500,
    marginTop: 4,
  },
  bottomPadding: {
    height: 24,
  },
});
