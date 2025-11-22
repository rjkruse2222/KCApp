import { create } from 'zustand';
import { MileageEntry, MileageStatus, MileagePurpose, Location } from '../types';
import { DatabaseService } from '../services/database';
import { IRS_MILEAGE_RATES } from '../config/constants';
import { v4 as uuidv4 } from 'uuid';

interface MileageStore {
  entries: MileageEntry[];
  activeEntry: MileageEntry | null;
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEntries: (clientId?: string) => Promise<void>;
  startTracking: (
    description: string,
    purpose: MileagePurpose,
    startLocation: Location,
    clientId?: string
  ) => Promise<MileageEntry>;
  updateLocation: (location: Location) => Promise<void>;
  stopTracking: (endLocation: Location, notes?: string) => Promise<MileageEntry | null>;
  cancelTracking: () => Promise<void>;
  addManualEntry: (entry: Omit<MileageEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MileageEntry>;
  updateEntry: (id: string, updates: Partial<MileageEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntriesForClient: (clientId: string) => MileageEntry[];
  getEntriesForDateRange: (startDate: string, endDate: string) => MileageEntry[];
  getTotalMileageForClient: (clientId: string) => number;
  getTotalReimbursement: (clientId?: string) => number;
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  const lat1 = toRad(loc1.latitude);
  const lat2 = toRad(loc2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export const useMileageStore = create<MileageStore>((set, get) => ({
  entries: [],
  activeEntry: null,
  isTracking: false,
  isLoading: false,
  error: null,

  loadEntries: async (clientId) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await DatabaseService.getMileageEntries(clientId);
      const activeEntry = entries.find((e) => e.status === 'tracking');
      set({
        entries,
        activeEntry: activeEntry || null,
        isTracking: !!activeEntry,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  startTracking: async (description, purpose, startLocation, clientId) => {
    const now = new Date().toISOString();
    const newEntry: MileageEntry = {
      id: uuidv4(),
      clientId,
      description,
      startLocation,
      waypoints: [],
      distanceMiles: 0,
      startTime: now,
      purpose,
      reimbursementRate: IRS_MILEAGE_RATES[purpose],
      status: 'tracking',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await DatabaseService.createMileageEntry(newEntry);
      set((state) => ({
        entries: [newEntry, ...state.entries],
        activeEntry: newEntry,
        isTracking: true,
      }));
      return newEntry;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateLocation: async (location) => {
    const { activeEntry } = get();
    if (!activeEntry || activeEntry.status !== 'tracking') return;

    const waypoints = [...(activeEntry.waypoints || []), location];

    // Calculate total distance
    let totalDistance = 0;
    let prevLocation = activeEntry.startLocation;
    for (const waypoint of waypoints) {
      totalDistance += calculateDistance(prevLocation, waypoint);
      prevLocation = waypoint;
    }

    const updates: Partial<MileageEntry> = {
      waypoints,
      distanceMiles: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      updatedAt: new Date().toISOString(),
    };

    try {
      await DatabaseService.updateMileageEntry(activeEntry.id, updates);
      set((state) => ({
        activeEntry: { ...activeEntry, ...updates },
        entries: state.entries.map((e) =>
          e.id === activeEntry.id ? { ...e, ...updates } : e
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  stopTracking: async (endLocation, notes) => {
    const { activeEntry } = get();
    if (!activeEntry) return null;

    // Calculate final distance including end location
    const waypoints = [...(activeEntry.waypoints || [])];
    let totalDistance = 0;
    let prevLocation = activeEntry.startLocation;
    for (const waypoint of waypoints) {
      totalDistance += calculateDistance(prevLocation, waypoint);
      prevLocation = waypoint;
    }
    totalDistance += calculateDistance(prevLocation, endLocation);

    const now = new Date().toISOString();
    const updates: Partial<MileageEntry> = {
      endLocation,
      endTime: now,
      distanceMiles: Math.round(totalDistance * 100) / 100,
      notes: notes || activeEntry.notes,
      status: 'completed',
      updatedAt: now,
    };

    try {
      await DatabaseService.updateMileageEntry(activeEntry.id, updates);
      const completedEntry = { ...activeEntry, ...updates };
      set((state) => ({
        activeEntry: null,
        isTracking: false,
        entries: state.entries.map((e) =>
          e.id === activeEntry.id ? completedEntry : e
        ),
      }));
      return completedEntry as MileageEntry;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  cancelTracking: async () => {
    const { activeEntry } = get();
    if (!activeEntry) return;

    try {
      await DatabaseService.updateMileageEntry(activeEntry.id, {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
      set((state) => ({
        activeEntry: null,
        isTracking: false,
        entries: state.entries.map((e) =>
          e.id === activeEntry.id ? { ...e, status: 'cancelled' as MileageStatus } : e
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addManualEntry: async (entryData) => {
    const now = new Date().toISOString();
    const newEntry: MileageEntry = {
      ...entryData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await DatabaseService.createMileageEntry(newEntry);
      set((state) => ({
        entries: [newEntry, ...state.entries],
      }));
      return newEntry;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateEntry: async (id, updates) => {
    try {
      await DatabaseService.updateMileageEntry(id, updates);
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteEntry: async (id) => {
    try {
      await DatabaseService.deleteMileageEntry(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        activeEntry: state.activeEntry?.id === id ? null : state.activeEntry,
        isTracking: state.activeEntry?.id === id ? false : state.isTracking,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getEntriesForClient: (clientId) => {
    return get().entries.filter((e) => e.clientId === clientId);
  },

  getEntriesForDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return get().entries.filter((e) => {
      const entryDate = new Date(e.startTime);
      return entryDate >= start && entryDate <= end;
    });
  },

  getTotalMileageForClient: (clientId) => {
    return get()
      .entries.filter((e) => e.clientId === clientId && e.status === 'completed')
      .reduce((total, e) => total + e.distanceMiles, 0);
  },

  getTotalReimbursement: (clientId) => {
    return get()
      .entries.filter(
        (e) => (!clientId || e.clientId === clientId) && e.status === 'completed'
      )
      .reduce((total, e) => total + e.distanceMiles * e.reimbursementRate, 0);
  },
}));
