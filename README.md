Its Adventure Time - Offroad Recovery Assistance App

A mobile app built with Expo and React Native that helps drivers when their vehicle is stuck or broken on trails. Get AI-powered recovery procedures, access offline guides, and navigate trails without cell service.

## Features

### 📚 Self-Recovery Guides

- **Category Browser**: Organized guides by recovery situation
  - Stuck Vehicle (sand, mud, snow, rocks)
  - Mechanical Issues (engine, electrical, drivetrain)
  - Trail Navigation (GPS, trail finding, route planning)
  - Emergency Situations (injuries, weather, communication)
- **Search Functionality**: Quickly find specific guides
- **Offline Access**: All guides are bundled with the app

### 📸 AI-Powered Photo Analysis

- Take or upload a photo of your vehicle's situation
- OpenAI vision analysis returns a recommended recovery procedure
- Links through to the relevant bundled guide

### 🤖 Trail Buddy (Premium)

- Conversational AI assistant for recovery and trail questions
- Keeps recent context within a session

### 🗺️ Maps & Navigation

- Interactive map with user location and nearby offroaders (Firebase-backed)
- Turn-by-turn trail navigation with spoken callouts
- Offline trail and map tile caching
- Real-time weather from the National Weather Service API
- Trail condition analysis from community tips

### 🚨 Emergency

- SOS screen with emergency contact notification
- Location sharing history

### 👤 Profile & Vehicle

- Customizable profile with vehicle information
- Equipment tracking
- Vehicle maintenance and damage logs
- Emergency contact storage

### 💳 Premium Subscription

- Managed through RevenueCat (App Store / Play Store billing)

## Tech Stack

- **Framework**: Expo SDK 54 + React Native 0.81
- **Language**: TypeScript
- **Navigation**: React Navigation 7 (native-stack + bottom-tabs)
- **Maps**: react-native-maps
- **Location**: expo-location
- **Image Handling**: expo-image-picker
- **Backend**: Firebase (Auth + Realtime Database + Storage)
- **Local Storage**: AsyncStorage for offline data persistence
- **Payments**: RevenueCat (`react-native-purchases`)
- **AI**: OpenAI API
- **Crash Reporting**: Sentry
- **Weather**: National Weather Service API (no key required)
- **Icons**: Feather icons from `@expo/vector-icons`

## Getting Started

### Prerequisites

- Node.js 20+
- Expo Go app (for JS-only changes) or a development build
- Git

Note: this app uses native modules (RevenueCat, Firebase, maps). Expo Go is fine for
most UI work, but anything touching purchases or push notifications needs a
development build.

### Installation

```bash
git clone <repository-url>
cd its-adventure-time

npm install
npm start
```

`npm run dev` is a Replit-specific variant that sets packager proxy env vars. Use
`npm start` for local development.

### Environment

Copy the required values into a local `.env` (never commit it). Every variable
prefixed with `EXPO_PUBLIC_` is **inlined into the JS bundle at build time** and is
readable by anyone who downloads the app — never put a secret behind that prefix.

| Variable                         | Notes                                                             |
| -------------------------------- | ----------------------------------------------------------------- |
| `EXPO_PUBLIC_FIREBASE_*`         | Firebase web config. Public by design; secured by Firebase rules. |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat public SDK key. Public by design.                      |
| `EXPO_PUBLIC_SENTRY_DSN`         | Sentry DSN. Public by design.                                     |
| `EXPO_PUBLIC_AI_PROXY_URL`       | Cloudflare Worker URL for AI calls. Public by design; the Worker requires a Firebase ID token. |

The OpenAI key is **not** in this list on purpose — it lives as a secret on the
proxy Worker. See [`worker/README.md`](worker/README.md).

### Testing

#### On a physical device

1. Run `npm start`
2. Scan the QR code with the Camera app (iOS) or Expo Go (Android)

#### Web preview

```bash
npm run web
```

Several screens have `.web.tsx` variants because `react-native-maps` has no web
implementation.

## Project Structure

```
├── App.tsx                          # Root app component
├── app.config.js                    # Expo configuration (not app.json)
├── eas.json                         # EAS Build profiles
├── firebase.json                    # Firebase deploy config
├── database.rules.json              # Realtime Database security rules
├── storage.rules                    # Cloud Storage security rules
│
├── navigation/                      # Root stack, tab navigator, screen stacks
├── screens/                         # Screen components (+ .web.tsx variants)
├── components/                      # Reusable UI (ErrorBoundary, ThemedText, ...)
├── contexts/                        # AuthContext, SubscriptionContext
├── services/                        # openai, aiGuideService, authService,
│                                    #   notificationService, rallyNavigatorService,
│                                    #   analyticsService, sentryService
├── config/                          # firebase.ts, revenuecat.ts
├── utils/                           # storage, weather, location, offlineMaps, ...
├── hooks/                           # useTheme and friends
├── constants/                       # theme.ts — design system & colors
├── data/                            # guides.ts — recovery guide database
├── scripts/                         # App Store Connect API helper scripts
├── website/                         # Marketing / support site
├── store/                           # App Store listing assets & metadata
└── assets/images/                   # App icons & images
```

## Offline Features

The app is designed to work in areas without cell service:

- **Guides**: All recovery guides are bundled with the app
- **Trails & Map Tiles**: Cached as you browse; clearable from Settings
- **Weather Cache**: 30-minute cache
- **User Profile**: Saved locally
- **Community Tips**: Geo-tagged tips stored locally

Features that require connectivity: AI photo analysis, Trail Buddy, nearby
offroaders, and subscription changes.

## Design

- **High-Contrast Outdoor Theme**: Optimized for visibility in bright sunlight
- **Large Touch Targets**: Sized for gloved hands
- **Dark Theme**: Default dark theme for outdoor use

## Data Storage

### AsyncStorage Keys

All keys are prefixed `@adventure-time/`. Frequently used ones:

- `@adventure-time/user_profile` - User profile data
- `@adventure-time/saved_guides` - Bookmarked guides
- `@adventure-time/scan_history` - AI scan history
- `@adventure-time/weather_cache` - Cached weather data
- `@adventure-time/community_tips` - Geo-tagged tips
- `@adventure-time/emergency_contacts` - Emergency contacts
- `@adventure-time/offline_trails`, `@adventure-time/offline_map_tiles` - Offline cache

See `utils/storage.ts` for the full list.

## Security Notes

- **Never commit `.p8`, `.p12`, or `.pem` files.** `private_keys/` is gitignored and
  excluded from EAS build uploads via `.easignore`. Note that `.gitignore` does not
  apply to files that are already tracked.
- **`EXPO_PUBLIC_*` is not a secret store.** Anything under that prefix ships inside
  the app bundle. Server-side secrets belong behind a proxy endpoint.
- Firebase access is controlled by `database.rules.json` and `storage.rules`. Deploy
  rule changes with `firebase deploy --only database,storage`.

## Development

### Hot Reload

Code changes hot-reload automatically. Restart the dev server when you modify
`package.json` or change native dependencies.

### TypeScript

```bash
npx tsc --noEmit
```

### Lint & Format

```bash
npm run lint
npm run check:format
npm run format
```

## Bundle Identifier

- **iOS**: `com.masongallegos.itsadventuretime`
- **Android**: `com.masongallegos.itsadventuretime`

## Contributing

- Follow existing code style and patterns
- Use TypeScript for all new files
- Use Feather icons for all icon needs
- Run `npx tsc --noEmit` and `npm run check:format` before submitting
- Test on a physical device before submitting changes
- Do not ship placeholder, demo, or simulated content — App Review rejects it, and in
  a safety app fabricated data is actively dangerous

## License

Private project

## Support

For issues or questions, refer to the project's GitHub issues or contact the
development team.

---

**Its Adventure Time** - Get back on the trail with confidence.
