import { create } from 'zustand';
import { Client } from '../types';
import { DatabaseService } from '../services/database';

interface ClientStore {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  selectClient: (client: Client | null) => void;
  getClientById: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,

  loadClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const clients = await DatabaseService.getClients();
      set({ clients, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addClient: async (clientData) => {
    set({ isLoading: true, error: null });
    try {
      const newClient = await DatabaseService.createClient(clientData);
      set((state) => ({
        clients: [...state.clients, newClient],
        isLoading: false,
      }));
      return newClient;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateClient: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.updateClient(id, updates);
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
        selectedClient:
          state.selectedClient?.id === id
            ? { ...state.selectedClient, ...updates }
            : state.selectedClient,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteClient: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await DatabaseService.deleteClient(id);
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  selectClient: (client) => {
    set({ selectedClient: client });
  },

  getClientById: (id) => {
    return get().clients.find((c) => c.id === id);
  },
}));
