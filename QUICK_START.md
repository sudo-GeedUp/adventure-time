# Quick Start - Getting Your App Running

## The Problem

Your app won't load in the iOS Simulator due to:
1. **Space in directory path** (`adventure repo`) causing build issues
2. **Simulator timeout** when trying to open Expo Go
3. **Development build** requires full native compilation (10+ minutes)

## Immediate Solution: Use Your Phone

This is the **fastest and most reliable** way to test your app right now:

### Steps:
1. **Install Expo Go** on your iPhone from the App Store
2. **Make sure your phone and computer are on the same WiFi network**
3. **Run this command** in your terminal:
   ```bash
   cd "/Users/sinjin/adventure repo/adventure-time"
   npx expo start --tunnel
   ```
4. **Scan the QR code** with your iPhone Camera app
5. **App opens in Expo Go** on your phone

This bypasses all the simulator issues and works immediately.

---

## Alternative: Fix the Directory Path

The root cause is the space in your directory name. To fix permanently:

### Option A: Rename Directory (Recommended)
```bash
# Move to parent directory
cd /Users/sinjin

# Rename the folder (remove space)
mv "adventure repo" adventure-repo

# Update your terminal
cd adventure-repo/adventure-time

# Now builds will work
npx expo run:ios
```

### Option B: Create Symlink
```bash
# Create a symlink without spaces
ln -s "/Users/sinjin/adventure repo/adventure-time" ~/adventure-time

# Work from the symlink
cd ~/adventure-time
npx expo run:ios
```

---

## What's Currently Working

✅ **Metro Bundler** - Running successfully on port 8081
✅ **TypeScript** - All compilation errors fixed
✅ **App Code** - Ready to run
✅ **Services** - All initialized with proper error handling

## What's NOT Working

❌ **iOS Simulator with Expo Go** - Times out due to path issues
❌ **Native iOS Build** - Fails due to space in path
❌ **Web Version** - Won't work (uses native modules like react-native-maps)

---

## Recommended Next Steps

### 1. Test on Your Phone (5 minutes)
```bash
cd "/Users/sinjin/adventure repo/adventure-time"
npx expo start --tunnel
```
Then scan QR code with your phone.

### 2. Rename Directory (2 minutes)
```bash
cd /Users/sinjin
mv "adventure repo" adventure-repo
cd adventure-repo/adventure-time
```

### 3. Build for Simulator (15 minutes)
After renaming directory:
```bash
npx expo run:ios
```

---

## Current Metro Status

If Metro is running, you should see:
- QR code in terminal
- "Metro waiting on exp://..."
- "Press i | open iOS simulator"

**The simulator 'i' command keeps timing out**, so use your phone instead.

---

## Troubleshooting

### "Operation timed out" when pressing 'i'
- **Cause**: Simulator can't handle the space in directory path
- **Fix**: Use your phone OR rename directory

### "No development build installed"
- **Cause**: Native build not compiled yet
- **Fix**: Press 's' to switch to Expo Go mode first

### Metro won't start
- **Fix**: 
  ```bash
  killall -9 node
  npx expo start --clear
  ```

---

## Summary

**Right now, the fastest way to see your app running is:**

1. Open Terminal
2. Run: `cd "/Users/sinjin/adventure repo/adventure-time" && npx expo start --tunnel`
3. Install Expo Go on your iPhone
4. Scan the QR code
5. App loads on your phone

**To fix permanently:** Rename the directory to remove the space, then native builds will work.
