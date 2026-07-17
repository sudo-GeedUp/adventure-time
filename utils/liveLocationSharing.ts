import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

export interface SharedLocation {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
  accuracy?: number;
  batteryLevel?: number;
  status: 'active' | 'paused' | 'stopped';
  adventureId?: string;
}

export interface LocationSharingSession {
  id: string;
  userId: string;
  userName: string;
  startTime: number;
  endTime?: number;
  shareWithUserIds: string[];
  shareWithFriends: boolean;
  shareWithPublic: boolean;
  updateInterval: number; // milliseconds
  isActive: boolean;
  lastLocation?: SharedLocation;
}

const STORAGE_KEY = '@location_sharing_sessions';
const SHARED_LOCATIONS_KEY = '@shared_locations';

class LiveLocationSharingManager {
  private activeSession: LocationSharingSession | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  async startSharing(params: {
    userName: string;
    shareWithUserIds?: string[];
    shareWithFriends?: boolean;
    shareWithPublic?: boolean;
    updateInterval?: number;
    adventureId?: string;
  }): Promise<LocationSharingSession> {
    // Stop any existing session
    await this.stopSharing();

    const session: LocationSharingSession = {
      id: `session_${Date.now()}`,
      userId: `user_${Date.now()}`,
      userName: params.userName,
      startTime: Date.now(),
      shareWithUserIds: params.shareWithUserIds || [],
      shareWithFriends: params.shareWithFriends || false,
      shareWithPublic: params.shareWithPublic || false,
      updateInterval: params.updateInterval || 10000, // Default 10 seconds
      isActive: true,
    };

    this.activeSession = session;
    await this.saveSession(session);
    await this.startLocationUpdates(params.adventureId);

    return session;
  }

  async stopSharing(): Promise<void> {
    if (this.activeSession) {
      this.activeSession.isActive = false;
      this.activeSession.endTime = Date.now();
      await this.saveSession(this.activeSession);
    }

    this.stopLocationUpdates();
    this.activeSession = null;
  }

  async pauseSharing(): Promise<void> {
    if (this.activeSession && this.activeSession.lastLocation) {
      this.activeSession.lastLocation.status = 'paused';
      await this.broadcastLocation(this.activeSession.lastLocation);
    }
    this.stopLocationUpdates();
  }

  async resumeSharing(adventureId?: string): Promise<void> {
    if (this.activeSession) {
      await this.startLocationUpdates(adventureId);
    }
  }

  private async startLocationUpdates(adventureId?: string): Promise<void> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Start watching location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.activeSession?.updateInterval || 10000,
          distanceInterval: 10, // Update if moved 10 meters
        },
        async (location) => {
          await this.handleLocationUpdate(location, adventureId);
        }
      );
    } catch (error) {
      console.error('Error starting location updates:', error);
      throw error;
    }
  }

  private stopLocationUpdates(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async handleLocationUpdate(
    location: Location.LocationObject,
    adventureId?: string
  ): Promise<void> {
    if (!this.activeSession) return;

    const sharedLocation: SharedLocation = {
      userId: this.activeSession.userId,
      userName: this.activeSession.userName,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy || undefined,
      status: 'active',
      adventureId,
    };

    this.activeSession.lastLocation = sharedLocation;
    await this.saveSession(this.activeSession);
    await this.broadcastLocation(sharedLocation);
  }

  private async broadcastLocation(location: SharedLocation): Promise<void> {
    // Save to local storage for retrieval by other users
    const locations = await this.getSharedLocations();
    
    // Remove old location for this user
    const filtered = locations.filter(l => l.userId !== location.userId);
    filtered.push(location);
    
    // Keep only last 100 locations
    const trimmed = filtered.slice(-100);
    
    await AsyncStorage.setItem(SHARED_LOCATIONS_KEY, JSON.stringify(trimmed));

    // In production, this would send to a backend server
    // For now, we're using local storage for demo purposes
  }

  async getSharedLocations(): Promise<SharedLocation[]> {
    try {
      const data = await AsyncStorage.getItem(SHARED_LOCATIONS_KEY);
      if (!data) return [];
      
      const locations: SharedLocation[] = JSON.parse(data);
      
      // Filter out stale locations (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return locations.filter(l => l.timestamp > fiveMinutesAgo);
    } catch (error) {
      console.error('Error getting shared locations:', error);
      return [];
    }
  }

  async getLocationForUser(userId: string): Promise<SharedLocation | null> {
    const locations = await this.getSharedLocations();
    return locations.find(l => l.userId === userId) || null;
  }

  async getLocationsNearby(
    currentLocation: { latitude: number; longitude: number },
    radiusMiles: number = 10
  ): Promise<SharedLocation[]> {
    const locations = await this.getSharedLocations();
    
    return locations.filter(location => {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        location.latitude,
        location.longitude
      );
      return distance <= radiusMiles * 1609.34; // Convert miles to meters
    });
  }

  async getFriendsLocations(friendUserIds: string[]): Promise<SharedLocation[]> {
    const locations = await this.getSharedLocations();
    return locations.filter(l => friendUserIds.includes(l.userId));
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async getActiveSession(): Promise<LocationSharingSession | null> {
    return this.activeSession;
  }

  async getAllSessions(): Promise<LocationSharingSession[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  private async saveSession(session: LocationSharingSession): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      
      if (index >= 0) {
        sessions[index] = session;
      } else {
        sessions.push(session);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  async shareLocationWithFriend(friendUserId: string): Promise<void> {
    if (!this.activeSession) {
      throw new Error('No active sharing session');
    }

    if (!this.activeSession.shareWithUserIds.includes(friendUserId)) {
      this.activeSession.shareWithUserIds.push(friendUserId);
      await this.saveSession(this.activeSession);
    }
  }

  async stopSharingWithFriend(friendUserId: string): Promise<void> {
    if (!this.activeSession) return;

    this.activeSession.shareWithUserIds = this.activeSession.shareWithUserIds.filter(
      id => id !== friendUserId
    );
    await this.saveSession(this.activeSession);
  }

  async getEstimatedArrivalTime(
    destination: { latitude: number; longitude: number },
    averageSpeedMph: number = 15
  ): Promise<Date | null> {
    if (!this.activeSession?.lastLocation) return null;

    const distance = this.calculateDistance(
      this.activeSession.lastLocation.latitude,
      this.activeSession.lastLocation.longitude,
      destination.latitude,
      destination.longitude
    );

    const distanceMiles = distance / 1609.34;
    const hoursToDestination = distanceMiles / averageSpeedMph;
    const millisecondsToDestination = hoursToDestination * 60 * 60 * 1000;

    return new Date(Date.now() + millisecondsToDestination);
  }
}

export const liveLocationManager = new LiveLocationSharingManager();
