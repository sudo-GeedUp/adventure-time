import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import ThemedText from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { EmergencySOS, EmergencyContact } from '@/utils/emergencySOS';
import { storage } from '@/utils/storage';

export default function EmergencySOSScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showLocationShareModal, setShowLocationShareModal] = useState(false);
  const [sosMessage, setSOSMessage] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [trailName, setTrailName] = useState('');
  const [isTrackingRoute, setIsTrackingRoute] = useState(false);
  const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0, points: 0 });
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  useEffect(() => {
    loadEmergencyContacts();
    getCurrentLocation();
    checkRouteTracking();
  }, []);

  useEffect(() => {
    let locationSubscription: any;
    
    if (isTrackingRoute) {
      // Update location every 30 seconds while tracking
      const startTracking = async () => {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000,
            distanceInterval: 50,
          },
          async (location) => {
            await EmergencySOS.addRoutePoint(location);
            await updateRouteStats();
          }
        );
      };
      startTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isTrackingRoute]);

  const loadEmergencyContacts = async () => {
    const contacts = await EmergencySOS.getEmergencyContacts();
    setEmergencyContacts(contacts);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const checkRouteTracking = async () => {
    const tracking = await EmergencySOS.getRouteTracking();
    if (tracking) {
      setIsTrackingRoute(tracking.isTracking);
      await updateRouteStats();
    }
  };

  const updateRouteStats = async () => {
    const tracking = await EmergencySOS.getRouteTracking();
    if (!tracking) return;

    const route = tracking.route || [];
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      distance += EmergencySOS.calculateDistance(
        route[i - 1].latitude,
        route[i - 1].longitude,
        route[i].latitude,
        route[i].longitude
      );
    }

    const duration = tracking.startTime ? Date.now() - tracking.startTime : 0;
    setRouteStats({ distance, duration, points: route.length });
  };

  const handleStartTracking = async () => {
    await EmergencySOS.startRouteTracking();
    setIsTrackingRoute(true);
    Alert.alert('Route Tracking Started', 'Your route is now being tracked');
  };

  const handleStopTracking = async () => {
    await EmergencySOS.stopRouteTracking();
    setIsTrackingRoute(false);
    setRouteStats({ distance: 0, duration: 0, points: 0 });
    Alert.alert('Route Tracking Stopped', 'Route tracking has been stopped');
  };

  const handleShareLocation = async () => {
    Alert.alert(
      '📍 Share Location & Route?',
      'This will send your current location and the route you took to your contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            await EmergencySOS.shareLocationWithRoute(locationMessage, trailName);
            setShowLocationShareModal(false);
            setLocationMessage('');
          },
        },
      ]
    );
  };

  const handleSendSOS = async () => {
    Alert.alert(
      '🆘 Send Emergency Alert?',
      'This will send your location and emergency message to all your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            await EmergencySOS.sendSOSAlert(sosMessage, trailName);
            setShowSOSModal(false);
            setSOSMessage('');
          },
        },
      ]
    );
  };

  const handleCall911 = () => {
    Alert.alert(
      'Call Emergency Services',
      'This will dial 911. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => EmergencySOS.call911(),
        },
      ]
    );
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship,
      isPrimary: emergencyContacts.length === 0,
    };

    await EmergencySOS.addEmergencyContact(contact);
    await loadEmergencyContacts();
    setShowAddContactModal(false);
    setNewContact({ name: '', phone: '', relationship: '' });
  };

  const handleDeleteContact = async (contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await EmergencySOS.removeEmergencyContact(contactId);
            await loadEmergencyContacts();
          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      {/* Location Sharing */}
      <View style={styles.emergencySection}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>
          Location Sharing
        </ThemedText>
        
        {/* Route Tracking Card */}
        <View style={[styles.trackingCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.trackingHeader}>
            <Feather 
              name={isTrackingRoute ? "navigation" : "map"} 
              size={24} 
              color={isTrackingRoute ? theme.success : theme.tabIconDefault} 
            />
            <ThemedText style={[Typography.h4, { marginLeft: Spacing.sm }]}>
              {isTrackingRoute ? 'Tracking Route' : 'Route Tracking'}
            </ThemedText>
          </View>
          
          {isTrackingRoute && (
            <View style={styles.routeStats}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>Distance</ThemedText>
                <ThemedText style={styles.statValue}>
                  {routeStats.distance.toFixed(2)} km
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>Duration</ThemedText>
                <ThemedText style={styles.statValue}>
                  {Math.round(routeStats.duration / 60000)} min
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>Points</ThemedText>
                <ThemedText style={styles.statValue}>
                  {routeStats.points}
                </ThemedText>
              </View>
            </View>
          )}
          
          <Pressable
            style={[styles.trackingButton, { 
              backgroundColor: isTrackingRoute ? theme.error : theme.success 
            }]}
            onPress={isTrackingRoute ? handleStopTracking : handleStartTracking}
          >
            <Feather 
              name={isTrackingRoute ? "stop-circle" : "play-circle"} 
              size={20} 
              color="white" 
            />
            <ThemedText style={styles.trackingButtonText}>
              {isTrackingRoute ? 'Stop Tracking' : 'Start Tracking'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Share Location Button */}
        <Pressable
          style={[styles.shareButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowLocationShareModal(true)}
        >
          <Feather name="send" size={28} color="white" />
          <ThemedText style={[Typography.h3, styles.shareButtonText]}>
            Share My Location
          </ThemedText>
          <ThemedText style={styles.shareButtonSubtext}>
            Send location {isTrackingRoute ? 'and route' : ''} to contacts
          </ThemedText>
        </Pressable>

        {/* Emergency Actions */}
        <ThemedText style={[Typography.h4, styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Emergency
        </ThemedText>
        
        <View style={styles.quickActions}>
          <Pressable
            style={[styles.quickActionButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={handleCall911}
          >
            <Feather name="phone" size={24} color={theme.error} />
            <ThemedText style={styles.quickActionText}>Call 911</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.quickActionButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setShowSOSModal(true)}
          >
            <Feather name="alert-triangle" size={24} color={theme.error} />
            <ThemedText style={styles.quickActionText}>Send SOS</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Current Location */}
      {currentLocation && (
        <View style={[styles.locationCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.locationHeader}>
            <Feather name="navigation" size={20} color={theme.success} />
            <ThemedText style={[Typography.h4, { marginLeft: Spacing.sm }]}>
              Current Location
            </ThemedText>
          </View>
          <ThemedText style={styles.coordinates}>
            {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
          </ThemedText>
          {currentLocation.coords.altitude && (
            <ThemedText style={styles.altitude}>
              Altitude: {Math.round(currentLocation.coords.altitude * 3.28084)} ft
            </ThemedText>
          )}
        </View>
      )}

      {/* Emergency Contacts */}
      <View style={styles.contactsSection}>
        <View style={styles.contactsHeader}>
          <ThemedText style={[Typography.h4, styles.sectionTitle]}>
            Emergency Contacts
          </ThemedText>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowAddContactModal(true)}
          >
            <Feather name="plus" size={20} color="white" />
          </Pressable>
        </View>

        {emergencyContacts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="users" size={48} color={theme.tabIconDefault} />
            <ThemedText style={[styles.emptyText, { color: theme.tabIconDefault }]}>
              No emergency contacts added
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>
              Add contacts to receive SOS alerts
            </ThemedText>
          </View>
        ) : (
          emergencyContacts.map((contact) => (
            <View
              key={contact.id}
              style={[styles.contactCard, { backgroundColor: theme.backgroundDefault }]}
            >
              <View style={styles.contactInfo}>
                <ThemedText style={[Typography.h4, styles.contactName]}>
                  {contact.name}
                </ThemedText>
                <ThemedText style={styles.contactPhone}>{contact.phone}</ThemedText>
                {contact.relationship && (
                  <ThemedText style={styles.contactRelation}>
                    {contact.relationship}
                  </ThemedText>
                )}
              </View>
              <Pressable
                onPress={() => handleDeleteContact(contact.id)}
                style={styles.deleteButton}
              >
                <Feather name="trash-2" size={20} color={theme.error} />
              </Pressable>
            </View>
          ))
        )}
      </View>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[Typography.h3, styles.modalTitle]}>
                Add Emergency Contact
              </ThemedText>
              <Pressable onPress={() => setShowAddContactModal(false)}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
              placeholder="Name"
              placeholderTextColor={theme.tabIconDefault}
              value={newContact.name}
              onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
              placeholder="Phone Number"
              placeholderTextColor={theme.tabIconDefault}
              value={newContact.phone}
              onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
              placeholder="Relationship (optional)"
              placeholderTextColor={theme.tabIconDefault}
              value={newContact.relationship}
              onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
            />

            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleAddContact}
            >
              <ThemedText style={styles.modalButtonText}>Add Contact</ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Location Share Modal */}
      <Modal
        visible={showLocationShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationShareModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[Typography.h3, styles.modalTitle]}>
                📍 Share Location
              </ThemedText>
              <Pressable onPress={() => setShowLocationShareModal(false)}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            <ThemedText style={styles.modalDescription}>
              Share your current location{isTrackingRoute ? ' and route' : ''} with your contacts
            </ThemedText>

            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
              placeholder="Trail name (optional)"
              placeholderTextColor={theme.tabIconDefault}
              value={trailName}
              onChangeText={setTrailName}
            />

            <TextInput
              style={[
                styles.messageInput,
                { backgroundColor: theme.backgroundRoot, color: theme.text },
              ]}
              placeholder="Message (optional)"
              placeholderTextColor={theme.tabIconDefault}
              value={locationMessage}
              onChangeText={setLocationMessage}
              multiline
              numberOfLines={4}
            />

            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleShareLocation}
            >
              <Feather name="send" size={20} color="white" />
              <ThemedText style={styles.modalButtonText}>Share Location</ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SOS Message Modal */}
      <Modal
        visible={showSOSModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSOSModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[Typography.h3, styles.modalTitle, { color: theme.error }]}>
                🆘 Emergency SOS
              </ThemedText>
              <Pressable onPress={() => setShowSOSModal(false)}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            <ThemedText style={[styles.modalDescription, { color: theme.error }]}>
              ⚠️ Use only for true emergencies. This sends an urgent alert to all contacts.
            </ThemedText>

            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
              placeholder="Trail name (optional)"
              placeholderTextColor={theme.tabIconDefault}
              value={trailName}
              onChangeText={setTrailName}
            />

            <TextInput
              style={[
                styles.messageInput,
                { backgroundColor: theme.backgroundRoot, color: theme.text },
              ]}
              placeholder="Emergency details (optional)"
              placeholderTextColor={theme.tabIconDefault}
              value={sosMessage}
              onChangeText={setSOSMessage}
              multiline
              numberOfLines={4}
            />

            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.error }]}
              onPress={handleSendSOS}
            >
              <Feather name="alert-triangle" size={20} color="white" />
              <ThemedText style={styles.modalButtonText}>Send Emergency SOS</ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  emergencySection: {
    marginBottom: Spacing["3xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  sosButton: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sosButtonText: {
    color: 'white',
    marginTop: Spacing.md,
  },
  sosButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  locationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing["2xl"],
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  coordinates: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginBottom: Spacing.xs,
  },
  altitude: {
    fontSize: 14,
    opacity: 0.7,
  },
  contactsSection: {
    marginBottom: Spacing["3xl"],
  },
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    fontSize: 14,
  },
  contactCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    marginBottom: Spacing.xs,
  },
  contactPhone: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  contactRelation: {
    fontSize: 12,
    opacity: 0.5,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.xl,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    flex: 1,
  },
  modalDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing.xl,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  messageInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButton: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  trackingButton: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  shareButtonText: {
    color: 'white',
    marginTop: Spacing.md,
  },
  shareButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: Spacing.xs,
  },
});
