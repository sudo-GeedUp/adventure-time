# Production Setup Guide

## ✅ Completed Steps

### 1. eas.json Updated
- Apple Team ID: `2AU7KFCM84` (found in your Xcode project)
- Still need: `ascAppId` (will get after App Store Connect setup)

### 2. Environment Variables
- ✅ Firebase configured
- ✅ Google Maps API key configured
- ✅ OpenAI API key configured
- ✅ RevenueCat iOS key configured 
- ⚠️ Need: RevenueCat Android key
- ⚠️ Optional: OpenWeather API key
- ⚠️ Optional: Google OAuth keys

## 🔄 Remaining Steps

### Step 1: Get Your App Store Connect App ID

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps"
3. Select "Its Adventure Time" (or create it if not exists)
4. The App ID is in the URL: `https://appstoreconnect.apple.com/apps/[APP_ID]`
5. Copy the 10-digit App ID

### Step 2: Update eas.json with App ID

Replace `PLACEHOLDER_UPDATE_AFTER_APP_STORE_CONNECT_SETUP` with your actual App ID:

```json
"ascAppId": "1234567890"
```

### Step 3: Complete RevenueCat Setup

Follow the detailed steps in `APPSTORE_CONNECT_API_SETUP.md`:

1. Create App Store Connect API Key
2. Add it to RevenueCat dashboard
3. Enable server notifications
4. Find your 8-digit Apple App ID

### Step 4: Configure In-App Purchases

1. In App Store Connect, go to your app
2. Click "Features" > "In-App Purchases"
3. Create your subscription product:
   - Product ID: `com.adventuretime.premium.monthly`
   - Reference Name: "Premium Monthly"
   - Price: Choose your price tier
4. Set up subscription groups if needed
5. Add localization and review info

### Step 5: Get Android RevenueCat Key (if needed)

1. Go to RevenueCat dashboard
2. Select your app
3. Go to "Settings" > "Google Play"
4. Add your Google Play Console app
5. Copy the Android key

### Step 6: Update .env with Missing Keys

Add the missing values to your `.env` file:
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (from RevenueCat)
- `EXPO_PUBLIC_OPENWEATHER_API_KEY` (optional)
- Google OAuth keys (optional)

## 🚀 Build for Production

Once all steps are complete:

```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android (if ready)
eas build --platform android --profile production
```

## 📋 Pre-Submission Checklist

- [ ] App Store Connect App ID added to eas.json
- [ ] RevenueCat API configured with App Store Connect
- [ ] In-app purchases created in App Store Connect
- [ ] App metadata complete (description, screenshots, etc.)
- [ ] Privacy policy URL added
- [ ] App review guidelines followed
- [ ] Test build tested on TestFlight

## 🆘 Common Issues

### "No API key configured" error
- Ensure all environment variables are set
- Run `eas build --profile production` (not development)

### RevenueCat not working
- Check that App Store Connect API is properly configured
- Verify product IDs match exactly
- Ensure app is using production RevenueCat keys

### Build failures
- Check that Apple Developer account is active
- Verify bundle identifier matches App Store Connect
- Ensure certificates and provisioning profiles are valid
