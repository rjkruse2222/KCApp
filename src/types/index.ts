// User and Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  provider: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

export type AuthProvider = 'apple' | 'google' | 'microsoft';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

// Client/Business Types
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  // Cloud storage folder links
  oneDriveFolderId?: string;
  oneDriveFolderUrl?: string;
  googleDriveFolderId?: string;
  googleDriveFolderUrl?: string;
  // Embedded report URL
  reportUrl?: string;
  reportType?: ReportType;
  createdAt: string;
  updatedAt: string;
}

export type ReportType = 'powerbi' | 'looker' | 'tableau' | 'custom';

// Time Tracking Types
export interface TimeEntry {
  id: string;
  clientId: string;
  description: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  billable: boolean;
  hourlyRate?: number;
  notes?: string;
  tags?: string[];
  status: TimeEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export type TimeEntryStatus = 'running' | 'paused' | 'completed';

// Mileage Tracking Types
export interface MileageEntry {
  id: string;
  clientId?: string;
  description: string;
  startLocation: Location;
  endLocation?: Location;
  waypoints?: Location[];
  distanceMiles: number;
  startTime: string;
  endTime?: string;
  purpose: MileagePurpose;
  vehicleId?: string;
  reimbursementRate: number; // IRS rate per mile
  notes?: string;
  status: MileageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

export type MileagePurpose = 'business' | 'medical' | 'charity' | 'moving' | 'personal';
export type MileageStatus = 'tracking' | 'completed' | 'cancelled';

export interface Vehicle {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  isDefault: boolean;
  createdAt: string;
}

// Cloud Storage Types
export interface CloudFolder {
  id: string;
  name: string;
  provider: CloudProvider;
  folderId: string;
  folderUrl: string;
  clientId: string;
  createdAt: string;
}

export type CloudProvider = 'onedrive' | 'googledrive';

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webUrl: string;
  downloadUrl?: string;
  modifiedAt: string;
}

// Report Types
export interface EmbeddedReport {
  id: string;
  clientId: string;
  name: string;
  url: string;
  type: ReportType;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

// App Settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultMileageRate: number;
  defaultHourlyRate: number;
  autoTrackMileage: boolean;
  notificationsEnabled: boolean;
  syncEnabled: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ClientDetail: { clientId: string };
  TimeEntryDetail: { entryId?: string; clientId?: string };
  MileageDetail: { entryId?: string };
  CloudFolder: { clientId: string; provider: CloudProvider };
  Report: { clientId: string; reportUrl: string };
  Settings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  TimeTracking: undefined;
  Mileage: undefined;
  Clients: undefined;
  More: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Statistics Types
export interface DashboardStats {
  totalTimeThisWeek: number;
  totalMileageThisMonth: number;
  activeClients: number;
  pendingEntries: number;
  recentTimeEntries: TimeEntry[];
  recentMileageEntries: MileageEntry[];
}
