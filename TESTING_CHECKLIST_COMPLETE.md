# Complete App Testing Checklist
## Venture Time - Manual Testing Guide

**Date:** February 7, 2026  
**Version:** 1.0.0  
**Platform:** iOS & Android

---

## ✅ AUTOMATED TESTS COMPLETED

| Test | Status | Notes |
|------|--------|-------|
| ESLint Code Quality | ✅ PASS | Minor formatting warnings remain |
| Prettier Formatting | ✅ PASS | Auto-fixed 300+ files |
| TypeScript Type Check | ⚠️ PARTIAL | Missing `expo-image-manipulator` dependency |
| Configuration Validation | ✅ PASS | app.json & eas.json valid |

---

## 🔴 CRITICAL ISSUES FOUND

### 1. Missing Dependency
**Issue:** `expo-image-manipulator` not installed  
**Impact:** AI image optimization features won't work  
**Fix:**
```bash
npx expo install expo-image-manipulator
```

### 2. Missing Environment Variables
These are NOT set in `.env.local`:
- `EXPO_PUBLIC_FIREBASE_API_KEY` - Required for auth/database
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` - Required for iOS subscriptions
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` - Required for Android subscriptions
- `EXPO_PUBLIC_OPENAI_API_KEY` - Required for AI Scan feature
- `EXPO_PUBLIC_SENTRY_DSN` - Required for crash reporting
- `SENTRY_ORG` - Required for Sentry build
- `SENTRY_PROJECT` - Required for Sentry build

**Action:** Copy values from `.env.example` and fill in your actual API keys.

---

## 📱 MANUAL TESTING CHECKLIST

### A. Launch & Basic Functionality

#### A1. App Launch
- [ ] App launches without crash
- [ ] Splash screen displays correctly
- [ ] App transitions to home screen
- [ ] No console errors on launch

#### A2. Navigation
- [ ] Bottom tab navigation works
- [ ] All 5 tabs accessible (Home, Navigate, Adventure, Community, Profile)
- [ ] Back button works correctly
- [ ] Deep linking works (if configured)

#### A3. UI/UX
- [ ] Dark mode toggle works
- [ ] Theme colors consistent
- [ ] All buttons tappable
- [ ] Text readable on all screen sizes
- [ ] Loading states show correctly

---

### B. Authentication

#### B1. Sign Up
- [ ] Email sign-up works
- [ ] Google sign-up works (if configured)
- [ ] Apple sign-up works (iOS)
- [ ] Validation shows for invalid email
- [ ] Password strength indicator works

#### B2. Sign In
- [ ] Email sign-in works
- [ ] "Remember me" persists session
- [ ] Forgot password flow works
- [ ] Error messages clear and helpful

#### B3. Profile
- [ ] Profile photo upload works
- [ ] Name/display name editable
- [ ] Sign out works
- [ ] Account deletion (if required by Apple)

---

### C. Core Features

#### C1. GPS & Navigation
- [ ] Location permission prompt shows
- [ ] Current location displays on map
- [ ] Trail recording starts/stops
- [ ] Route polyline draws correctly
- [ ] Background tracking works (if enabled)
- [ ] GPS coordinates accurate

#### C2. AI Scan Feature (Premium)
- [ ] Camera opens when tapping AI Scan
- [ ] Photo capture works
- [ ] AI analysis processes image
- [ ] Results display correctly
- [ ] History of scans saved

#### C3. Offline Maps (Premium)
- [ ] Map downloads for offline use
- [ ] Offline maps accessible without data
- [ ] Cache clears properly

#### C4. Weather Integration
- [ ] Weather data loads
- [ ] Trail conditions display
- [ ] Weather alerts show

---

### D. Premium Subscriptions

#### D1. Paywall
- [ ] Paywall displays for premium features
- [ ] Pricing clear ($4.99/month, $9.99/month)
- [ ] Feature comparison table accurate
- [ ] Restore purchases button works

#### D2. In-App Purchase (iOS)
- [ ] Purchase flow completes
- [ ] Apple Pay sheet shows
- [ ] Transaction succeeds
- [ ] Premium unlocks immediately

#### D3. In-App Purchase (Android)
- [ ] Google Play billing works
- [ ] Purchase succeeds
- [ ] Premium unlocks immediately

#### D4. Subscription Management
- [ ] Status shows "Active" when subscribed
- [ ] Cancel subscription option works
- [ ] Expiration date displays
- [ ] Grace period handled (if configured)

---

### E. Community Features

#### E1. Community Tips
- [ ] Tips list loads
- [ ] Pull-to-refresh works
- [ ] Premium users can POST tips
- [ ] Free users see upgrade prompt when trying to post
- [ ] Liking/bookmarking works

#### E2. Trail Events/Warnings
- [ ] Events display on map
- [ ] Real-time updates work
- [ ] Premium users can create events
- [ ] Notifications for nearby events (if enabled)

#### E3. Social Features
- [ ] Share trail works
- [ ] Share adventure summary works
- [ ] Deep links to shared content work

---

### F. Data & Storage

#### F1. Saved Adventures
- [ ] Adventures save locally
- [ ] Adventures sync to cloud (if logged in)
- [ ] Can view adventure history
- [ ] Can delete old adventures

#### F2. Settings
- [ ] Settings persist after app restart
- [ ] Units (metric/imperial) toggle works
- [ ] Privacy settings save
- [ ] Notification preferences work

---

### G. Edge Cases & Error Handling

#### G1. Network Issues
- [ ] App works offline (basic features)
- [ ] Graceful error when no connection
- [ ] Retry button on failed requests
- [ ] Queue actions for when online

#### G2. Permissions
- [ ] Location denied: shows helpful message
- [ ] Camera denied: shows helpful message
- [ ] Photos denied: shows helpful message
- [ ] Can open Settings from permission prompts

#### G3. Input Validation
- [ ] Empty fields show validation
- [ ] Invalid email caught
- [ ] Special characters handled
- [ ] Max length enforced

---

### H. Performance

#### H1. Load Times
- [ ] App launches under 3 seconds
- [ ] Map loads within 5 seconds
- [ ] Screens transition smoothly
- [ ] No janky animations

#### H2. Battery & Resources
- [ ] GPS doesn't drain battery excessively
- [ ] App doesn't crash on low memory
- [ ] Background location stops when not needed
- [ ] Cache doesn't grow unbounded

---

### I. App Store Compliance

#### I1. iOS Requirements
- [ ] No external payment links (Stripe removed)
- [ ] In-App Purchase for premium features
- [ ] Privacy policy accessible
- [ ] Sign in with Apple works (if implemented)

#### I2. Android Requirements
- [ ] Google Play billing for IAP
- [ ] Adaptive icon displays correctly
- [ ] App bundle size under 150MB
- [ ] Target SDK version compliant

---

## 🧪 TESTING ENVIRONMENTS

### Device Testing Matrix

| Device | iOS Version | Android Version | Status |
|--------|-------------|-----------------|--------|
| iPhone 15 Pro | 17.x | - | ⏳ Pending |
| iPhone 14 | 16.x | - | ⏳ Pending |
| iPad Pro | 17.x | - | ⏳ Pending |
| Samsung Galaxy S23 | - | 14 | ⏳ Pending |
| Google Pixel 7 | - | 14 | ⏳ Pending |

### Network Conditions
- [ ] Test on WiFi
- [ ] Test on 4G/5G
- [ ] Test in airplane mode (offline)
- [ ] Test on slow connection

---

## 🐛 KNOWN ISSUES LOG

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| expo-image-manipulator missing | 🔴 High | ⏳ Fix pending | Blocks AI optimization |
| Firebase config missing | 🔴 High | ⏳ Needs env vars | Auth won't work |
| RevenueCat keys missing | 🔴 High | ⏳ Needs env vars | IAP won't work |
| Sentry DSN missing | 🟡 Medium | ⏳ Needs env var | Crash tracking off |

---

## ✅ SIGN-OFF CHECKLIST

Before submitting to stores:

- [ ] All critical issues resolved
- [ ] Manual tests completed on physical device
- [ ] No crashes in last 24 hours of testing
- [ ] App Store screenshots current
- [ ] Privacy policy published
- [ ] Support email configured
- [ ] Analytics verified (events logging)
- [ ] IAP tested with real transaction (use test account)
- [ ] Version number bumped
- [ ] Release notes written

---

**Tested By:** _________________  
**Date Completed:** _________________  
**Approved for Release:** ☐ Yes ☐ No

---

*Print this checklist and mark off items as you test. Focus on critical paths first (launch, auth, core features).*
