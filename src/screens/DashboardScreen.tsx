import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { Text, Card, Button, Avatar, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useTimeStore } from '../store/timeStore';
import { useMileageStore } from '../store/mileageStore';
import { useClientStore } from '../store/clientStore';
import { useResponsive } from '../hooks/useResponsive';
import { StatCard } from '../components/StatCard';
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
  const { isWeb, isDesktop, breakpoint } = useResponsive();
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

  // Responsive grid columns
  const getStatsColumns = () => {
    if (breakpoint === 'xl') return 4;
    if (breakpoint === 'lg') return 4;
    if (breakpoint === 'md') return 2;
    return 2;
  };

  const statsColumns = getStatsColumns();
  const useGridLayout = isWeb && isDesktop;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        useGridLayout && styles.contentWeb,
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Page Header - Web only */}
      {useGridLayout && (
        <View style={styles.pageHeader}>
          <View>
            <Text variant="headlineMedium" style={styles.pageTitle}>
              Dashboard
            </Text>
            <Text variant="bodyMedium" style={styles.pageSubtitle}>
              Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Button
              mode="contained"
              icon="clock-plus"
              onPress={() => navigation.navigate('TimeEntryDetail', {})}
              style={styles.headerButton}
            >
              Log Time
            </Button>
            <Button
              mode="contained"
              icon="car-clock"
              onPress={() => navigation.navigate('MileageDetail', {})}
              style={[styles.headerButton, { backgroundColor: COLORS.secondary }]}
            >
              Log Trip
            </Button>
          </View>
        </View>
      )}

      {/* Welcome Card - Mobile only */}
      {!useGridLayout && (
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
      )}

      {/* Active Tracking Alert */}
      {(activeEntry || isTracking) && (
        <Card style={[styles.activeCard, useGridLayout && styles.activeCardWeb]}>
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
            <Button mode="contained" compact>
              View
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Stats Grid */}
      <View style={[styles.statsGrid, useGridLayout && styles.statsGridWeb]}>
        <View style={[styles.statWrapper, { width: useGridLayout ? `${100 / statsColumns}%` : '50%' }]}>
          <StatCard
            title="This Week"
            value={formatDuration(weeklyTime)}
            icon="clock-outline"
            iconColor={COLORS.primary}
            onPress={() => navigation.navigate('Main', { screen: 'TimeTracking' } as any)}
          />
        </View>
        <View style={[styles.statWrapper, { width: useGridLayout ? `${100 / statsColumns}%` : '50%' }]}>
          <StatCard
            title="Miles This Month"
            value={monthlyMileage.toFixed(1)}
            icon="car"
            iconColor={COLORS.secondary}
            onPress={() => navigation.navigate('Main', { screen: 'Mileage' } as any)}
          />
        </View>
        <View style={[styles.statWrapper, { width: useGridLayout ? `${100 / statsColumns}%` : '50%' }]}>
          <StatCard
            title="Reimbursement"
            value={`$${monthlyReimbursement.toFixed(0)}`}
            icon="currency-usd"
            iconColor={COLORS.accent}
          />
        </View>
        <View style={[styles.statWrapper, { width: useGridLayout ? `${100 / statsColumns}%` : '50%' }]}>
          <StatCard
            title="Active Clients"
            value={clients.filter((c) => c.isActive).length}
            icon="account-group"
            iconColor={COLORS.info}
            onPress={() => navigation.navigate('Main', { screen: 'Clients' } as any)}
          />
        </View>
      </View>

      {/* Quick Actions - Mobile only */}
      {!useGridLayout && (
        <>
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
        </>
      )}

      {/* Recent Activity */}
      <View style={[styles.activitySection, useGridLayout && styles.activitySectionWeb]}>
        <View style={[styles.activityColumn, useGridLayout && styles.activityColumnWeb]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, useGridLayout && styles.sectionTitleWeb]}>
            Recent Time Entries
          </Text>
          {timeEntries.slice(0, useGridLayout ? 5 : 3).map((entry) => (
            <Card
              key={entry.id}
              style={[styles.activityCard, useGridLayout && styles.activityCardWeb]}
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
          {timeEntries.length === 0 && (
            <Card style={[styles.emptyCard, useGridLayout && styles.activityCardWeb]}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyText}>No time entries yet</Text>
              </Card.Content>
            </Card>
          )}
        </View>

        <View style={[styles.activityColumn, useGridLayout && styles.activityColumnWeb]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, useGridLayout && styles.sectionTitleWeb]}>
            Recent Trips
          </Text>
          {mileageEntries.slice(0, useGridLayout ? 5 : 2).map((entry) => (
            <Card
              key={entry.id}
              style={[styles.activityCard, useGridLayout && styles.activityCardWeb]}
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
          {mileageEntries.length === 0 && (
            <Card style={[styles.emptyCard, useGridLayout && styles.activityCardWeb]}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyText}>No trips recorded yet</Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  content: {
    paddingBottom: 24,
  },
  contentWeb: {
    padding: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontWeight: '700',
    color: COLORS.gray900,
  },
  pageSubtitle: {
    color: COLORS.gray500,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    backgroundColor: COLORS.primary,
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
  activeCardWeb: {
    marginHorizontal: 0,
    marginBottom: 24,
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
    paddingHorizontal: 8,
  },
  statsGridWeb: {
    paddingHorizontal: 0,
    marginHorizontal: -8,
  },
  statWrapper: {
    padding: 8,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    fontWeight: '600',
  },
  sectionTitleWeb: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 16,
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
  activitySection: {
    marginTop: 8,
  },
  activitySectionWeb: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
  },
  activityColumn: {
    flex: 1,
  },
  activityColumnWeb: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)' as any,
    }),
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  activityCardWeb: {
    marginHorizontal: 0,
    marginBottom: 12,
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
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.gray50,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: COLORS.gray500,
  },
  bottomPadding: {
    height: 24,
  },
});
