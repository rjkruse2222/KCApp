# KCApp - CPA Firm Mobile Application

A cross-platform mobile application for CPA firms to manage client relationships, track time and mileage, and provide secure document access.

## Features

### Authentication
- **Apple Sign-In** - iOS native authentication
- **Google Sign-In** - Cross-platform Google authentication
- **Microsoft Sign-In** - Azure AD / Microsoft account authentication

### Time Tracking
- Track billable hours with descriptions
- Assign time entries to specific clients/businesses
- View time history and generate reports
- Export time data for billing

### Mileage Tracking
- GPS-based automatic mileage tracking
- Manual trip entry option
- Assign trips to clients/businesses
- IRS-compliant mileage logs
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
- Power BI / Looker Studio integration options
- Custom report URLs per client

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Database**: SQLite (local) + Supabase (cloud sync)
- **Authentication**: Expo AuthSession + provider SDKs
- **Location**: Expo Location
- **UI Components**: React Native Paper

## Project Structure

```
KCApp/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # App screens
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API and external services
│   ├── store/             # State management
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── config/            # App configuration
├── assets/                # Images, fonts, etc.
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

### Environment Setup

Create a `.env` file with your credentials:

```env
# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
MICROSOFT_CLIENT_ID=your-microsoft-client-id
APPLE_SERVICE_ID=your-apple-service-id

# Supabase (optional cloud sync)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Drive API
GOOGLE_DRIVE_API_KEY=your-google-drive-api-key

# Microsoft Graph API (OneDrive)
MICROSOFT_GRAPH_CLIENT_ID=your-microsoft-graph-client-id
```

## License

Proprietary - All rights reserved
