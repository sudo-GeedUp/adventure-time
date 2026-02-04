# Complete Subscription Setup Guide - Start to End

## Phase 1: RevenueCat Setup (5 minutes)

### 1. Create Account & App
1. Go to https://app.revenuecat.com
2. Sign up → Verify email
3. Click "New App"
4. Fill in:
   - App Name: "Adventure Time"
   - Bundle ID: `com.masongallegos.itsadventuretime`
   - Platform: iOS
5. Click "Create App"

### 2. Add Product
1. In your app dashboard, click "Products" tab
2. Click "Add Product"
3. Enter:
   - Product ID: `com.adventuretime.premium.monthly`
   - Display Name: "Adventure Time Premium"
   - Price: $4.99
   - Duration: Monthly
4. Click "Save"

### 3. Create Entitlement
1. Click "Entitlements" tab
2. Click "Create Entitlement"
3. Enter:
   - ID: `premium`
   - Name: "Premium Features"
   - Products: Select your monthly product
4. Click "Save"

## Phase 2: App Store Connect (10 minutes)

### 1. Create App (if not exists)
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+"
3. Fill in app details
4. Note your Apple App ID (8-digit number in URL)

### 2. Add Subscription Product
1. Go to your app → "Features" → "In-App Purchases"
2. Click "+" → "Auto-Renewable Subscription"
3. Fill in:
   - Reference Name: "Adventure Time Premium"
   - Product ID: `com.adventuretime.premium.monthly`
   - Subscription Group: Create new group
   - Price: $4.99
   - Duration: 1 month
4. Add localization with description
5. Add review notes
6. Save (no need to submit yet)

## Phase 3: API Configuration (5 minutes)

### 1. RevenueCat API Key (Already Done!)
- Your key: `appl_npGZiqzsVwsjNfNEFMfaaJswocC`
- Already in .env file ✅

### 2. App Store Connect API Key (For Production)
1. In App Store Connect → "Users and Access" → "Keys"
2. Click "+" → Create API key
3. Name: "RevenueCat"
4. Access: "Admin"
5. Download .p8 file
6. Note Key ID and Issuer ID
7. In RevenueCat → Settings → App Store Connect
8. Add key details

## Phase 4: Testing Setup (5 minutes)

### 1. Sandbox Account
1. On iPhone: Settings → App Store → Sandbox Account
2. Create new test account
3. Use any email (doesn't need to be real)
4. Save password

### 2. Prepare Device
1. Sign out of regular App Store
2. Don't sign into sandbox yet

## Phase 5: Test in App (2 minutes)

1. Reload your app (shake → Reload)
2. Go to Profile → Subscription
3. Tap "Subscribe Now"
4. When prompted:
   - Use sandbox account email/password
   - Confirm subscription
5. Verify premium features unlock

## Phase 6: Production Checklist (Before Launch)

- [ ] App Store Connect subscription approved
- [ ] App Store Connect API configured
- [ ] Server notifications enabled
- [ ] Test purchases in sandbox
- [ ] Test restore purchases
- [ ] Test subscription flow

## Common Issues & Solutions

### "No offerings available"
- Check product ID matches exactly
- Ensure product exists in RevenueCat
- Verify API key is correct

### "Cannot connect to App Store"
- Sign out of regular App Store
- Use sandbox account
- Check internet connection

### "Subscription not activating"
- Wait 30 seconds for sync
- Try restore purchases
- Check RevenueCat logs

## Quick Commands

```bash
# Reload Metro if needed
npx expo start --lan

# Rebuild if changes made
npx expo run:ios --device "iPhone"
```

## Support Links
- RevenueCat Docs: https://docs.revenuecat.com
- App Store Connect: https://appstoreconnect.apple.com
- TestFlight Guide: https://developer.apple.com/testflight/

## Done!
Once you complete Phases 1-3, you can test immediately with sandbox accounts. Phase 4+ can be done anytime before launch.
