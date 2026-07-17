import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, push, update, remove, Database } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as Location from 'expo-location';
import { storage } from './storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let database: Database | null = null;
let storageInstance: any = null;
let isFirebaseEnabled = false;

// Initialize Firebase
export function initializeFirebase() {
  try {
    if (!firebaseConfig.apiKey) {
      console.log('Firebase config not set up. Using local storage mode.');
      return false;
    }

    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      storageInstance = getStorage(app);
      isFirebaseEnabled = true;
      console.log('Firebase initialized successfully');
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
}

// Check if Firebase is available
export function isFirebaseAvailable(): boolean {
  return isFirebaseEnabled && database !== null;
}

// User Location Tracking
export interface UserLocation {
  userId: string;
  userName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  vehicleType: string;
  isOnline: boolean;
  lastSeen: number;
  currentAdventure?: string;
  avatarUrl?: string;
}

export class FirebaseLocationService {
  private static locationUpdateInterval: NodeJS.Timeout | null = null;
  private static currentUserId: string | null = null;

  // Start broadcasting user location
  static async startLocationBroadcast(userId: string): Promise<void> {
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, skipping location broadcast');
      return;
    }

    this.currentUserId = userId;
    const userProfile = await storage.getUserProfile();

    // Update location every 10 seconds
    this.locationUpdateInterval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userLocation: UserLocation = {
          userId,
          userName: userProfile?.name || 'Anonymous',
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          vehicleType: userProfile?.vehicleType || 'Unknown',
          isOnline: true,
          lastSeen: Date.now(),
        };

        await this.updateUserLocation(userId, userLocation);
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 10000);
  }

  // Stop broadcasting location
  static stopLocationBroadcast(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }

    if (this.currentUserId && database) {
      const userRef = ref(database, `users/locations/${this.currentUserId}`);
      update(userRef, { isOnline: false, lastSeen: Date.now() });
    }
  }

  // Update user location in Firebase
  static async updateUserLocation(userId: string, location: UserLocation): Promise<void> {
    if (!database) return;
    const userRef = ref(database, `users/locations/${userId}`);
    await set(userRef, location);
  }

  // Get nearby users
  static subscribeToNearbyUsers(
    callback: (users: UserLocation[]) => void,
    maxDistance: number = 50
  ): () => void {
    if (!database) {
      callback([]);
      return () => {};
    }

    const usersRef = ref(database, 'users/locations');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users: UserLocation[] = [];
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val() as UserLocation;
        // Filter out current user and offline users
        if (user.userId !== this.currentUserId && user.isOnline) {
          users.push(user);
        }
      });
      callback(users);
    });

    return () => off(usersRef, 'value', unsubscribe);
  }
}

// Trail Events and Warnings
export interface TrailEvent {
  id: string;
  trailId: string;
  trailName: string;
  type: 'warning' | 'closure' | 'condition' | 'event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  reportedBy: string;
  reportedByName: string;
  timestamp: number;
  expiresAt?: number;
  upvotes: number;
  downvotes: number;
  photos?: string[];
  verified: boolean;
}

export class TrailEventsService {
  // Report a trail event
  static async reportTrailEvent(event: Omit<TrailEvent, 'id' | 'timestamp' | 'upvotes' | 'downvotes' | 'verified'>): Promise<string> {
    if (!database) throw new Error('Firebase not available');

    const eventsRef = ref(database, 'trail-events');
    const newEventRef = push(eventsRef);
    
    const fullEvent: TrailEvent = {
      ...event,
      id: newEventRef.key!,
      timestamp: Date.now(),
      upvotes: 0,
      downvotes: 0,
      verified: false,
    };

    await set(newEventRef, fullEvent);
    return fullEvent.id;
  }

  // Get trail events for a specific trail
  static subscribeToTrailEvents(
    trailId: string,
    callback: (events: TrailEvent[]) => void
  ): () => void {
    if (!database) {
      callback([]);
      return () => {};
    }

    const eventsRef = ref(database, 'trail-events');
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const events: TrailEvent[] = [];
      const now = Date.now();
      
      snapshot.forEach((childSnapshot) => {
        const event = childSnapshot.val() as TrailEvent;
        // Filter by trail and check if not expired
        if (event.trailId === trailId && (!event.expiresAt || event.expiresAt > now)) {
          events.push(event);
        }
      });
      
      // Sort by timestamp (newest first)
      events.sort((a, b) => b.timestamp - a.timestamp);
      callback(events);
    });

    return () => off(eventsRef, 'value', unsubscribe);
  }

  // Get all active trail events
  static subscribeToAllTrailEvents(callback: (events: TrailEvent[]) => void): () => void {
    if (!database) {
      callback([]);
      return () => {};
    }

    const eventsRef = ref(database, 'trail-events');
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const events: TrailEvent[] = [];
      const now = Date.now();
      
      snapshot.forEach((childSnapshot) => {
        const event = childSnapshot.val() as TrailEvent;
        if (!event.expiresAt || event.expiresAt > now) {
          events.push(event);
        }
      });
      
      events.sort((a, b) => b.timestamp - a.timestamp);
      callback(events);
    });

    return () => off(eventsRef, 'value', unsubscribe);
  }

  // Upvote/downvote an event
  static async voteOnEvent(eventId: string, vote: 'up' | 'down'): Promise<void> {
    if (!database) return;
    
    const eventRef = ref(database, `trail-events/${eventId}`);
    const field = vote === 'up' ? 'upvotes' : 'downvotes';
    
    // Get current value and increment
    onValue(eventRef, (snapshot) => {
      const event = snapshot.val() as TrailEvent;
      if (event) {
        const updates: any = {};
        updates[field] = (event[field] || 0) + 1;
        update(eventRef, updates);
      }
    }, { onlyOnce: true });
  }

  // Delete an event (admin or reporter only)
  static async deleteEvent(eventId: string): Promise<void> {
    if (!database) return;
    const eventRef = ref(database, `trail-events/${eventId}`);
    await remove(eventRef);
  }
}

// Photo/Media Sharing
export class MediaService {
  // Upload photo to Firebase Storage
  static async uploadPhoto(
    uri: string,
    path: string,
    fileName: string
  ): Promise<string> {
    if (!storageInstance) throw new Error('Firebase Storage not available');

    const response = await fetch(uri);
    const blob = await response.blob();
    
    const photoRef = storageRef(storageInstance, `${path}/${fileName}`);
    await uploadBytes(photoRef, blob);
    
    const downloadURL = await getDownloadURL(photoRef);
    return downloadURL;
  }

  // Upload adventure photo
  static async uploadAdventurePhoto(
    adventureId: string,
    photoUri: string
  ): Promise<string> {
    const fileName = `${Date.now()}.jpg`;
    return await this.uploadPhoto(photoUri, `adventures/${adventureId}`, fileName);
  }

  // Upload profile photo
  static async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
    const fileName = `profile.jpg`;
    return await this.uploadPhoto(photoUri, `profiles/${userId}`, fileName);
  }

  // Upload trail event photo
  static async uploadTrailEventPhoto(
    eventId: string,
    photoUri: string
  ): Promise<string> {
    const fileName = `${Date.now()}.jpg`;
    return await this.uploadPhoto(photoUri, `trail-events/${eventId}`, fileName);
  }
}

// Social Features - Friends
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface Friendship {
  userId: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  since: number;
}

export class SocialService {
  // Send friend request
  static async sendFriendRequest(
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    toUserName: string
  ): Promise<string> {
    if (!database) throw new Error('Firebase not available');

    const requestsRef = ref(database, 'friend-requests');
    const newRequestRef = push(requestsRef);
    
    const request: FriendRequest = {
      id: newRequestRef.key!,
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      status: 'pending',
      timestamp: Date.now(),
    };

    await set(newRequestRef, request);
    return request.id;
  }

  // Accept friend request
  static async acceptFriendRequest(requestId: string): Promise<void> {
    if (!database) return;

    const requestRef = ref(database, `friend-requests/${requestId}`);
    
    onValue(requestRef, async (snapshot) => {
      const request = snapshot.val() as FriendRequest;
      if (request && request.status === 'pending') {
        // Update request status
        await update(requestRef, { status: 'accepted' });
        
        // Create friendship entries for both users
        const friendship1: Friendship = {
          userId: request.fromUserId,
          friendId: request.toUserId,
          friendName: request.toUserName,
          since: Date.now(),
        };
        
        const friendship2: Friendship = {
          userId: request.toUserId,
          friendId: request.fromUserId,
          friendName: request.fromUserName,
          since: Date.now(),
        };
        
        await set(ref(database!, `friendships/${request.fromUserId}/${request.toUserId}`), friendship1);
        await set(ref(database!, `friendships/${request.toUserId}/${request.fromUserId}`), friendship2);
      }
    }, { onlyOnce: true });
  }

  // Reject friend request
  static async rejectFriendRequest(requestId: string): Promise<void> {
    if (!database) return;
    const requestRef = ref(database, `friend-requests/${requestId}`);
    await update(requestRef, { status: 'rejected' });
  }

  // Get pending friend requests for a user
  static subscribeToPendingRequests(
    userId: string,
    callback: (requests: FriendRequest[]) => void
  ): () => void {
    if (!database) {
      callback([]);
      return () => {};
    }

    const requestsRef = ref(database, 'friend-requests');
    
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const requests: FriendRequest[] = [];
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val() as FriendRequest;
        if (request.toUserId === userId && request.status === 'pending') {
          requests.push(request);
        }
      });
      callback(requests);
    });

    return () => off(requestsRef, 'value', unsubscribe);
  }

  // Get user's friends
  static subscribeToFriends(
    userId: string,
    callback: (friends: Friendship[]) => void
  ): () => void {
    if (!database) {
      callback([]);
      return () => {};
    }

    const friendsRef = ref(database, `friendships/${userId}`);
    
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      const friends: Friendship[] = [];
      snapshot.forEach((childSnapshot) => {
        friends.push(childSnapshot.val() as Friendship);
      });
      callback(friends);
    });

    return () => off(friendsRef, 'value', unsubscribe);
  }

  // Remove friend
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    if (!database) return;
    await remove(ref(database, `friendships/${userId}/${friendId}`));
    await remove(ref(database, `friendships/${friendId}/${userId}`));
  }
}

// Messaging
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export class MessagingService {
  // Send a message
  static async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    text: string
  ): Promise<string> {
    if (!database) throw new Error('Firebase not available');

    const messagesRef = ref(database, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    
    const message: Message = {
      id: newMessageRef.key!,
      conversationId,
      senderId,
      senderName,
      text,
      timestamp: Date.now(),
      read: false,
    };

    await set(newMessageRef, message);
    return message.id;
  }

  // Subscribe to conversation messages
  static subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    if (!database) {
      callback([]);
      return () => {};
    }

    const messagesRef = ref(database, `messages/${conversationId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((childSnapshot) => {
        messages.push(childSnapshot.val() as Message);
      });
      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    });

    return () => off(messagesRef, 'value', unsubscribe);
  }

  // Mark message as read
  static async markAsRead(conversationId: string, messageId: string): Promise<void> {
    if (!database) return;
    const messageRef = ref(database, `messages/${conversationId}/${messageId}`);
    await update(messageRef, { read: true });
  }

  // Get conversation ID between two users
  static getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }
}

// Weather Integration
export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  timestamp: number;
}

export class WeatherService {
  private static WEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
  private static WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

  // Get weather for location
  static async getWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
    if (!this.WEATHER_API_KEY) {
      console.log('Weather API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${this.WEATHER_API_KEY}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed),
        icon: data.weather[0].icon,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  }

  // Get weather icon URL
  static getWeatherIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }
}

// Initialize Firebase on module load
initializeFirebase();
