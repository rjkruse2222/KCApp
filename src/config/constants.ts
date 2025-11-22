// IRS Standard Mileage Rates for 2024
export const IRS_MILEAGE_RATES = {
  business: 0.67, // 67 cents per mile
  medical: 0.21, // 21 cents per mile
  charity: 0.14, // 14 cents per mile
  moving: 0.21, // 21 cents per mile (military only)
  personal: 0, // Not deductible
} as const;

// OAuth Configuration
export const OAUTH_CONFIG = {
  google: {
    // Replace with your actual Google OAuth client ID
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    scopes: [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
    redirectUri: 'kcapp://oauth/google',
  },
  microsoft: {
    // Replace with your actual Microsoft/Azure AD client ID
    clientId: process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID || '',
    tenantId: 'common', // Use 'common' for multi-tenant, or your specific tenant ID
    scopes: [
      'openid',
      'profile',
      'email',
      'offline_access',
      'Files.Read',
      'Files.Read.All',
    ],
    redirectUri: 'kcapp://oauth/microsoft',
  },
  apple: {
    // Apple Sign In is configured in app.json
    serviceId: process.env.EXPO_PUBLIC_APPLE_SERVICE_ID || '',
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  googleDrive: 'https://www.googleapis.com/drive/v3',
  microsoftGraph: 'https://graph.microsoft.com/v1.0',
} as const;

// App Constants
export const APP_CONFIG = {
  appName: 'KCApp',
  version: '1.0.0',
  supportEmail: 'support@kcapp.com',

  // Location tracking settings
  locationTracking: {
    distanceInterval: 10, // meters
    timeInterval: 5000, // milliseconds
    accuracy: 'high' as const,
  },

  // Time tracking settings
  timeTracking: {
    autoSaveInterval: 60000, // 1 minute
    roundToNearest: 15, // minutes
  },

  // Default settings
  defaults: {
    hourlyRate: 150,
    mileageRate: IRS_MILEAGE_RATES.business,
    theme: 'system' as const,
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  authToken: 'auth_token',
  refreshToken: 'refresh_token',
  user: 'user_data',
  settings: 'app_settings',
  activeTimeEntry: 'active_time_entry',
  activeMileageEntry: 'active_mileage_entry',
} as const;

// Colors
export const COLORS = {
  primary: '#1a365d',
  primaryLight: '#2c5282',
  primaryDark: '#1a202c',
  secondary: '#38a169',
  accent: '#ed8936',
  error: '#e53e3e',
  warning: '#dd6b20',
  success: '#38a169',
  info: '#3182ce',

  // Grays
  gray50: '#f7fafc',
  gray100: '#edf2f7',
  gray200: '#e2e8f0',
  gray300: '#cbd5e0',
  gray400: '#a0aec0',
  gray500: '#718096',
  gray600: '#4a5568',
  gray700: '#2d3748',
  gray800: '#1a202c',
  gray900: '#171923',

  // Backgrounds
  background: '#ffffff',
  backgroundDark: '#1a202c',
  surface: '#f7fafc',
  surfaceDark: '#2d3748',
} as const;
