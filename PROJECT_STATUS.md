# Its Adventure Time - Project Status & Launch Checklist

Last updated: 2026-07-31  
App version: 2.1.1 (iOS build 5, Android versionCode 10)  
Expo SDK: 54.0.36  
Bundle ID: `com.masongallegos.itsadventuretime`

---

## What changed recently

- Confirmed the "Start Adventure" button and live route tracking are already in place.
- Fixed `WelcomeScreen.tsx` title wrapping.
- Fixed `ActiveAdventureScreen.tsx` bottom action card positioning.
- Premium paywalls re-enabled in `AIScanScreen.tsx` for both `handleTakePhoto()` and `handleUploadPhoto()`.
- Added premium gate for Earned Badges in `ProfileScreen.tsx`.
- Identified a runtime-version mismatch: older production installs are on runtime `1.0.5`, but recent EAS updates target `exposdk:54.0.0`. OTA updates will not apply until a new binary with the matching runtime is installed.

---

## Configuration status

| Key / Service | Status | Notes |
|---------------|--------|-------|
| Firebase (all 7 keys) | Configured | All required keys are present in `.env` |
| OpenAI API Key | Configured | Used by AI Guide and the recovery-analysis service |
| OpenWeather API Key | Configured | Weather widget and AI Guide context |
| Google Maps API Key | Configured | Native maps on Android; iOS uses Apple Maps by default |
| RevenueCat iOS Key | Configured | `.env` has the iOS key |
| RevenueCat Android Key | Configured | `.env` has the Android key |
| Sentry DSN | Not configured | Add `EXPO_PUBLIC_SENTRY_DSN` to enable crash reporting |
| Push notification mode | Not configured | Defaults to `production`; set `EXPO_PUBLIC_NOTIFICATIONS_MODE` if you want to override |

---

## Must do before launch

### App Store build & deployment
- [ ] Finish the iOS production build locally
- [ ] Upload the `.ipa` to App Store Connect via Apple Transporter
- [ ] Install the new build on a physical iPhone and confirm the runtime version matches (`exposdk:54.0.0`)
- [ ] Smoke-test the full device flow: auth, map, start adventure, GPS route tracking, save route, speedometer, SOS, weather, AI Guide
- [ ] Test on a physical Android device
- [ ] Complete App Store Connect listing: description, keywords, screenshots, privacy policy, terms of service, in-app purchase setup
- [ ] Submit for review

### Code & feature completion
- [ ] Replace the mocked `analyzeImage()` in `AIScanScreen.tsx` with `analyzeRecoverySituation()` from `services/openai.ts`
- [ ] Add `EXPO_PUBLIC_SENTRY_DSN` to `.env` to enable Sentry crash reporting
- [ ] Confirm RevenueCat product IDs match the App Store / Play Console products:
  - `com.masongallegos.itsadventuretime.premium.monthly.v2`
  - `com.masongallegos.itsadventuretime.premium.yearly.v2`
- [ ] Verify Firebase security rules are production-hardened
- [ ] Remove any remaining test/debug/mock code

---

## Should do for a better launch

- [ ] Implement and test push notification handlers (permission request, friend requests, trail alerts)
- [ ] Add Firebase Analytics event tracking for key user actions
- [ ] Add loading skeletons and improved empty states where missing
- [ ] Add haptic feedback and retry mechanisms where missing

---

## Already done

- Core app structure and 7-tab navigation
- Trail database and discovery with filtering
- Map-based explore screen
- Active adventure tracking with route saving
- Speedometer with average and max speed
- Emergency SOS with location sharing
- Profile management and friends system
- Mini games (Ant Smasher)
- "You Pick" random adventure
- Email/password authentication
- AI Virtual Guide (Trail Buddy)
- Firebase integration (auth, realtime database, storage)
- Trail events and warnings
- Photo capture and AI Recovery Scan
- Weather widget
- Social features (friends, messaging)
- Offline maps support
- Premium gates re-enabled in `AIScanScreen` and `ProfileScreen`
- Sentry and analytics services wired up in the app (Sentry just needs the DSN)

---

## Premium features

### Current status

Premium gates have been re-enabled across the app.

- `AIScanScreen.tsx`:
  - `handleTakePhoto()` shows a premium paywall for free users
  - `handleUploadPhoto()` shows a premium paywall for free users
  - Title and description show conditional premium messaging
- `ProfileScreen.tsx`:
  - Achievement Badges grid is locked behind a premium upsell card for free users

### Premium feature list

1. **AI Recovery Scan** - Camera/photo analysis with GPT-4o-mini
   - The service implementation exists in `services/openai.ts`
   - `AIScanScreen.tsx` currently uses a hard-coded mock; must call the real service before launch
2. **Unlimited Adventure History** - Save unlimited completed adventures
3. **Achievement Badges** - Unlock all milestone badges
4. **Advanced Statistics** - Detailed insights and analytics

### Premium verification checklist

- [x] Re-enable premium gates in `handleTakePhoto()`
- [x] Re-enable premium gates in `handleUploadPhoto()`
- [x] Restore conditional UI text with premium messaging
- [x] Add premium gate for Earned Badges on `ProfileScreen`
- [ ] Wire real OpenAI analysis into `AIScanScreen`
- [ ] Test premium subscription flow works correctly
- [ ] Verify free users see paywall when attempting AI Recovery
- [ ] Verify premium users can access AI Recovery without restrictions
- [ ] Verify free users see the paywall for Achievement Badges
- [ ] Verify premium users can view all Achievement Badges

---

## Testing checklist

### Launch & navigation
- [ ] App launches without crash
- [ ] Splash screen appears then transitions to app
- [ ] Bottom tab navigation works
- [ ] Back buttons work where applicable
- [ ] No screens freeze or crash

### Authentication
- [ ] Can sign up with email/password
- [ ] Can sign in with existing account
- [ ] Can sign out
- [ ] App remembers user session
- [ ] Profile screen shows user info

### Subscriptions
- [ ] Paywall screen opens
- [ ] Monthly and Yearly plans are visible
- [ ] Plan selection works
- [ ] Purchase / restore works in RevenueCat test/sandbox mode
- [ ] Paywall can be dismissed

### GPS & maps
- [ ] Location permission requested on first use
- [ ] Map shows current location
- [ ] Map loads without errors
- [ ] Can zoom and pan

### Active adventure
- [ ] Can start an adventure
- [ ] GPS tracking begins
- [ ] Speed displays correctly
- [ ] Can pause/resume and stop/finish
- [ ] Adventure saves correctly

### AI recovery
- [ ] AI Recovery Scan screen opens
- [ ] Can take or upload a photo
- [ ] Real OpenAI integration returns results or a proper error
- [ ] No crashes when using AI features

### UI/UX
- [ ] All buttons respond to taps
- [ ] No layout issues on a physical device
- [ ] Loading and empty states show properly
- [ ] Error messages display correctly

### Device integration
- [ ] Camera permission works for AI Scan
- [ ] Location permission works
- [ ] Basic offline mode works
- [ ] App handles background/foreground switching

---

## Quick start

### Install dependencies
```bash
npm install
```

### Start on iOS Simulator
```bash
npx expo start
# Press 'i' when prompted
```

### Start on Android Emulator
```bash
npx expo start
# Press 'a' when prompted
```

### Start in browser
```bash
npx expo start
# Press 'w' when prompted
```

### Clear cache if Metro is stuck
```bash
npx expo start --clear
```

---

## Security notes

- `.env` is in `.gitignore`. Never commit API keys.
- Production RevenueCat API keys are read from `.env`:
  - `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
  - `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- Before submission, test with both free and premium accounts.
- Any `.p8`, `.pem`, or credential files should be stored in a secure vault, not in the repo. They are ignored by `.gitignore` but still present on disk.
