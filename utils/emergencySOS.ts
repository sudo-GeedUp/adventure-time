import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { storage } from './storage';

const EMERGENCY_CONTACTS_KEY = '@adventure-time/emergency_contacts';
const SOS_HISTORY_KEY = '@adventure-time/sos_history';
const ROUTE_TRACKING_KEY = '@adventure-time/route_tracking';
const LOCATION_SHARE_HISTORY_KEY = '@adventure-time/location_share_history';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface SOSAlert {
  id: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  message: string;
  contactsNotified: string[];
  status: 'active' | 'resolved' | 'cancelled';
  vehicleInfo?: string;
  trailName?: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: number;
  speed?: number;
}

export interface LocationShare {
  id: string;
  timestamp: number;
  currentLocation: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  route: RoutePoint[];
  message: string;
  contactsNotified: string[];
  trailName?: string;
  vehicleInfo?: string;
  duration: number;
  distance: number;
}

export class EmergencySOS {
  // Track route points
  static async startRouteTracking(): Promise<void> {
    try {
      const route: RoutePoint[] = [];
      await AsyncStorage.setItem(ROUTE_TRACKING_KEY, JSON.stringify({
        startTime: Date.now(),
        route,
        isTracking: true,
      }));
    } catch (error) {
      console.error('Error starting route tracking:', error);
    }
  }

  static async addRoutePoint(location: Location.LocationObject): Promise<void> {
    try {
      const trackingData = await AsyncStorage.getItem(ROUTE_TRACKING_KEY);
      if (!trackingData) return;
      
      const data = JSON.parse(trackingData);
      if (!data.isTracking) return;

      const point: RoutePoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude || undefined,
        timestamp: Date.now(),
        speed: location.coords.speed || undefined,
      };

      data.route.push(point);
      await AsyncStorage.setItem(ROUTE_TRACKING_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error adding route point:', error);
    }
  }

  static async getRouteTracking(): Promise<{ startTime: number; route: RoutePoint[]; isTracking: boolean } | null> {
    try {
      const trackingData = await AsyncStorage.getItem(ROUTE_TRACKING_KEY);
      return trackingData ? JSON.parse(trackingData) : null;
    } catch (error) {
      console.error('Error getting route tracking:', error);
      return null;
    }
  }

  static async stopRouteTracking(): Promise<RoutePoint[]> {
    try {
      const trackingData = await AsyncStorage.getItem(ROUTE_TRACKING_KEY);
      if (!trackingData) return [];
      
      const data = JSON.parse(trackingData);
      const route = data.route || [];
      
      await AsyncStorage.setItem(ROUTE_TRACKING_KEY, JSON.stringify({
        startTime: data.startTime,
        route: [],
        isTracking: false,
      }));
      
      return route;
    } catch (error) {
      console.error('Error stopping route tracking:', error);
      return [];
    }
  }

  // Calculate distance between two points (Haversine formula)
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Share location with route
  static async shareLocationWithRoute(
    customMessage?: string,
    trailName?: string
  ): Promise<void> {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const contacts = await this.getEmergencyContacts();
      if (contacts.length === 0) {
        Alert.alert(
          'No Contacts',
          'Please add emergency contacts in your profile before sharing location.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get route tracking data
      const trackingData = await this.getRouteTracking();
      const route = trackingData?.route || [];
      
      // Calculate total distance
      let totalDistance = 0;
      for (let i = 1; i < route.length; i++) {
        totalDistance += this.calculateDistance(
          route[i - 1].latitude,
          route[i - 1].longitude,
          route[i].latitude,
          route[i].longitude
        );
      }

      // Calculate duration
      const duration = trackingData?.startTime 
        ? Date.now() - trackingData.startTime 
        : 0;

      // Get user profile for vehicle info
      const profile = await storage.getUserProfile();
      const vehicleInfo = profile?.vehicleSpecs
        ? `${profile.vehicleSpecs.make} ${profile.vehicleSpecs.model} ${profile.vehicleSpecs.year}`
        : profile?.vehicleType || 'Unknown vehicle';

      // Create Google Maps URL with route waypoints
      const googleMapsUrl = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      
      // Create route visualization URL (if route exists)
      let routeUrl = '';
      if (route.length > 0) {
        const waypoints = route.slice(0, 8).map(p => `${p.latitude},${p.longitude}`).join('|');
        routeUrl = `\n🗺️ Route: https://www.google.com/maps/dir/${waypoints}/${location.coords.latitude},${location.coords.longitude}`;
      }

      const message = `📍 Location Check-In
${customMessage || 'Sharing my location with you'}

📍 Current Location: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}
${trailName ? `🛤️ Trail: ${trailName}` : ''}
🚗 Vehicle: ${vehicleInfo}
${route.length > 0 ? `📏 Distance traveled: ${totalDistance.toFixed(2)} km` : ''}
${duration > 0 ? `⏱️ Duration: ${Math.round(duration / 60000)} minutes` : ''}
📱 View location: ${googleMapsUrl}${routeUrl}

Shared via Adventure Time app.`;

      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const phoneNumbers = contacts.map(c => c.phone);
        await SMS.sendSMSAsync(phoneNumbers, message);
      } else {
        Alert.alert(
          'SMS Not Available',
          'SMS is not available on this device. The message has been copied to your clipboard.',
          [{ text: 'OK' }]
        );
      }

      // Save location share history
      const locationShare: LocationShare = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || undefined,
        },
        route,
        message: customMessage || 'Location check-in',
        contactsNotified: contacts.map(c => c.name),
        trailName,
        vehicleInfo,
        duration,
        distance: totalDistance,
      };

      await this.saveLocationShareHistory(locationShare);

      Alert.alert(
        'Location Shared',
        `Location and route shared with ${contacts.length} contact(s)`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Failed to share location. Please try again.');
    }
  }

  // Save location share history
  static async saveLocationShareHistory(share: LocationShare): Promise<void> {
    try {
      const history = await this.getLocationShareHistory();
      history.unshift(share);
      if (history.length > 50) {
        history.splice(50);
      }
      await AsyncStorage.setItem(LOCATION_SHARE_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving location share history:', error);
    }
  }

  // Get location share history
  static async getLocationShareHistory(): Promise<LocationShare[]> {
    try {
      const history = await AsyncStorage.getItem(LOCATION_SHARE_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting location share history:', error);
      return [];
    }
  }

  // Send emergency alert to all contacts (keep for true emergencies)
  static async sendSOSAlert(
    customMessage?: string,
    trailName?: string
  ): Promise<void> {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const contacts = await this.getEmergencyContacts();
      if (contacts.length === 0) {
        Alert.alert(
          'No Emergency Contacts',
          'Please add emergency contacts in your profile before using SOS.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get user profile for vehicle info
      const profile = await storage.getUserProfile();
      const vehicleInfo = profile?.vehicleSpecs
        ? `${profile.vehicleSpecs.make} ${profile.vehicleSpecs.model} ${profile.vehicleSpecs.year}`
        : profile?.vehicleType || 'Unknown vehicle';

      // Create SOS message
      const googleMapsUrl = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      const message = `🆘 EMERGENCY ALERT 🆘
${customMessage || 'I need assistance!'}

📍 Location: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}
${trailName ? `🛤️ Trail: ${trailName}` : ''}
🚗 Vehicle: ${vehicleInfo}
📱 View on map: ${googleMapsUrl}

This is an automated emergency alert from Adventure Time app.`;

      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        // Send SMS to all emergency contacts
        const phoneNumbers = contacts.map(c => c.phone);
        await SMS.sendSMSAsync(phoneNumbers, message);
      } else {
        // Fallback to copying message to clipboard
        Alert.alert(
          'SMS Not Available',
          'SMS is not available on this device. The emergency message has been copied to your clipboard.',
          [{ text: 'OK' }]
        );
      }

      // Log SOS alert
      const sosAlert: SOSAlert = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || undefined,
        },
        message: customMessage || 'Emergency assistance needed',
        contactsNotified: contacts.map(c => c.name),
        status: 'active',
        vehicleInfo,
        trailName,
      };

      await this.saveSOSHistory(sosAlert);

      Alert.alert(
        'SOS Sent',
        `Emergency alert sent to ${contacts.length} contact(s)`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please try calling 911.');
    }
  }

  // Add emergency contact
  static async addEmergencyContact(contact: EmergencyContact): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts();
      contacts.push(contact);
      await AsyncStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify(contacts));
    } catch (error) {
      console.error('Error adding emergency contact:', error);
    }
  }

  // Get all emergency contacts
  static async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const contacts = await AsyncStorage.getItem(EMERGENCY_CONTACTS_KEY);
      return contacts ? JSON.parse(contacts) : [];
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      return [];
    }
  }

  // Remove emergency contact
  static async removeEmergencyContact(contactId: string): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts();
      const filtered = contacts.filter(c => c.id !== contactId);
      await AsyncStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing emergency contact:', error);
    }
  }

  // Save SOS history
  static async saveSOSHistory(alert: SOSAlert): Promise<void> {
    try {
      const history = await this.getSOSHistory();
      history.unshift(alert);
      // Keep only last 50 alerts
      if (history.length > 50) {
        history.splice(50);
      }
      await AsyncStorage.setItem(SOS_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving SOS history:', error);
    }
  }

  // Get SOS history
  static async getSOSHistory(): Promise<SOSAlert[]> {
    try {
      const history = await AsyncStorage.getItem(SOS_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting SOS history:', error);
      return [];
    }
  }

  // Update SOS status
  static async updateSOSStatus(
    alertId: string, 
    status: 'active' | 'resolved' | 'cancelled'
  ): Promise<void> {
    try {
      const history = await this.getSOSHistory();
      const alertIndex = history.findIndex(a => a.id === alertId);
      if (alertIndex !== -1) {
        history[alertIndex].status = status;
        await AsyncStorage.setItem(SOS_HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error updating SOS status:', error);
    }
  }

  // Call emergency services
  static async call911(): Promise<void> {
    const phoneNumber = 'tel:911';
    const canOpen = await Linking.canOpenURL(phoneNumber);
    if (canOpen) {
      await Linking.openURL(phoneNumber);
    } else {
      Alert.alert('Error', 'Unable to make phone call on this device');
    }
  }

  // Share live location (opens messaging app with location)
  static async shareLiveLocation(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const message = `My current location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      
      // Try to open default messaging app with pre-filled message
      const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Location', message, [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Unable to get current location');
    }
  }
}
