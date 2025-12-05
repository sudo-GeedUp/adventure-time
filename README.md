;pkl# Adventure Time - Offroad Recovery Assistance App

A mobile app built with Expo and React Native that helps drivers when their vehicle is stuck or broken on trails. Get AI-powered recovery procedures, access offline guides, and coordinate rescue with nearby offroaders.

## Features

### 📚 Self-Recovery Guides
- **Category Browser**: Organized guides by recovery situation
  - Stuck Vehicle (sand, mud, snow, rocks)
  - Mechanical Issues (engine, electrical, drivetrain)
  - Trail Navigation (GPS, trail finding, route planning)
  - Emergency Situations (injuries, weather, communication)
- **Search Functionality**: Quickly find specific guides
- **Offline Access**: All guides available without internet

### 📸 AI-Powered Photo Analysis
- Upload photos or take pictures of your vehicle situation
- Get AI-powered recommendations for recovery procedures
- Visual step-by-step instructions

### 🗺️ Nearby Offroaders Map
- Interactive map showing user location and nearby offroaders
- Real-time weather from National Weather Service API
- Trail condition analysis from community tips
- 10-mile search radius visualization
- Contact nearby users for rescue coordination

### 👤 User Profile
- Customizable profile with vehicle information
- Track equipment you carry
- Save emergency contact information

## Tech Stack

- **Framework**: Expo SDK 54 + React Native
- **Navigation**: React Navigation 7
- **Maps**: react-native-maps with Google Maps provider
- **Location**: expo-location
- **Image Handling**: expo-image-picker
- **Storage**: AsyncStorage for offline data persistence
- **API**: National Weather Service API (no key required)
- **Icons**: Feather icons from @expo/vector-icons

## Getting Started

### Prerequisites
- Node.js 20+
- Expo Go app installed on your phone
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd adventure-time

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Testing

#### On Physical Device (iOS/Android)
1. Install the **Expo Go** app on your phone
2. Run `npm run dev` in the terminal
3. Scan the QR code shown in the terminal with:
   - **iOS**: Camera app
   - **Android**: Expo Go camera icon
4. App opens automatically and hot-reloads on code changes

#### Web Preview
```bash
npm run web
```

## Project Structure

```
├── App.tsx                          # Root app component
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
│
├── navigation/
│   ├── RootNavigator.tsx           # Root stack navigator
│   ├── MainTabNavigator.tsx        # Bottom tab navigation
│   └── [*StackNavigator.tsx]       # Screen stacks
│
├── screens/
│   ├── GuidesScreen.tsx            # Guide categories & search
│   ├── GuideDetailScreen.tsx       # Individual guide details
│   ├── AIScanScreen.tsx            # Photo analysis
│   ├── NearbyScreen.tsx            # Map & nearby users
│   ├── ProfileScreen.tsx           # User profile
│   ├── FriendsScreen.tsx           # Friend list & chat
│   └── [Other screens]
│
├── components/
│   ├── ErrorBoundary.tsx           # App crash handler
│   ├── ScreenScrollView.tsx        # Safe area scroll wrapper
│   ├── ThemedText.tsx              # Themed text component
│   ├── ThemedView.tsx              # Themed view component
│   └── [Other reusable components]
│
├── utils/
│   ├── storage.ts                  # AsyncStorage utilities
│   ├── weather.ts                  # Weather API integration
│   ├── conditions.ts               # Trail condition analysis
│   ├── location.ts                 # Location utilities
│   └── firebaseHelpers.ts          # Firebase helpers
│
├── hooks/
│   └── useTheme.ts                 # Theme context hook
│
├── constants/
│   └── theme.ts                    # Design system & colors
│
├── config/
│   └── firebase.ts                 # Firebase config
│
├── data/
│   └── guides.ts                   # Recovery guide database
│
└── assets/
    └── images/                     # App icons & images
```

## Offline Features

The app is designed to work offline in areas without cell service:

- **Guides**: All recovery guides stored locally
- **Weather Cache**: 30-minute cache for weather data
- **User Profile**: Saved locally
- **Community Tips**: Geo-tagged tips stored locally

## Design

- **High-Contrast Outdoor Theme**: Optimized for visibility in bright sunlight
- **Large Touch Targets**: 56x56pt minimum for gloved hands
- **Liquid Glass UI**: Modern iOS 26+ design aesthetic
- **Dark Theme**: Default dark theme for outdoor use

## Data Storage

### AsyncStorage Keys
- `@trailguard/user_profile` - User profile data
- `@trailguard/saved_guides` - Bookmarked guides
- `@trailguard/recent_scans` - AI scan history
- `@trailguard/weather_cache` - Cached weather data
- `@trailguard/community_tips` - Geo-tagged tips

## Development

### Hot Reload
Code changes hot-reload automatically. Only restart the dev server when:
- Modifying `package.json` (installing new packages)
- Changing native dependencies

### Debugging

#### Logs
View logs in the terminal where you ran `npm run dev`

#### Debugger
Press `j` in the terminal while the dev server is running to open the debugger

#### Remote Debugging
Press `m` to access more developer tools

### TypeScript
```bash
# Check for type errors
npx tsc --noEmit
```

## Future Features

- AI Vision API integration for better image analysis
- Real-time database for live offroader coordination
- Push notifications for rescue coordination
- Enhanced weather sources and radar data
- Gamified badge system
- Stripe payment integration for premium features

## Bundle Identifier

- **iOS**: `com.trailguard.app`
- **Android**: `com.trailguard.app`

## Contributing

- Follow existing code style and patterns
- Use TypeScript for all new files
- Use Feather icons for all icon needs
- Test on physical device before submitting changes
- Update `replit.md` with significant changes

## License

Private project

## Support

For issues or questions, refer to the project's GitHub issues or contact the development team.

---

**Adventure Time** - Get back on the trail with confidence.
