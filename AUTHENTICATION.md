# Authentication System Documentation

Complete authentication system for Adventure Time app with Firebase Auth integration.

## 🎯 Overview

The authentication system provides:
- **Email/Password authentication**
- **Social login** (Google & Apple - coming soon)
- **Password reset functionality**
- **User profile management**
- **Session persistence**
- **Protected routes**
- **Premium subscription tracking**

---

## 📁 File Structure

```
services/
  └── authService.ts          # Core authentication service
contexts/
  └── AuthContext.tsx         # React context for auth state
screens/
  ├── LoginScreen.tsx         # Login UI
  ├── SignUpScreen.tsx        # Registration UI
  └── ForgotPasswordScreen.tsx # Password reset UI
navigation/
  ├── AuthStackNavigator.tsx  # Auth flow navigation
  └── RootNavigator.tsx       # Main app navigation with auth
```

---

## 🔐 Authentication Service

### Core Methods

#### Sign Up
```typescript
await authService.signUpWithEmail(email, password, displayName);
```

#### Sign In
```typescript
await authService.signInWithEmail(email, password);
```

#### Sign Out
```typescript
await authService.signOut();
```

#### Password Reset
```typescript
await authService.sendPasswordReset(email);
```

#### Update Profile
```typescript
await authService.updateUserProfile({
  displayName: 'New Name',
  vehicleType: 'Jeep Wrangler',
  vehicleSpecs: {
    make: 'Jeep',
    model: 'Wrangler',
    year: '2023'
  }
});
```

#### Update Email
```typescript
await authService.updateUserEmail(newEmail, currentPassword);
```

#### Update Password
```typescript
await authService.updateUserPassword(currentPassword, newPassword);
```

#### Delete Account
```typescript
await authService.deleteAccount(password);
```

---

## 🎣 Using Auth Context

### Access Auth State

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    user,              // Firebase User object
    userProfile,       // Custom UserProfile object
    loading,           // Auth loading state
    isAuthenticated,   // Boolean
    isPremium,         // Premium status
    signUp,            // Sign up function
    signIn,            // Sign in function
    signOut,           // Sign out function
    updateProfile,     // Update profile function
    refreshProfile,    // Refresh profile from storage
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return <AuthenticatedContent />;
}
```

---

## 👤 User Profile Structure

```typescript
interface UserProfile {
  uid: string;                    // Firebase user ID
  email: string;                  // User email
  displayName: string;            // Display name
  photoURL?: string;              // Profile photo URL
  phoneNumber?: string;           // Phone number
  vehicleType?: string;           // Vehicle type
  vehicleSpecs?: {                // Vehicle specifications
    make: string;
    model: string;
    year: string;
  };
  emergencyContacts?: any[];      // Emergency contacts
  createdAt: number;              // Account creation timestamp
  lastLogin: number;              // Last login timestamp
  isPremium: boolean;             // Premium subscription status
  premiumExpiresAt?: number;      // Premium expiration timestamp
}
```

---

## 🚀 Authentication Flow

### 1. First Launch
```
App Launch → Welcome Screen → Auth Screen → Main App
```

### 2. Returning User (Not Logged In)
```
App Launch → Auth Screen → Main App
```

### 3. Returning User (Logged In)
```
App Launch → Main App
```

### 4. Sign Up Flow
```
Login Screen → Sign Up Screen → Create Account → Main App
```

### 5. Password Reset Flow
```
Login Screen → Forgot Password → Email Sent → Check Email → Reset Password
```

---

## 🔒 Protected Routes

Routes are automatically protected based on authentication state in `RootNavigator.tsx`:

```typescript
{!isAuthenticated ? (
  <Stack.Screen
    name="Auth"
    component={AuthStackNavigator}
    options={{ gestureEnabled: false }}
  />
) : null}
```

---

## 🎨 UI Screens

### Login Screen
- Email/password input
- Show/hide password toggle
- Forgot password link
- Sign up link
- Social login buttons (disabled - coming soon)

### Sign Up Screen
- Full name input
- Email input
- Password input with validation
- Confirm password
- Terms of service agreement
- Back to login link

### Forgot Password Screen
- Email input
- Send reset link button
- Success confirmation
- Resend email option
- Back to login

---

## 🔧 Configuration

### Firebase Setup

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project
   - Enable Authentication

2. **Enable Authentication Methods**
   - Email/Password ✅
   - Google Sign-In (optional)
   - Apple Sign-In (optional)

3. **Add Configuration to `.env`**
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🌐 Social Login (Coming Soon)

### Google Sign-In Setup

1. **Google Cloud Console**
   - Create OAuth 2.0 credentials
   - Configure consent screen
   - Add authorized domains

2. **Add to `.env`**
```bash
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
```

3. **Install Dependencies**
```bash
npx expo install expo-auth-session expo-web-browser
```

### Apple Sign-In Setup

1. **Apple Developer Account**
   - Enable Sign in with Apple capability
   - Configure app identifier

2. **Install Dependencies**
```bash
npx expo install expo-apple-authentication
```

3. **Platform Requirement**
   - iOS 13+ only
   - Requires physical device for testing

---

## 💾 Data Persistence

### User Profile Storage
- **Primary**: AsyncStorage with user ID key
- **Legacy**: Compatible with existing storage utility
- **Sync**: Automatic sync between Firebase and local storage

### Session Management
- **Auto-login**: Persists across app restarts
- **Token refresh**: Handled automatically by Firebase
- **Logout**: Clears all local data

---

## 🔐 Security Features

### Password Requirements
- Minimum 6 characters
- Validated on client and server

### Email Validation
- Regex validation
- Firebase server-side validation

### Reauthentication
- Required for sensitive operations:
  - Email change
  - Password change
  - Account deletion

### Error Handling
- User-friendly error messages
- Specific error codes handled
- Network error detection

---

## 🧪 Testing

### Test Accounts
Create test accounts for development:

```typescript
// Test user 1
email: test1@adventuretime.com
password: test123

// Test user 2
email: test2@adventuretime.com
password: test123
```

### Test Scenarios

1. **Sign Up**
   - Valid credentials
   - Duplicate email
   - Weak password
   - Invalid email format

2. **Sign In**
   - Correct credentials
   - Wrong password
   - Non-existent email
   - Network error

3. **Password Reset**
   - Valid email
   - Non-existent email
   - Network error

4. **Profile Update**
   - Update display name
   - Update vehicle info
   - Update email (requires password)
   - Update password (requires current password)

---

## 🐛 Troubleshooting

### Firebase Not Initialized
**Error**: "Firebase not initialized"
**Solution**: Check Firebase configuration in `.env` file

### Authentication Errors
**Error**: "auth/network-request-failed"
**Solution**: Check internet connection and Firebase project status

### Session Not Persisting
**Error**: User logged out after app restart
**Solution**: Check AsyncStorage permissions and Firebase Auth configuration

### Social Login Not Working
**Error**: "Google Sign-In not yet implemented"
**Solution**: Social login coming in future update - use email/password for now

---

## 📊 Integration with Existing Features

### Premium Features
```typescript
const { isPremium } = useAuth();

if (!isPremium) {
  // Show premium upgrade prompt
  return <PremiumUpgradeScreen />;
}

// Show premium feature
return <PremiumFeature />;
```

### User Profile
```typescript
const { userProfile } = useAuth();

// Access user data
console.log(userProfile?.displayName);
console.log(userProfile?.vehicleType);
console.log(userProfile?.email);
```

### Friends & Social
```typescript
const { user } = useAuth();

// Use user ID for social features
FirebaseLocationService.startLocationBroadcast(user.uid);
SocialService.sendFriendRequest(user.uid, user.displayName, friendId, friendName);
```

---

## 🚀 Next Steps

### Immediate
1. ✅ Configure Firebase project
2. ✅ Add Firebase credentials to `.env`
3. ✅ Test email/password authentication
4. ✅ Test password reset flow

### Short-term
5. ⏳ Implement Google Sign-In
6. ⏳ Implement Apple Sign-In
7. ⏳ Add profile photo upload
8. ⏳ Add email verification

### Future
9. ⏳ Two-factor authentication
10. ⏳ Biometric authentication
11. ⏳ Social profile linking
12. ⏳ Account recovery options

---

## 📝 Code Examples

### Protecting a Screen
```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedScreen() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return <YourContent />;
}
```

### Checking Premium Status
```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function PremiumFeature() {
  const { isPremium, userProfile } = useAuth();

  if (!isPremium) {
    return (
      <View>
        <Text>This is a premium feature</Text>
        <Button title="Upgrade to Premium" />
      </View>
    );
  }

  return <PremiumContent />;
}
```

### Updating User Profile
```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfile() {
  const { updateProfile, userProfile } = useAuth();
  const [name, setName] = useState(userProfile?.displayName || '');

  const handleSave = async () => {
    try {
      await updateProfile({ displayName: name });
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TextInput value={name} onChangeText={setName} />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}
```

---

## 🎉 Benefits

### For Users
- ✅ Secure account management
- ✅ Easy password recovery
- ✅ Persistent login
- ✅ Profile customization
- ✅ Premium features access

### For Development
- ✅ Centralized auth logic
- ✅ Type-safe API
- ✅ Easy to extend
- ✅ Well-documented
- ✅ Error handling built-in

### For Business
- ✅ User analytics
- ✅ Premium subscriptions
- ✅ User engagement tracking
- ✅ Personalized experiences
- ✅ Social features enabled

---

## 📚 Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [React Navigation Auth Flow](https://reactnavigation.org/docs/auth-flow)
- [Expo Authentication](https://docs.expo.dev/guides/authentication/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

**Last Updated**: Authentication system v1.0
**Status**: ✅ Core features complete, social login coming soon
