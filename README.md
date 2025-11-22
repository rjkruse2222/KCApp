# KCApp - CPA Firm Mobile & Web Application

A cross-platform application for CPA firms to manage client relationships, track time and mileage, and provide secure document access. Works on **iOS**, **Android**, and **Web**.

## Features

### Authentication
- **Apple Sign-In** - iOS native authentication
- **Google Sign-In** - Cross-platform Google authentication
- **Microsoft Sign-In** - Azure AD / Microsoft account authentication

### Time Tracking
- Track billable hours with descriptions
- Start/pause/stop timer functionality
- Assign time entries to specific clients/businesses
- View time history and generate reports
- Export time data for billing

### Mileage Tracking
- GPS-based automatic mileage tracking
- Manual trip entry option
- Assign trips to clients/businesses
- IRS-compliant mileage logs (2024 rates)
- Automatic reimbursement calculations
- Export mileage reports

### Client Management
- Create and manage client profiles
- Assign businesses to clients
- Client-specific settings and preferences

### Document Management
- **OneDrive Integration** - Embed OneDrive folders per client
- **Google Drive Integration** - Embed Google Drive folders per client
- Secure document viewing within the app

### Client Reports
- Embed specific reports for specific clients
- Power BI / Looker Studio integration
- Custom report URLs per client

## Platforms

### Mobile (iOS & Android)
- Bottom tab navigation
- Native gestures and animations
- Background location tracking
- Push notifications

### Web
- Responsive sidebar navigation
- Desktop-optimized layouts
- URL-based routing
- Full keyboard accessibility

## Technology Stack

- **Framework**: React Native with Expo SDK 51
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Database**: SQLite (local)
- **Authentication**: Expo AuthSession + provider SDKs
- **Location**: Expo Location
- **UI Components**: React Native Paper (Material Design 3)
- **Web Support**: Expo Web with Metro bundler

## Project Structure

```
KCApp/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── web/           # Web-specific components
│   │   ├── DataTable.tsx  # Responsive data table
│   │   ├── StatCard.tsx   # Statistics card
│   │   └── EmptyState.tsx # Empty state component
│   ├── screens/           # App screens (12 total)
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API and external services
│   │   ├── auth.ts        # Authentication service
│   │   ├── database.ts    # SQLite database service
│   │   ├── location.ts    # GPS location service
│   │   └── cloudStorage.ts # OneDrive/Google Drive service
│   ├── store/             # Zustand state stores
│   ├── hooks/             # Custom React hooks
│   │   └── useResponsive.ts # Responsive design hook
│   ├── types/             # TypeScript type definitions
│   └── config/            # App configuration & constants
├── assets/                # Images, fonts, etc.
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd KCApp

# Install dependencies
npm install

# Start development server
npx expo start
```

### Running the App

```bash
# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android

# Run on Web Browser
npx expo start --web
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```env
# Authentication
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
EXPO_PUBLIC_MICROSOFT_CLIENT_ID=your-microsoft-client-id
EXPO_PUBLIC_APPLE_SERVICE_ID=your-apple-service-id

# Optional: Supabase for cloud sync
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `kcapp://oauth/google`

#### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application in Azure AD
3. Add redirect URI: `kcapp://oauth/microsoft`
4. Enable required scopes: `openid`, `profile`, `email`, `Files.Read`

#### Apple Sign-In
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Configure Sign in with Apple capability
3. Create a Service ID for web authentication

## Building for Production

### iOS
```bash
npx expo build:ios
# or with EAS Build
eas build --platform ios
```

### Android
```bash
npx expo build:android
# or with EAS Build
eas build --platform android
```

### Web
```bash
npx expo export:web
# Output will be in /web-build directory
```

## IRS Mileage Rates (2024)

The app includes built-in IRS standard mileage rates:
- **Business**: 67¢ per mile
- **Medical**: 21¢ per mile
- **Charity**: 14¢ per mile

## License

Proprietary - All rights reserved
