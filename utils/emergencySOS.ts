import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { storage } from './storage';

const EMERGENCY_CONTACTS_KEY = '@adventure-time/emergency_contacts';
const SOS_HISTORY_KEY = '@adventure-time/sos_history';

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

export class EmergencySOS {
  // Send emergency alert to all contacts
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
