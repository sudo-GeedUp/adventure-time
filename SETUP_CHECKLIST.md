# Adventure Time - Setup Checklist

## ✅ Completed

### Code Quality
- ✅ Removed debug console.logs from NavigateScreen
- ✅ Created Mini Games tab with Ant Smasher game
- ✅ Organized navigation structure

### Mini Games Feature
- ✅ Created `MiniGamesScreen.tsx` - Game selection screen
- ✅ Created `MiniGamesStackNavigator.tsx` - Navigation stack
- ✅ Moved Ant Game to Mini Games tab
- ✅ Updated MainTabNavigator with "Games" tab

## 🔧 API Keys Configuration Status

### Current Configuration (.env)
- ✅ **OpenAI API Key** - Configured
- ✅ **API URL** - Configured

### Missing API Keys (Need Setup)

#### 1. Firebase Configuration (7 keys needed)
**Purpose**: Real-time friends, adventures, live location sharing

Get from: https://console.firebase.google.com

Required keys:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

**Setup Guide**: See `FIREBASE_SETUP.md`

#### 2. Google Maps API Key
**Purpose**: Map rendering, location services

Get from: https://console.cloud.google.com

Required key:
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**Setup Steps**:
1. Go to Google Cloud Console
2. Create new project or select existing
3. Enable Maps SDK for iOS and Android
4. Create API key in Credentials
5. Restrict key to your app's bundle IDs

#### 3. RevenueCat API Keys
**Purpose**: In-app purchase subscriptions

Get from: https://app.revenuecat.com

Required keys:
```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
```

**Setup Steps**:
1. Create RevenueCat account
2. Create new project
3. Configure iOS and Android apps
4. Set up products (monthly subscription: `com.adventuretime.premium.monthly`)
5. Copy API keys from Settings

## 📱 Platform Testing Setup

### iOS (Ready)
- ✅ Can test on iOS Simulator
- ✅ Press `i` in Expo terminal

### Android (Ready)
- ✅ Android Studio installed
- ✅ Android SDK installed (API 36)
- ✅ Android emulator created (Medium_Phone_API_36.1)
- ✅ Press `a` in Expo terminal to test

### Web (Ready)
- ✅ Can test in browser
- ✅ Press `w` in Expo terminal

## 🚫 Intentionally Skipped (Per User Request)

### Premium Gates
- ⚠️ **NOT re-enabled** - Premium gates remain disabled for testing
- Location: `screens/AIScanScreen.tsx` lines 80, 136
- **Before App Store submission**: Uncomment premium subscription checks

## 🎯 Features Ready to Test

### Working Without API Keys
- ✅ Navigation structure
- ✅ UI/UX design
- ✅ Offline recovery guides
- ✅ Profile management
- ✅ Settings
- ✅ Mini Games (Ant Smasher)
- ✅ Welcome screen

### Requires OpenAI API Key (Configured ✅)
- ✅ AI Recovery Scan - Photo analysis feature

### Requires Firebase (Not Configured ❌)
- ❌ Real-time friends list
- ❌ Live location sharing
- ❌ Adventure sharing
- ❌ Chat functionality

### Requires Google Maps (Not Configured ❌)
- ❌ Interactive maps
- ❌ Trail visualization
- ❌ Nearby offroaders map

### Requires RevenueCat (Not Configured ❌)
- ❌ Subscription management
- ❌ Premium feature unlocking
- ❌ Purchase restoration

## 📋 Quick Start Testing

### Test Now (No Additional Setup)
```bash
# iOS Simulator
npx expo start
# Press 'i' when prompted

# Web Browser
npx expo start
# Press 'w' when prompted
```

### Test After Android Studio Setup
```bash
# Android Emulator
npx expo start
# Press 'a' when prompted
```

## 🔐 Security Notes

- ✅ `.env` file is in `.gitignore`
- ✅ Never commit API keys to git
- ✅ Use environment variables for all secrets
- ⚠️ Premium gates disabled for testing only

## 📝 Before App Store Submission

### Critical Tasks
1. ❌ Re-enable premium gates in AIScanScreen
2. ❌ Replace Stripe with Apple In-App Purchases
3. ❌ Configure production RevenueCat keys
4. ❌ Set up Firebase security rules
5. ❌ Test all premium features with real subscriptions
6. ❌ Remove test/debug code
7. ❌ Verify all API keys are production-ready

### Premium Features to Verify
According to product requirements, premium subscription unlocks:
- AI Scan feature
- Store/view previous adventures
- Trail updates
- Premium-only trail events/data warnings

## 🎮 New Features Added

### Mini Games Tab
- **Location**: Bottom tab navigation (rightmost tab)
- **Icon**: Smile emoji
- **Games Available**:
  - Ant Smasher - Interactive game for pets to chase ants
- **Future Games**: Easy to add more games to the grid

## 📊 Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Code Quality | ✅ Clean | Debug logs removed |
| Mini Games | ✅ Complete | Ant game moved to new tab |
| OpenAI | ✅ Configured | AI Scan ready to test |
| Firebase | ❌ Not Setup | Friends/chat won't work |
| Google Maps | ❌ Not Setup | Maps won't render |
| RevenueCat | ❌ Not Setup | Subscriptions won't work |
| iOS Testing | ✅ Ready | Simulator available |
| Android Testing | ✅ Ready | Emulator available (API 36) |
| Web Testing | ✅ Ready | Browser available |
| Premium Gates | ⚠️ Disabled | For testing only |

---

**Last Updated**: All platform testing ready (iOS, Android, Web)
**Next Priority**: Configure remaining API keys (Firebase, Google Maps, RevenueCat) for full feature testing
