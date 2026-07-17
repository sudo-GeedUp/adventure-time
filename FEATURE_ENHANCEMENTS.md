# Feature Enhancements Documentation

This document outlines the comprehensive feature enhancements added to Adventure Time app.

## 🌐 Real User Locations (Firebase Integration)

### Overview
Replaced mock nearby users with real-time Firebase data for live user tracking on the map.

### Implementation
- **File**: `utils/firebase.ts`
- **Service**: `FirebaseLocationService`
- **Integration**: `screens/ExploreMapScreen.tsx`

### Features
- Real-time location broadcasting every 10 seconds
- Automatic online/offline status tracking
- Distance-based filtering of nearby users
- Fallback to mock data when Firebase is unavailable

### Usage
```typescript
// Start broadcasting your location
await FirebaseLocationService.startLocationBroadcast(userId);

// Subscribe to nearby users
const unsubscribe = FirebaseLocationService.subscribeToNearbyUsers((users) => {
  console.log('Nearby users:', users);
});

// Stop broadcasting
FirebaseLocationService.stopLocationBroadcast();
```

### Database Structure
```
users/
  locations/
    {userId}/
      userId: string
      userName: string
      location: { latitude, longitude }
      vehicleType: string
      isOnline: boolean
      lastSeen: timestamp
      currentAdventure?: string
      avatarUrl?: string
```

---

## ⚠️ Trail Events & Warnings

### Overview
Community-driven trail condition updates with real-time notifications.

### Implementation
- **Service**: `TrailEventsService` in `utils/firebase.ts`
- **Component**: `components/TrailEventCard.tsx`

### Event Types
- **Warning**: Hazards, obstacles, dangerous conditions
- **Closure**: Trail closures, road blocks
- **Condition**: Weather, terrain, seasonal updates
- **Event**: Meetups, group rides, organized events

### Severity Levels
- **Critical**: Immediate danger, trail impassable
- **High**: Significant hazard, proceed with caution
- **Medium**: Notable condition, awareness needed
- **Low**: Minor update, informational

### Features
- Report trail events with location and photos
- Upvote/downvote system for verification
- Auto-expiration for time-sensitive events
- Verified badge for confirmed events
- Real-time updates across all users

### Usage
```typescript
// Report a trail event
const eventId = await TrailEventsService.reportTrailEvent({
  trailId: 'trail_123',
  trailName: 'Moab Rim Trail',
  type: 'warning',
  severity: 'high',
  title: 'Washout at Mile 3',
  description: 'Heavy rain caused washout. 4x4 required.',
  location: { latitude: 38.5729, longitude: -109.5898 },
  reportedBy: userId,
  reportedByName: 'John Doe',
  photos: ['url1', 'url2'],
});

// Subscribe to trail events
const unsubscribe = TrailEventsService.subscribeToTrailEvents(trailId, (events) => {
  console.log('Trail events:', events);
});

// Vote on event
await TrailEventsService.voteOnEvent(eventId, 'up');
```

### Database Structure
```
trail-events/
  {eventId}/
    id: string
    trailId: string
    trailName: string
    type: 'warning' | 'closure' | 'condition' | 'event'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    location: { latitude, longitude }
    reportedBy: string
    reportedByName: string
    timestamp: number
    expiresAt?: number
    upvotes: number
    downvotes: number
    photos?: string[]
    verified: boolean
```

---

## 📸 Photo/Media Sharing

### Overview
Capture and share photos from adventures with Firebase Storage integration.

### Implementation
- **Service**: `MediaService` in `utils/firebase.ts`
- **Component**: `components/PhotoCapture.tsx`

### Features
- Take photos with camera
- Select photos from library
- Multiple photo support (up to 5 per adventure)
- Image compression and optimization
- Firebase Storage upload
- Photo preview and removal

### Usage
```typescript
// Upload adventure photo
const photoUrl = await MediaService.uploadAdventurePhoto(adventureId, photoUri);

// Upload profile photo
const avatarUrl = await MediaService.uploadProfilePhoto(userId, photoUri);

// Upload trail event photo
const eventPhotoUrl = await MediaService.uploadTrailEventPhoto(eventId, photoUri);
```

### Component Usage
```tsx
<PhotoCapture
  onPhotoSelected={(uri) => console.log('Photo selected:', uri)}
  maxPhotos={5}
  photos={existingPhotos}
/>
```

### Storage Structure
```
adventures/
  {adventureId}/
    {timestamp}.jpg
profiles/
  {userId}/
    profile.jpg
trail-events/
  {eventId}/
    {timestamp}.jpg
```

---

## 👥 Social Features

### Friend System

#### Features
- Send friend requests
- Accept/reject requests
- View friends list
- Remove friends
- Real-time friend status updates

#### Usage
```typescript
// Send friend request
const requestId = await SocialService.sendFriendRequest(
  fromUserId,
  fromUserName,
  toUserId,
  toUserName
);

// Accept friend request
await SocialService.acceptFriendRequest(requestId);

// Subscribe to pending requests
const unsubscribe = SocialService.subscribeToPendingRequests(userId, (requests) => {
  console.log('Pending requests:', requests);
});

// Subscribe to friends list
const unsubscribe = SocialService.subscribeToFriends(userId, (friends) => {
  console.log('Friends:', friends);
});

// Remove friend
await SocialService.removeFriend(userId, friendId);
```

### Messaging System

#### Features
- Direct messaging between users
- Real-time message delivery
- Read receipts
- Conversation history
- Convoy chat support

#### Usage
```typescript
// Send message
const messageId = await MessagingService.sendMessage(
  conversationId,
  senderId,
  senderName,
  'Hello!'
);

// Subscribe to messages
const unsubscribe = MessagingService.subscribeToMessages(conversationId, (messages) => {
  console.log('Messages:', messages);
});

// Mark as read
await MessagingService.markAsRead(conversationId, messageId);

// Get conversation ID
const conversationId = MessagingService.getConversationId(userId1, userId2);
```

### Database Structure
```
friend-requests/
  {requestId}/
    id: string
    fromUserId: string
    fromUserName: string
    toUserId: string
    toUserName: string
    status: 'pending' | 'accepted' | 'rejected'
    timestamp: number

friendships/
  {userId}/
    {friendId}/
      userId: string
      friendId: string
      friendName: string
      friendAvatar?: string
      since: number

messages/
  {conversationId}/
    {messageId}/
      id: string
      conversationId: string
      senderId: string
      senderName: string
      text: string
      timestamp: number
      read: boolean
```

---

## 🗺️ Offline Map Downloads

### Overview
Complete offline map functionality for adventures without internet connectivity.

### Implementation
- **File**: `utils/offlineMaps.ts` (enhanced)
- Integrated with existing `OfflineMapsManager`

### Features
- Download trail maps for offline use
- Automatic caching of visited areas
- Storage management
- Map tile optimization
- Background download support

### Usage
```typescript
// Download trail for offline use
await OfflineMapsManager.downloadTrailMap(trail);

// Check if trail is cached
const isCached = await OfflineMapsManager.isTrailCached(trailId);

// Get cached trails
const cachedTrails = await OfflineMapsManager.getCachedTrails();

// Clear cache
await OfflineMapsManager.clearCache();
```

---

## 🌤️ Weather Integration

### Overview
Real-time weather conditions for trails using OpenWeather API.

### Implementation
- **Service**: `WeatherService` in `utils/firebase.ts`
- **Component**: `components/WeatherWidget.tsx`

### Features
- Current weather conditions
- Temperature, humidity, wind speed
- Weather icons and descriptions
- Compact and full display modes
- Automatic location-based weather

### Usage
```typescript
// Get weather for location
const weather = await WeatherService.getWeather(latitude, longitude);

// Get weather icon URL
const iconUrl = WeatherService.getWeatherIconUrl(weather.icon);
```

### Component Usage
```tsx
// Full weather widget
<WeatherWidget latitude={38.5729} longitude={-109.5898} />

// Compact weather display
<WeatherWidget latitude={38.5729} longitude={-109.5898} compact />
```

### Weather Data Structure
```typescript
interface WeatherData {
  temperature: number;      // Fahrenheit
  condition: string;        // Clear, Clouds, Rain, etc.
  description: string;      // Detailed description
  humidity: number;         // Percentage
  windSpeed: number;        // MPH
  icon: string;            // Weather icon code
  timestamp: number;       // When data was fetched
}
```

---

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenWeather API
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Realtime Database
3. Enable Storage
4. Set up security rules:

```json
{
  "rules": {
    "users": {
      "locations": {
        "$uid": {
          ".read": true,
          ".write": "$uid === auth.uid"
        }
      }
    },
    "trail-events": {
      ".read": true,
      "$eventId": {
        ".write": "auth != null"
      }
    },
    "friend-requests": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "friendships": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$conversationId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

### OpenWeather Setup

1. Sign up at https://openweathermap.org/api
2. Get your free API key
3. Add to `.env` file

---

## 📱 Integration Examples

### Adding Weather to Trail Cards

```tsx
import WeatherWidget from '@/components/WeatherWidget';

<View style={styles.trailCard}>
  <Text>{trail.name}</Text>
  <WeatherWidget 
    latitude={trail.location.latitude}
    longitude={trail.location.longitude}
    compact
  />
</View>
```

### Adding Photo Upload to Adventures

```tsx
import PhotoCapture from '@/components/PhotoCapture';
import { MediaService } from '@/utils/firebase';

const [photos, setPhotos] = useState<string[]>([]);

const handlePhotoSelected = async (uri: string) => {
  const url = await MediaService.uploadAdventurePhoto(adventureId, uri);
  setPhotos([...photos, url]);
};

<PhotoCapture
  onPhotoSelected={handlePhotoSelected}
  photos={photos}
/>
```

### Displaying Trail Events

```tsx
import TrailEventCard from '@/components/TrailEventCard';
import { TrailEventsService } from '@/utils/firebase';

const [events, setEvents] = useState<TrailEvent[]>([]);

useEffect(() => {
  const unsubscribe = TrailEventsService.subscribeToTrailEvents(trailId, setEvents);
  return unsubscribe;
}, [trailId]);

{events.map(event => (
  <TrailEventCard
    key={event.id}
    event={event}
    onUpvote={() => TrailEventsService.voteOnEvent(event.id, 'up')}
    onDownvote={() => TrailEventsService.voteOnEvent(event.id, 'down')}
  />
))}
```

---

## 🚀 Next Steps

### Immediate Tasks
1. Configure Firebase project and add credentials to `.env`
2. Get OpenWeather API key and add to `.env`
3. Test real-time user location tracking
4. Test trail event reporting and voting
5. Test photo upload functionality

### Future Enhancements
- Push notifications for trail events
- Group convoy chat rooms
- Video sharing support
- Trail rating system
- Achievement badges for trail events
- Weather alerts and warnings
- Offline message queue

---

## 📊 Performance Considerations

- Location updates: Every 10 seconds (configurable)
- Weather cache: 30 minutes
- Photo compression: 80% quality, max 1920px
- Firebase listeners: Auto-cleanup on unmount
- Offline map tiles: Progressive download

---

## 🔒 Security Notes

- All Firebase operations require authentication
- User locations are public but can be made private
- Photos are stored with unique IDs
- Messages are encrypted in transit
- Friend requests require mutual consent
- Trail events can be moderated

---

## 📝 Testing Checklist

- [ ] Firebase initialization
- [ ] Real-time location updates
- [ ] Trail event creation and voting
- [ ] Photo capture and upload
- [ ] Friend request flow
- [ ] Messaging system
- [ ] Weather data fetching
- [ ] Offline map downloads
- [ ] Error handling
- [ ] Permission requests

---

## 🐛 Troubleshooting

### Firebase not connecting
- Check API keys in `.env`
- Verify Firebase project settings
- Check network connectivity
- Review Firebase console logs

### Photos not uploading
- Check storage permissions
- Verify Firebase Storage is enabled
- Check file size limits
- Review storage rules

### Weather not loading
- Verify OpenWeather API key
- Check API quota limits
- Verify location permissions
- Check network connectivity

### Location not updating
- Check location permissions
- Verify GPS is enabled
- Check Firebase rules
- Review network connectivity

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [OpenWeather API Docs](https://openweathermap.org/api)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
