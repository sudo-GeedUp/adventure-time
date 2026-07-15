# iPhone Debugging Setup

## 📱 Device Connected
- **Device**: Sin's iPhone
- **Device ID**: 00008120-00060DE404434032
- **iOS Version**: 26.3

## 🔍 Debugging Tools Ready

### 1. Expo Dev Tools
- **Shake iPhone** → Open Dev Menu
- **Debug** → Opens Chrome DevTools
- **Remote JS Debugging** → Full console access

### 2. Sentry Monitoring
- **Dashboard**: https://sentry.io
- **Session Replay**: Watch user interactions
- **Error Tracking**: Live crash reports
- **Performance**: API call monitoring

### 3. Chrome DevTools
- **Console**: All logs/errors
- **Network**: API calls (OpenAI, Firebase, etc.)
- **Elements**: UI inspection
- **Sources**: Code debugging

## 🎯 What to Test First

1. **AI Scan** - Camera + OpenAI API
2. **GPS Tracking** - Location services
3. **Firebase Auth** - Login/signup
4. **RevenueCat** - Subscription flow
5. **Push Notifications** - Permission testing

## 🐛 Common Issues to Monitor

- **Camera permissions** for AI Scan
- **Location permissions** for GPS
- **Network connectivity** for API calls
- **Memory usage** on device
- **Battery drain** during GPS tracking

## 📊 Monitoring Checklist

- [ ] Console errors in Chrome DevTools
- [ ] Sentry error reports
- [ ] API response times
- [ ] App crash logs
- [ ] User interaction flow
