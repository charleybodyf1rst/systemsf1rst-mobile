# SystemsF1RST Mobile

Mobile app for SystemsF1RST Marketplace - a simplified mobile experience for the parent company platform that powers SecurityF1RST, BodyF1RST, FMW, and 10+ white-labeled business CRMs.

## Features

### Multi-User Role System
| Role | Views | Capabilities |
|------|-------|--------------|
| **Admin** | Everything | Full access, manage employees, geofence locations, reports |
| **Manager** | Team data | See team activity, approve timesheets, team overview |
| **Employee** | Own data | Clock in/out, access core features, messaging |

### Core Features
- **Time Clock with Geolocation** - Clock in/out with GPS location capture
- **AI Note Taker** - Record and transcribe meetings
- **AI Agent** - Generate documents, send emails via chat
- **Client Messaging** - SMS/email communication with leads
- **Team Management** - Manager approval workflow for timesheets

### Time Tracking
- Clock in/out with GPS coordinates
- Location name via reverse geocoding
- Weekly summary with regular/overtime hours
- Geofencing support (optional location restrictions)
- Manager approval workflow

## Tech Stack

- **Framework**: React Native + Expo 52
- **Router**: Expo Router (file-based)
- **State**: Zustand
- **API**: Axios with Laravel Sanctum auth
- **Location**: expo-location
- **Audio**: expo-av

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

```bash
# Clone the repo
git clone https://github.com/kyleterrypool/systemsf1rst-mobile.git
cd systemsf1rst-mobile

# Install dependencies
npm install

# Start development server
npx expo start
```

### Running on Device

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (login, forgot-password)
│   ├── (employee)/        # Employee role screens
│   ├── (manager)/         # Manager role screens (includes employee screens)
│   └── (admin)/           # Admin role screens (full access)
├── stores/                 # Zustand state stores
│   ├── authStore.ts       # Authentication state
│   └── timeClockStore.ts  # Time clock state
└── lib/
    └── api.ts             # Axios API client
```

## API Backend

This app connects to the BodyF1rst-Backend-CLEAN Laravel API:

### Time Clock Endpoints
- `POST /api/time-clock/clock-in` - Clock in with location
- `POST /api/time-clock/clock-out` - Clock out with location
- `GET /api/time-clock/status` - Current clock status
- `GET /api/time-clock/history` - User's clock history
- `GET /api/time-clock/summary` - Weekly summary

### Manager Endpoints
- `GET /api/time-clock/team` - Team time entries
- `POST /api/time-clock/{id}/approve` - Approve entry
- `POST /api/time-clock/{id}/reject` - Reject entry

### Admin Endpoints
- `GET /api/time-clock/organization` - All org entries
- `GET/POST /api/geofence` - Manage geofence locations

## Building for Production

### EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## White-Label Configuration

Each client gets their own branded app by modifying:
- `app.json` - App name, bundle ID, icons
- `src/config/brand.ts` - Colors, logos, features
- Build with EAS under client's developer account

## License

Proprietary - SystemsF1RST Marketplace
