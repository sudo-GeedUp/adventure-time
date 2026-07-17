# App Not Loading - Troubleshooting Guide

## Quick Fixes

### 1. Clear Cache and Restart
```bash
# Kill any running processes
lsof -ti:8081 | xargs kill -9

# Clear cache and restart
npx expo start --clear
```

### 2. Check for Common Issues

#### Firebase Not Configured (Expected)
If you see: `"Firebase config not set up. Using local storage mode."`
- **This is OK!** The app will work in local mode until you configure Firebase
- See `FIREBASE_SETUP_GUIDE.md` to set up Firebase when ready

#### Analytics Not Available (Expected)
If you see: `"Analytics not available (Firebase may not be configured)"`
- **This is OK!** Analytics requires Firebase configuration
- App will work without analytics

### 3. Check Metro Bundler Output
Look for these messages:
- ✅ `"Metro waiting on..."` - Server is running
- ✅ QR code displayed - Ready to connect
- ❌ Red error messages - See specific errors below

---

## Common Errors and Solutions

### Error: "Firebase app already initialized"
**Cause**: Multiple Firebase initializations
**Solution**: Already fixed in latest code - restart Metro bundler

### Error: "Cannot find module"
**Cause**: Missing dependencies
**Solution**:
```bash
npm install
npx expo start --clear
```

### Error: "Unable to resolve module"
**Cause**: Cache issue or missing dependency
**Solution**:
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### App Shows White Screen
**Possible Causes**:
1. JavaScript error in component
2. Missing required context provider
3. Navigation configuration issue

**Solution**:
1. Check Metro bundler terminal for red errors
2. Open browser console (press `w` in Metro, then F12)
3. Look for specific error messages

### App Crashes on Startup
**Check**:
1. Metro bundler logs for errors
2. Device/simulator logs
3. ErrorBoundary should catch and display errors

---

## Testing Without Firebase

The app is designed to work WITHOUT Firebase configured:

**What Works**:
- ✅ UI and navigation
- ✅ Trail browsing (sample data)
- ✅ Map exploration
- ✅ Mini games
- ✅ Local storage features

**What Requires Firebase**:
- ⚠️ User authentication
- ⚠️ Real-time features
- ⚠️ Cloud storage
- ⚠️ Analytics

---

## Step-by-Step Debugging

### 1. Start Fresh
```bash
# Stop all processes
lsof -ti:8081 | xargs kill -9

# Clear everything
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start --clear
```

### 2. Check Terminal Output
Look for:
- ✅ "Starting Metro Bundler"
- ✅ QR code appears
- ✅ "Metro waiting on..."
- ❌ Any red ERROR messages

### 3. Try Web First
```bash
# In Metro terminal, press 'w' to open web
# Then press F12 to open browser console
# Look for errors in console
```

### 4. Check Specific Files
If you see errors mentioning specific files, check:
- `App.tsx` - Main app entry
- `navigation/RootNavigator.tsx` - Navigation setup
- `contexts/AuthContext.tsx` - Authentication
- `contexts/SubscriptionContext.tsx` - Subscription state

---

## Getting More Information

### Enable Verbose Logging
Add to `App.tsx` at the top of the `init()` function:
```typescript
console.log('=== App Initialization Started ===');
```

### Check Each Service
The app initializes these services in order:
1. Sentry (crash reporting) - optional
2. Firebase (auth, database) - optional
3. Analytics - optional
4. Notifications - optional

Each will log success or failure messages.

---

## Still Not Working?

### Provide These Details:
1. **Metro bundler output** - Copy the terminal output
2. **Error messages** - Any red errors shown
3. **Platform** - Web, iOS simulator, Android, or physical device
4. **What you see** - White screen, specific error, or nothing?

### Quick Test Commands
```bash
# Test if dependencies are installed
npm list expo react-native

# Test if TypeScript compiles
npx tsc --noEmit

# Test if Metro can bundle
npx expo export --platform web
```

---

## Expected Startup Sequence

When app loads successfully, you should see:

**Terminal**:
```
✓ Starting Metro Bundler
✓ Metro waiting on exp+adventure-time://...
✓ QR code displayed
```

**Console Logs** (in order):
```
Firebase config not set up. Using local storage mode.
Analytics not available (Firebase may not be configured)
Sentry DSN not configured, crash reporting disabled
```

**App Screen**:
- Welcome screen OR
- Login screen (if Firebase configured) OR
- Main navigation tabs

---

## Current Status

**Last Updated**: January 19, 2026

**Known Issues**: None

**Working**: 
- ✅ Metro bundler starts
- ✅ App compiles without errors
- ✅ All dependencies installed
- ✅ Services gracefully handle missing config

**Needs Configuration**:
- Firebase (optional, for auth/database)
- RevenueCat (optional, for subscriptions)
- Sentry (optional, for crash reporting)
