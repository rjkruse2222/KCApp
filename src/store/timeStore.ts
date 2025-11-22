import { create } from 'zustand';
import { TimeEntry, TimeEntryStatus } from '../types';
import { DatabaseService } from '../services/database';
import { v4 as uuidv4 } from 'uuid';

interface TimeStore {
  entries: TimeEntry[];
  activeEntry: TimeEntry | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEntries: (clientId?: string) => Promise<void>;
  startTimer: (clientId: string, description: string, billable?: boolean) => Promise<TimeEntry>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: (notes?: string) => Promise<TimeEntry | null>;
  addManualEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TimeEntry>;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntriesForClient: (clientId: string) => TimeEntry[];
  getEntriesForDateRange: (startDate: string, endDate: string) => TimeEntry[];
  getTotalTimeForClient: (clientId: string) => number;
}

export const useTimeStore = create<TimeStore>((set, get) => ({
  entries: [],
  activeEntry: null,
  isLoading: false,
  error: null,

  loadEntries: async (clientId) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await DatabaseService.getTimeEntries(clientId);
      const activeEntry = entries.find((e) => e.status === 'running' || e.status === 'paused');
      set({ entries, activeEntry: activeEntry || null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  startTimer: async (clientId, description, billable = true) => {
    const now = new Date().toISOString();
    const newEntry: TimeEntry = {
      id: uuidv4(),
      clientId,
      description,
      startTime: now,
      billable,
      status: 'running',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await DatabaseService.createTimeEntry(newEntry);
      set((state) => ({
        entries: [newEntry, ...state.entries],
        activeEntry: newEntry,
      }));
      return newEntry;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  pauseTimer: async () => {
    const { activeEntry } = get();
    if (!activeEntry || activeEntry.status !== 'running') return;

    const now = new Date();
    const startTime = new Date(activeEntry.startTime);
    const currentDuration = activeEntry.durationMinutes || 0;
    const additionalMinutes = Math.round((now.getTime() - startTime.getTime()) / 60000);

    const updates: Partial<TimeEntry> = {
      status: 'paused',
      durationMinutes: currentDuration + additionalMinutes,
      updatedAt: now.toISOString(),
    };

    try {
      await DatabaseService.updateTimeEntry(activeEntry.id, updates);
      set((state) => ({
        activeEntry: { ...activeEntry, ...updates },
        entries: state.entries.map((e) =>
          e.id === activeEntry.id ? { ...e, ...updates } : e
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  resumeTimer: async () => {
    const { activeEntry } = get();
    if (!activeEntry || activeEntry.status !== 'paused') return;

    const now = new Date().toISOString();
    const updates: Partial<TimeEntry> = {
      status: 'running',
      startTime: now,
      updatedAt: now,
    };

    try {
      await DatabaseService.updateTimeEntry(activeEntry.id, updates);
      set((state) => ({
        activeEntry: { ...activeEntry, ...updates },
        entries: state.entries.map((e) =>
          e.id === activeEntry.id ? { ...e, ...updates } : e
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  stopTimer: async (notes) => {
    const { activeEntry } = get();
    if (!activeEntry) return null;

    const now = new Date();
    const startTime = new Date(activeEntry.startTime);
    const currentDuration = activeEntry.durationMinutes || 0;
    const additionalMinutes =
      activeEntry.status === 'running'
        ? Math.round((now.getTime() - startTime.getTime()) / 60000)
        : 0;

    const updates: Partial<TimeEntry> = {
      status: 'completed',
      endTime: now.toISOString(),
      durationMinutes: currentDuration + additionalMinutes,
      notes: notes || activeEntry.notes,
      updatedAt: now.toISOString(),
    };

    try {
      await DatabaseService.updateTimeEntry(activeEntry.id, updates);
      const completedEntry = { ...activeEntry, ...updates };
      set((state) => ({
        activeEntry: null,
        entries: state.entries.map((e) =>
          e.id === activeEntry.id ? completedEntry : e
        ),
      }));
      return completedEntry;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addManualEntry: async (entryData) => {
    const now = new Date().toISOString();
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await DatabaseService.createTimeEntry(newEntry);
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
      await DatabaseService.updateTimeEntry(id, updates);
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
      await DatabaseService.deleteTimeEntry(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        activeEntry: state.activeEntry?.id === id ? null : state.activeEntry,
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

  getTotalTimeForClient: (clientId) => {
    return get()
      .entries.filter((e) => e.clientId === clientId && e.status === 'completed')
      .reduce((total, e) => total + (e.durationMinutes || 0), 0);
  },
}));
