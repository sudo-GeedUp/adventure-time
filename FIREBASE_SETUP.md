# Firebase Setup Guide for Adventure Time

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Name it "Adventure Time"
4. Accept the defaults and create

### Step 2: Enable Realtime Database
1. In Firebase Console, go to "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose location (closest to you)
4. Start in **Test mode** (for development)
5. Copy the Database URL (looks like: `https://your-project.firebaseio.com`)

### Step 3: Enable Authentication
1. Go to "Build" → "Authentication"
2. Click "Get Started"
3. Click "Anonymous" provider
4. Enable it and Save

### Step 4: Get Your Credentials
1. Go to Project Settings (gear icon)
2. Click "General" tab
3. Scroll down to see your Firebase SDK config
4. Copy these values:
   - API Key → `EXPO_PUBLIC_FIREBASE_API_KEY`
   - Auth Domain → `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - Project ID → `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - Storage Bucket → `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - Messaging Sender ID → `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - App ID → `EXPO_PUBLIC_FIREBASE_APP_ID`
5. Database URL (from Step 2) → `EXPO_PUBLIC_FIREBASE_DATABASE_URL`

### Step 5: Add to Your App
1. Create a `.env` file in your project root
2. Copy values from `.env.example`
3. Paste your Firebase credentials
4. Save the file

### Step 6: Restart Your App
- The app will automatically detect and use Firebase
- Friends will now sync in real-time!

## What Now Works

✅ **Real-time Friends** - Add friends and see them instantly  
✅ **Live Locations** - Friends' locations update in real-time  
✅ **Adventures** - Share recovery adventures with your friends  
✅ **Free Forever** - Uses Firebase free tier (1 GB storage)  
✅ **Automatic Sync** - Changes sync instantly across all users  

## Database Structure

```
users/
  {userId}/
    friends/
      {friendId}/
        - name
        - vehicleType
        - location: {latitude, longitude}
        - lastSeen
        - adventures/
          {adventureId}/
            - title
            - location
            - difficulty
            - timestamp
```

## Important Notes

- Friends are stored per user ID (unique per app installation)
- All data is public in test mode (for development)
- Set security rules in Firebase Console for production
- Free tier includes 100 concurrent connections
- Perfect for testing with friends!

## Troubleshooting

**"Firebase Not Configured" message?**
- Check your `.env` file has all values
- Make sure keys start with `EXPO_PUBLIC_`
- Restart the app

**Friends not syncing?**
- Check Firebase Console to see data structure
- Verify Realtime Database is enabled
- Check browser console for errors

**Need help?**
- Firebase Docs: https://firebase.google.com/docs
- Realtime Database: https://firebase.google.com/docs/database
- Authentication: https://firebase.google.com/docs/auth
