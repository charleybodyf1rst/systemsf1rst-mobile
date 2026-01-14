# SystemsF1RST Mobile - Claude Code Instructions

## Project Scope

This is the **SystemsF1RST Mobile App** - a React Native (Expo) mobile application for the SystemsF1RST Marketplace CRM platform.

**DO NOT** confuse with:
- `systemsf1rst-app` - Tauri desktop app (different repo)
- `systemsf1rst-webapp` - Next.js web CRM (different repo)
- `bodyf1rst-app-v2` - Different product (BodyF1RST mobile)
- `securityf1rst-mobile` - Different product (SecurityF1RST mobile)

## Architecture

```
┌─────────────────────────────────────────┐
│      React Native (Expo 52)             │
│  - Expo Router for navigation           │
│  - Zustand for state                    │
│  - Axios for API calls                  │
└────────────────────┬────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────┐
│      BodyF1rst-Backend-CLEAN (Laravel)   │
│  - /api/time-clock/* routes             │
│  - /api/crm/* routes                    │
│  - Laravel Sanctum auth                 │
└─────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `app.json` | Expo configuration |
| `src/app/` | Expo Router screens |
| `src/stores/` | Zustand state management |
| `src/lib/api.ts` | API client |
| `eas.json` | EAS Build configuration |

## Route Structure (Expo Router)

```
src/app/
├── (auth)/            # Unauthenticated screens
│   ├── login.tsx
│   └── forgot-password.tsx
├── (employee)/        # Employee role (base access)
│   ├── _layout.tsx
│   ├── index.tsx      # Dashboard
│   ├── clock/         # Time clock
│   └── messages/      # Messaging
├── (manager)/         # Manager role (includes employee)
│   ├── team/          # Team management
│   └── approvals/     # Timesheet approvals
└── (admin)/           # Admin role (full access)
    ├── employees/     # Employee management
    └── geofence/      # Geofence settings
```

## Store Structure

| Store | File | Purpose |
|-------|------|---------|
| auth | `authStore.ts` | Authentication, user role |
| timeClock | `timeClockStore.ts` | Clock state, entries |

## Development Guidelines

### Adding New Screens
1. Create screen in appropriate role group `(employee)`, `(manager)`, or `(admin)`
2. Add to navigation if needed
3. Use existing stores or create new one

### API Integration
All backend calls go through `src/lib/api.ts`:
```typescript
import { api } from '@/lib/api';
const status = await api.get('/time-clock/status');
```

### Role-Based Access
Screens are organized by role:
- `(employee)` - All users can access
- `(manager)` - Managers and admins only
- `(admin)` - Admins only

Check role before navigation:
```typescript
const { user } = useAuthStore();
if (user?.role !== 'admin') {
  router.replace('/(employee)');
}
```

## Backend Routes Used

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/time-clock/clock-in` | POST | Clock in |
| `/api/time-clock/clock-out` | POST | Clock out |
| `/api/time-clock/status` | GET | Current status |
| `/api/time-clock/history` | GET | User history |
| `/api/time-clock/summary` | GET | Weekly summary |
| `/api/time-clock/team` | GET | Team entries (manager) |
| `/api/time-clock/{id}/approve` | POST | Approve entry |
| `/api/time-clock/{id}/reject` | POST | Reject entry |
| `/api/geofence` | GET/POST | Geofence management |

## Testing

```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Building for Production

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

## Common Issues

### Location permissions
- Ensure `expo-location` is properly configured in `app.json`
- Request permissions before accessing location

### API authentication
- Verify token is stored in AsyncStorage
- Check `api.ts` interceptors for token attachment

### Build errors
- Clear cache: `npx expo start --clear`
- Reinstall: `rm -rf node_modules && npm install`

## Related Repos

- **Backend**: `BodyF1rst-Backend-CLEAN` - Central Laravel API
- **Desktop**: `systemsf1rst-app` - Tauri desktop app
- **Web**: `systemsf1rst-webapp` - Web version of CRM
- **Marketing**: `systemsf1rst-marketing` - Landing page
