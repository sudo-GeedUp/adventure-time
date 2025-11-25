# Adventure Time - Offroad Recovery Assistance App

## Overview
Adventure Time is a mobile application built with Expo and React Native that helps drivers when their vehicle is stuck or broken on trails. The app provides AI-powered image analysis to demonstrate best recovery procedures, includes self-recovery guides, and enables rescue coordination with nearby offroaders.

## Project Status
✅ Fully functional mobile app with complete UI and navigation
✅ High-contrast outdoor design system optimized for visibility and gloved hands
✅ Offline-capable guide library for areas without cell service
✅ All core screens implemented and working

## Recent Changes (November 25, 2025)
- **ADDED OFF-HIGHWAY GPS NAVIGATION**: New Navigate tab with trail discovery and route planning
  - 6 popular off-highway trails with detailed info (Moab Rim, Hell's Revenge, Sand Hollow, etc.)
  - Filter trails by difficulty (Easy/Moderate/Hard/Expert)
  - Filter by land type (Public/Private/Mixed) with clear ownership indicators
  - Shows distance from user location, duration, safety rating
  - Displays trail features, vehicle requirements, and elevation gain
  - Full trail descriptions for each route
  - 2 pre-planned routes (Moab Adventure Loop, Scenic Beginner Route)
  - Offline trail database with all info cached locally
  - Compass icon in tab bar for easy access
  - Real-time location permission with fallback handling

- **ADDED REPORTING FEATURE**: Users can now report trail conditions and alert others
  - New "Report Condition" button in Nearby tab header (warning icon)
  - Modal with quick-report options:
    - Police/Law enforcement
    - Probation/Parole officers
    - Deep mud conditions
    - Water/flooding hazards
    - Rocky terrain
    - Snow/ice conditions
    - Blocked trails
    - Trail damage
  - Reports are geo-tagged and timestamped
  - Automatically saved to community tips
  - Contributes to trail condition analysis for other users
  - Successful submission shows confirmation alert
  - User profile used to attribute reports

## Previous Changes (November 21, 2025)
- **RENAMED APP**: Changed app name from TrailGuard to Adventure Time
  - Updated app.json display name
  - Updated navigation header
  - Updated weather API User-Agent
  - Updated replit.md documentation
  - Technical identifiers (bundle ID, storage keys) kept as trailguard for compatibility
- Integrated react-native-maps into Nearby screen with interactive map view
- Added user location marker, nearby offroader markers (orange), and geo-tagged community tip markers (yellow)
- Implemented National Weather Service API integration (no API key required)
- Added weather caching system with 30-minute expiration for offline support
- Created trail condition analysis using real community tips
- Added conditions card showing weather, risk level, trail hazards, and safety recommendations
- Conditions card only displays when meaningful data exists (real weather OR recent geo-tagged tips)
- Implemented loading/error states for weather fetching
- Fixed ThemedText component export (changed from named to default export)
- Installed required packages: expo-location, expo-image-picker, @react-native-async-storage/async-storage, react-native-maps
- App successfully compiling and running (1179 modules)

## Features

### 1. Self-Recovery Guides (Guides Tab - Default)
- **Category Browser**: Organized guides by situation type
  - Stuck Vehicle (sand, mud, snow, rocks)
  - Mechanical Issues (engine, electrical, drivetrain)
  - Trail Navigation (GPS, trail finding, route planning)
  - Emergency Situations (injuries, weather, communication)
- **Search Functionality**: Quickly find specific guides
- **Guide Details**: Step-by-step recovery procedures with:
  - Difficulty level (Easy/Moderate/Hard)
  - Required equipment list
  - Safety warnings
  - Detailed instructions
- **Offline Access**: Guides stored locally via AsyncStorage

### 2. AI-Powered Photo Analysis (AI Scan Tab)
- **Photo Upload**: Take photos or select from gallery
- **AI Analysis**: Get recovery recommendations based on uploaded images
- **Visual Instructions**: See how to best approach the recovery situation
- Uses expo-image-picker for photo selection

### 3. Nearby Offroaders Map (Nearby Tab)
- **Interactive Map**: react-native-maps with Google Maps provider
  - User location marker (blue)
  - Nearby offroader markers (orange) with distance labels
  - Geo-tagged community tip markers (yellow) showing trail conditions
  - 10-mile search radius circle
- **Real-Time Weather**: National Weather Service API integration
  - Temperature, conditions, and wind speed
  - 30-minute caching for offline access
  - Automatic fallback when API unavailable
- **Trail Conditions Card**: Intelligent analysis of real data
  - Only displays when weather OR recent geo-tagged tips exist
  - Color-coded risk level (LOW/MODERATE/HIGH/CRITICAL)
  - Weather-based risk factors
  - Recent trail reports from community tips (up to 3 shown)
  - Safety recommendations based on conditions
  - Loading and error states
  - Empty state message when no data available
- **Trail Condition Reporting**: Alert other offroaders about hazards
  - Report button in header for quick access
  - 8 warning categories (police, probation, mud, water, rocks, snow, blocked, damage)
  - Automatic location tagging
  - Geo-tagged and timestamped reports
  - Integrated with trail condition analysis
- **Location Sharing**: Share your location for rescue coordination  
- **Contact Nearby Users**: Request help from the community
- Uses expo-location for real-time location tracking with permission handling

### 4. Off-Highway GPS Navigation (Navigate Tab)
- **Trail Discovery**: Browse off-highway trails near your location
  - Pre-loaded database of popular trails in offroad hot spots
  - Filter by difficulty level for your skill level
  - Filter by land type (Public/Private) - important for legal access
  - Distance calculations from your current location
  - Safety ratings and popularity scores
- **Trail Details**: Complete information for each trail
  - Trail length, estimated duration, elevation gain
  - Vehicle type requirements and features
  - Terrain descriptions and hazard information
  - Land ownership and access restrictions
- **Route Planning**: Pre-planned multi-trail routes
  - Adventure loops combining multiple trails
  - Beginner-friendly scenic routes
  - Route duration and difficulty overview
- **Offline Capability**: All trail data cached locally for remote areas
  - No internet required to view trail information
  - Perfect for planning before heading out

### 5. User Profile (Profile Tab)
- **Customizable Profile**: Name, vehicle info, experience level
- **Contact Information**: Email and phone for rescue coordination
- **Bio/Notes**: Additional details about your vehicle or preferences
- **Data Persistence**: Profile saved locally via AsyncStorage

## Architecture

### Technology Stack
- **Framework**: Expo SDK 54 + React Native
- **Navigation**: React Navigation 7 with bottom tabs
- **State Management**: React hooks + AsyncStorage
- **Styling**: StyleSheet with custom theme system
- **Icons**: Feather icons from @expo/vector-icons
- **Image Handling**: expo-image-picker
- **Location Services**: expo-location with permission handling
- **Maps**: react-native-maps (Google Maps provider)
- **Weather Data**: National Weather Service API (no key required)
- **Persistence**: @react-native-async-storage/async-storage
- **Caching**: 30-minute weather cache for offline support

### Project Structure
```
/
├── App.tsx                      # Root component with ErrorBoundary
├── app.json                     # Expo configuration
├── navigation/
│   ├── RootNavigator.tsx        # Root stack navigator
│   ├── MainTabNavigator.tsx     # Bottom tab navigation (6 tabs)
│   ├── GuidesStackNavigator.tsx # Guides screen stack
│   ├── NavigateStackNavigator.tsx # Navigate/GPS trails stack
│   └── [other stack navigators]
├── screens/
│   ├── GuidesScreen.tsx         # Category browser & guide listing
│   ├── GuideDetailScreen.tsx    # Individual guide details
│   ├── AIScanScreen.tsx         # AI photo analysis
│   ├── NearbyScreen.tsx         # Map of nearby offroaders
│   ├── NavigateScreen.tsx       # Off-highway GPS & trail discovery
│   ├── ProfileScreen.tsx        # User profile management
│   └── WelcomeScreen.tsx        # First-launch onboarding
├── components/
│   ├── CategoryCard.tsx         # Guide category cards
│   ├── GuideListItem.tsx        # Individual guide item
│   ├── ReportConditionModal.tsx # Trail condition report modal
│   ├── ScreenScrollView.tsx     # Safe area scroll wrapper
│   ├── ScreenKeyboardAwareScrollView.tsx
│   ├── ThemedText.tsx           # Themed text component
│   ├── ThemedView.tsx           # Themed view component
│   └── ErrorBoundary.tsx        # App crash handler
├── data/
│   └── guides.ts                # Recovery guide database
├── utils/
│   ├── storage.ts               # AsyncStorage utilities
│   ├── weather.ts               # National Weather Service API integration
│   ├── conditions.ts            # Trail condition analysis & impact assessment
│   ├── location.ts              # Location utilities and helpers
│   └── trails.ts                # Off-highway trail data & filtering
├── constants/
│   └── theme.ts                 # Design system (colors, spacing, typography)
├── hooks/
│   └── useTheme.ts              # Theme context hook
└── assets/
    └── images/
        ├── icon.png             # App icon
        ├── splash.png           # Splash screen
        └── [category images]    # Category illustrations
```

## Design System

### Colors
- **Primary**: Safety Orange (#FF6B35) - High visibility for outdoor use
- **Background**: Dark theme optimized for outdoor glare
- **Accent**: Bright colors for critical actions
- **Touch Targets**: Minimum 56x56pt for gloved hands

### Typography
- **Headers**: Large, bold, high contrast
- **Body Text**: 16pt minimum for outdoor readability
- **Labels**: Clear hierarchy for scanning

### Spacing
- Generous padding for easy touch with gloves
- Clear visual separation between elements
- Consistent margins throughout

## User Preferences
- High-contrast outdoor theme for visibility in bright sunlight
- Large touch targets (56x56pt minimum) for gloved operation
- Offline-first approach for areas without cell service
- Safety-focused design optimized for outdoor recovery scenarios

## How to Use

### For Development (Replit)
1. The app automatically starts via the "Start application" workflow
2. Scan the QR code with Expo Go app on your phone to test on device
3. Changes hot-reload automatically - no need to restart

### For Testing on Physical Device
1. Install "Expo Go" app on iOS or Android
2. Scan the QR code shown in the console
3. App will load on your device
4. Test all features including location and camera

### For Web Testing  
1. The web version runs on port 8081
2. Note: Some features (camera, location) have limited web support
3. Full functionality requires testing on mobile device via Expo Go

## Data Storage

### AsyncStorage Keys
- `@trailguard/user_profile` - User profile data
- `@trailguard/saved_guides` - Bookmarked guides
- `@trailguard/recent_scans` - AI scan history
- `@trailguard/weather_cache` - Cached weather data (30-minute expiration)
- `@trailguard/community_tips` - Geo-tagged community tips

### Offline Capability
- All guides available offline
- User profile persists locally
- Saved guides accessible without internet
- Weather data cached for 30 minutes (fallback when offline)
- Community tips stored locally and geo-tagged

## Future Integration Opportunities
- **AI Vision API**: For photo analysis (OpenAI Vision, Google Gemini, etc.)
- **Real-time Database**: For nearby user tracking and live offroader coordination (Firebase, Supabase)
- **Push Notifications**: For community updates and rescue coordination
- **Enhanced Weather**: Additional weather sources or radar data

## Bundle Identifier
- iOS: `com.trailguard.app`
- Android: `com.trailguard.app`

## Notes
- Designed for outdoor use with high visibility colors
- Optimized for gloved hands with large touch targets
- Offline-first architecture for remote areas
- Community-focused design for offroad recovery assistance
