# App Store Connect API Setup for RevenueCat

## Overview
App Store Connect API allows RevenueCat to:
- Verify receipts
- Check subscription status
- Handle server-to-server notifications
- Manage customer data

## Steps to Set Up

### 1. Create App Store Connect API Key
1. Go to https://appstoreconnect.apple.com
2. Click "Users and Access"
3. Click "Keys" tab
4. Click "+" to create new API key
5. Enter:
   - Name: "RevenueCat API Key"
   - Access: "Admin"
6. Click "Generate"

### 2. Download the Key
1. After creation, download the .p8 file
2. Save it securely - you can only download it once!
3. Note the:
   - Key ID (shown in the list)
   - Issuer ID (top of the page)

### 3. Add to RevenueCat
1. Go to your RevenueCat dashboard
2. Select your app
3. Go to "Settings" > "App Store Connect"
4. Enter:
   - Private Key: Upload the .p8 file or paste its contents
   - Key ID: The ID from step 2
   - Issuer ID: From App Store Connect
   - Apple App ID: Your app's Apple ID (8-digit number)

### 4. Find Your Apple App ID
1. In App Store Connect, go to "My Apps"
2. Select your app
3. The App ID is in the URL or under "App Information"
4. Example: https://appstoreconnect.apple.com/apps/1234567890
   - Here, 1234567890 is the Apple App ID

### 5. Enable Server Notifications
1. In RevenueCat, go to "Settings" > "Webhooks"
2. Copy the webhook URL
3. In App Store Connect, go to your app
4. Go to "App Information" > "Server Notifications"
5. Add the RevenueCat webhook URL

## Security Notes
- Never commit the .p8 key to Git
- Store it securely (password manager, secure storage)
- Rotate keys annually or if compromised
- Limit access to only necessary permissions

## Troubleshooting
- If purchases don't verify, check the key permissions
- Ensure the bundle ID matches exactly
- Verify the Apple App ID is correct
- Check that the subscription is live in App Store Connect
