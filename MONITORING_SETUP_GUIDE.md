# Production Monitoring Setup Guide

Your app is now equipped with comprehensive monitoring capabilities. Here's how to set up and use each monitoring feature:

## ✅ What's Been Implemented

### 1. **Firebase Analytics** ✅
- Tracks user interactions, screen views, and custom events
- Already configured in your app
- Works automatically once Firebase is set up

### 2. **Sentry Crash Reporting** ✅
- Captures crashes and errors in production
- Provides detailed stack traces and context
- Already integrated, just needs DSN configuration

### 3. **Bundle Size Monitoring** ✅
- Tracks JavaScript bundle size
- Identifies large modules and optimization opportunities
- Analysis script ready to use

### 4. **Image Optimization** ✅
- Utilities to optimize images before upload
- Automatic resizing and compression
- WebP support where available

### 5. **Performance Monitoring** ✅
- Tracks API response times
- Monitors render performance
- Measures navigation speed
- Custom hooks for easy integration

## 🔧 Setup Instructions

### 1. Configure Sentry

1. **Create a Sentry Account**:
   - Go to https://sentry.io
   - Sign up for a free account

2. **Create a New Project**:
   - Click "Create Project"
   - Select "React Native" as the platform
   - Give it a name (e.g., "Adventure Time App")

3. **Get Your DSN**:
   - In the project settings, find the "Client Keys (DSN)"
   - Copy the DSN URL

4. **Add to Environment Variables**:
   ```bash
   # In your .env file
   EXPO_PUBLIC_SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
   ```

5. **Test Sentry Integration**:
   ```javascript
   // Temporarily add to any screen to test
   import { sentryService } from '@/services/sentryService';
   
   const testSentry = () => {
     sentryService.testCrash(); // Only works in development
   };
   ```

### 2. Verify Firebase Analytics

1. **Check Firebase Console**:
   - Go to https://console.firebase.google.com
   - Select your project
   - Navigate to Analytics > Dashboard

2. **Enable Debug View** (for testing):
   ```javascript
   // Add to App.tsx temporarily in development
   if (__DEV__) {
     analyticsService.setUserId('debug_user');
   }
   ```

### 3. Use Bundle Analysis

1. **Analyze Web Bundle**:
   ```bash
   npm run analyze:web
   ```

2. **Analyze All Platforms**:
   ```bash
   npm run analyze-bundle
   ```

3. **View Report**:
   - Check `bundle-analysis-report.json`
   - Look for recommendations in the console output

### 4. Implement Image Optimization

```javascript
import { optimizeImage, generateThumbnail } from '@/utils/imageOptimization';

// In your image upload/component code:
const handleImageUpload = async (imageUri) => {
  // Optimize the full image
  const optimizedUri = await optimizeImage(imageUri, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: 'jpeg',
  });
  
  // Generate a thumbnail
  const thumbnailUri = await generateThumbnail(optimizedUri, 200);
  
  // Upload both versions
  await uploadImage(optimizedUri);
  await uploadThumbnail(thumbnailUri);
};
```

### 5. Add Performance Monitoring

```javascript
// In any component or screen:
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export default function MyComponent() {
  const { startTiming, endTiming } = usePerformanceMonitor();
  
  const handleApiCall = async () => {
    const timerId = startTiming('user_data_fetch');
    
    try {
      const data = await fetchUserData();
      endTiming(timerId, { recordCount: data.length });
    } catch (error) {
      endTiming(timerId, { error: error.message });
    }
  };
  
  // Or use the convenience hook:
  const { measureFunction } = usePerformanceMonitor();
  
  const loadData = async () => {
    return measureFunction('load_dashboard', async () => {
      const data = await fetchDashboardData();
      return data;
    });
  };
}
```

## 📊 Monitoring Dashboard

### Firebase Analytics
- **URL**: https://console.firebase.google.com
- **Track**: User engagement, screen views, conversions
- **Reports**: Audience, behavior, acquisition

### Sentry
- **URL**: https://sentry.io
- **Track**: Crashes, errors, performance issues
- **Alerts**: Set up email notifications for new issues

### Bundle Analysis
- **Local**: Run `npm run analyze-bundle`
- **Metrics**: Bundle size, largest modules, recommendations

## 🚨 Setting Up Alerts

### Sentry Alerts
1. In Sentry, go to Settings > Alerts
2. Create new alert rules for:
   - New issues (high priority)
   - Performance regressions
   - Error rate thresholds

### Firebase Analytics
1. In Firebase Analytics, create custom events
2. Set up conversion tracking for key actions
3. Create audiences for user segmentation

## 📈 Performance Best Practices

### 1. Image Optimization
- Always optimize images before upload
- Use appropriate formats (WebP for web, JPEG for photos)
- Implement lazy loading for image lists

### 2. API Monitoring
- Track all external API calls
- Set timeouts and retry logic
- Monitor response times and error rates

### 3. Bundle Optimization
- Use dynamic imports for large modules
- Implement code splitting
- Remove unused dependencies

### 4. Render Performance
- Optimize re-renders with React.memo
- Use FlatList instead of ScrollView for long lists
- Implement proper loading states

## 🔍 Troubleshooting

### Sentry Not Working
- Check that `EXPO_PUBLIC_SENTRY_DSN` is set
- Ensure you're building in production mode
- Verify network connectivity

### Analytics Not Showing
- Firebase can take up to 24 hours to show data
- Check that Firebase is properly initialized
- Verify events are being triggered

### Bundle Size Too Large
- Run analysis to find large modules
- Consider code splitting
- Optimize images and assets

## 📝 Monitoring Checklist

- [ ] Sentry DSN configured in .env
- [ ] Test Sentry error capture
- [ ] Verify Firebase Analytics events
- [ ] Run bundle analysis
- [ ] Implement image optimization in upload flows
- [ ] Add performance monitoring to key screens
- [ ] Set up Sentry alerts
- [ ] Create custom analytics events
- [ ] Monitor bundle size in CI/CD
- [ ] Regular performance reviews

## 🎯 Next Steps

1. **Immediate**: Configure Sentry with your DSN
2. **This Week**: Add performance hooks to 3 key screens
3. **This Month**: Implement image optimization across the app
4. **Ongoing**: Review analytics and Sentry reports weekly

Your app is now production-ready with comprehensive monitoring! 🎉
