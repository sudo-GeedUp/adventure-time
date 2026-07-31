# Firebase Setup Guide for Adventure Time

Complete step-by-step guide to configure Firebase for your app.

---

## 📋 Quick Overview

**Time Required**: ~15-20 minutes  
**What You'll Need**: Google account  
**What You'll Get**: Authentication, Database, and Storage for your app

---

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
- Open **[https://console.firebase.google.com](https://console.firebase.google.com)**
- Sign in with your Google account

### 1.2 Create New Project
1. Click **"Add project"** or **"Create a project"**
2. **Project name**: Enter `adventure-time` (or your preferred name)
3. Click **"Continue"**
4. **Google Analytics**: 
   - ✅ Recommended: Enable (helps track app usage)
   - Select or create Analytics account
5. Click **"Create project"**
6. Wait ~30 seconds for setup
7. Click **"Continue"** when ready

---

## Step 2: Get Your Configuration Keys

### 2.1 Add Web App to Firebase
1. In Firebase Console, click the **⚙️ Settings** icon (top left)
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. **App nickname**: Enter `Adventure Time Web`
6. ❌ **Don't** check "Also set up Firebase Hosting"
7. Click **"Register app"**

### 2.2 Copy Your Configuration
You'll see a code snippet like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "adventure-time-xxxxx.firebaseapp.com",
  databaseURL: "https://adventure-time-xxxxx.firebaseio.com",
  projectId: "adventure-time-xxxxx",
  storageBucket: "adventure-time-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 2.3 Add to Your .env File
Open your `.env` file and fill in the values:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=adventure-time-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://adventure-time-xxxxx.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=adventure-time-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=adventure-time-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**⚠️ Important**: Copy the EXACT values from Firebase - don't add quotes or extra spaces!

---

## Step 3: Enable Authentication

### 3.1 Navigate to Authentication
1. In Firebase Console sidebar, click **"Build"** > **"Authentication"**
2. Click **"Get started"**

### 3.2 Enable Email/Password Sign-In
1. Click the **"Sign-in method"** tab
2. Find **"Email/Password"** in the providers list
3. Click on it
4. Toggle **"Enable"** to ON
5. Click **"Save"**

✅ **Done!** Users can now sign up and log in with email/password

---

## Step 4: Enable Realtime Database

### 4.1 Create Database
1. In sidebar, click **"Build"** > **"Realtime Database"**
2. Click **"Create Database"**

### 4.2 Choose Location
- **Database location**: Choose closest to your users
  - US: `us-central1`
  - Europe: `europe-west1`
  - Asia: `asia-southeast1`
- Click **"Next"**

### 4.3 Set Security Rules
- Select **"Start in locked mode"** (we'll configure rules next)
- Click **"Enable"**

### 4.4 Configure Security Rules
1. Click the **"Rules"** tab
2. Replace the existing rules with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "trails": {
      ".read": true,
      ".write": "auth != null"
    },
    "adventures": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "communityTips": {
      ".read": true,
      ".write": "auth != null"
    },
    "trailEvents": {
      ".read": true,
      ".write": "auth != null"
    },
    "friends": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

3. Click **"Publish"**

**What these rules do**:
- ✅ Users can only read/write their own data
- ✅ Anyone can view trails and community tips
- ✅ Only authenticated users can post content
- ✅ Messages and friends are private to each user

---

## Step 5: Enable Cloud Storage

### 5.1 Create Storage
1. In sidebar, click **"Build"** > **"Storage"**
2. Click **"Get started"**

### 5.2 Set Security Rules
- Select **"Start in production mode"**
- Click **"Next"**

### 5.3 Choose Location
- Use the **same location** as your Realtime Database
- Click **"Done"**

### 5.4 Configure Storage Rules
1. Click the **"Rules"** tab
2. Replace with these rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile photos and personal files
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Trail photos and community content
    match /trails/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // AI scan photos
    match /scans/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Adventure photos
    match /adventures/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

**What these rules do**:
- ✅ Anyone can view profile photos and trail images
- ✅ Users can only upload to their own folders
- ✅ AI scans and adventures are private to each user

---

## Step 6: Test Your Configuration

### 6.1 Restart Your Development Server
```bash
# Stop the current server (Ctrl+C)
# Clear cache and restart
npx expo start -c
```

### 6.2 Check Console for Errors
Look for these success messages:
- ✅ "Firebase initialized successfully"
- ✅ No Firebase configuration errors

### 6.3 Test Authentication
1. Open your app
2. Try to sign up with a new account
3. Check Firebase Console > Authentication > Users
4. You should see your new user listed!

---

## 🎯 Verification Checklist

Before moving on, verify:

- [ ] Firebase project created
- [ ] All 7 environment variables added to `.env` file
- [ ] Email/Password authentication enabled
- [ ] Realtime Database created with security rules
- [ ] Cloud Storage created with security rules
- [ ] App restarts without Firebase errors
- [ ] Can create a test user account

---

## 🔧 Troubleshooting

### "Firebase config not set up" warning
- **Cause**: Missing or incorrect `.env` values
- **Fix**: Double-check all 7 Firebase variables are filled in correctly

### "Permission denied" errors
- **Cause**: Security rules not configured
- **Fix**: Re-check and publish the security rules in Steps 4.4 and 5.4

### Authentication not working
- **Cause**: Email/Password provider not enabled
- **Fix**: Go to Authentication > Sign-in method and enable Email/Password

### Can't read/write data
- **Cause**: Security rules too restrictive or user not authenticated
- **Fix**: Ensure user is logged in and rules match the examples above

---

## 📱 Next Steps

After Firebase is configured:

1. **Get OpenWeather API Key** (optional, for weather widget)
   - Go to [https://openweathermap.org/api](https://openweathermap.org/api)
   - Sign up for free account
   - Get API key and add to `.env` as `EXPO_PUBLIC_OPENWEATHER_API_KEY`

2. **Set up RevenueCat** (for subscriptions)
   - See `REVENUECAT_SETUP.md` for detailed guide

3. **Test on Real Device**
   - Install Expo Go app
   - Scan QR code from `npx expo start`
   - Test all features

---

## 🆘 Need Help?

- **Firebase Documentation**: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- **Expo Firebase Guide**: [https://docs.expo.dev/guides/using-firebase/](https://docs.expo.dev/guides/using-firebase/)
- **Check Console Logs**: Look for specific error messages in your terminal

---

**Estimated Time to Complete**: 15-20 minutes  
**Difficulty**: ⭐⭐☆☆☆ (Easy)

Once complete, your app will have:
- ✅ User authentication
- ✅ Real-time database
- ✅ File storage
- ✅ All core features working!
