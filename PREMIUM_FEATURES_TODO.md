# Premium Features - Re-enable Before Launch

## Status

Premium gates have been re-enabled across the app.

### AI Recovery Screen (`/screens/AIScanScreen.tsx`)

- ✅ `handleTakePhoto()` shows a premium paywall for free users
- ✅ `handleUploadPhoto()` shows a premium paywall for free users
- ✅ Title shows `🔒` lock icon and conditional premium messaging

### Profile Screen (`/screens/ProfileScreen.tsx`)

- ✅ **Achievement Badges** grid is locked behind premium with an upsell card for free users

---

## Before Launch Checklist

- [x] Re-enable premium gates in `handleTakePhoto()`
- [x] Re-enable premium gates in `handleUploadPhoto()`
- [x] Restore conditional UI text showing lock icon and premium messaging
- [x] Add premium gate for Earned Badges on ProfileScreen
- [ ] Test premium subscription flow works correctly
- [ ] Verify free users see paywall when attempting AI Recovery
- [ ] Verify premium users can access AI Recovery without restrictions

---

## Premium Features List

1. **AI Recovery Scan** - Camera/photo analysis with GPT-4o-mini
2. **Unlimited Adventure History** - Save unlimited completed adventures
3. **Achievement Badges** - Unlock all milestone badges
4. **Advanced Statistics** - Detailed insights and analytics

---

## Notes

- RevenueCat handles subscription management
- Production API key needed in `eas.json` before App Store build
- Test with both free and premium accounts before submission
