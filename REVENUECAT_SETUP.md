# RevenueCat Setup Guide

## 1. Create RevenueCat Account
1. Go to https://app.revenuecat.com
2. Sign up for a free account
3. Verify your email

## 2. Add Your App
1. Click "New App" in RevenueCat dashboard
2. Enter app details:
   - App Name: "Adventure Time"
   - Bundle ID: `com.masongallegos.itsadventuretime`
   - Platform: iOS
3. Select "I'll add products later" for now

## 3. Configure Products
1. In your app dashboard, go to "Products" tab
2. Click "Add Product"
3. Enter:
   - Product ID: `com.adventuretime.premium.monthly`
   - Display Name: "Adventure Time Premium"
   - Price: $4.99
   - Duration: Monthly
4. Save the product

## 4. Configure Entitlements
1. Go to "Entitlements" tab
2. Create new entitlement:
   - ID: `premium`
   - Name: "Premium Features"
3. Add your monthly product to this entitlement

## 5. Get API Keys
1. Go to "Settings" > "API Keys"
2. Copy the "iOS" API key
3. Add it to your .env file:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_copied_key_here
   ```

## 6. App Store Connect Setup (for production)
1. Go to https://appstoreconnect.apple.com
2. Go to "My Apps" > select your app
3. Go to "Features" > "In-App Purchases"
4. Create new subscription:
   - Subscription ID: `com.adventuretime.premium.monthly`
   - Reference Name: "Adventure Time Premium"
   - Product ID: same as above
   - Duration: 1 month
   - Price: $4.99
5. Add it to a subscription group
6. Submit for review (can be done later)

## 7. Sandbox Testing on iPhone
1. On your iPhone: Settings > App Store > Sandbox Account
2. Create a new sandbox test account
3. Sign out of regular App Store on your device
4. When testing subscription, use sandbox credentials
5. Purchases will be free and simulate real behavior

## 8. Test in App
1. Reload the app after adding API key to .env
2. Go to Subscription screen
3. Tap "Subscribe Now"
4. Use sandbox account when prompted
5. Verify premium features unlock

## Notes:
- Test environment uses RevenueCat test keys initially
- Production requires App Store Connect setup
- Sandbox purchases don't charge real money
- You can restore purchases anytime in sandbox
