# RevenueCat Setup Checklist

## Account Setup
- [x] Create RevenueCat account at https://app.revenuecat.com
- [x] Verify email address

## App Configuration
- [x] Add new app in RevenueCat dashboard
- [x] Use bundle ID: `com.masongallegos.itsadventuretime`
- [x] Select iOS platform

## Products & Entitlements
- [ ] Add product: `com.adventuretime.premium.monthly`
- [ ] Set price: $4.99/month
- [ ] Create entitlement: `premium`
- [ ] Link product to entitlement

## API Keys
- [x] Go to Settings > API Keys
- [x] Copy iOS API key: `appl_npGZiqzsVwsjNfNEFMfaaJswocC`
- [x] Add to .env file

## App Store Connect API (Required for Production)
- [ ] Go to App Store Connect > Users and Access > Keys
- [ ] Create new API key for RevenueCat
- [ ] Download .p8 key file
- [ ] Note Key ID and Issuer ID
- [ ] Add to RevenueCat settings
- [ ] Enable server notifications

## Testing Setup
- [ ] Create sandbox account on iPhone
- [ ] Sign out of App Store
- [ ] Test subscription flow

## Production (Later)
- [ ] Configure products in App Store Connect
- [ ] Add to subscription group
- [ ] Submit for review

## Current Status
Bundle ID: com.masongallegos.itsadventuretime
Product ID: com.adventuretime.premium.monthly
Test API Key: test_VuKiYKHZIagZNWUqTtxfCQColuV
