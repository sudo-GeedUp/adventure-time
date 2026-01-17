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
  const [sosMessage, setSOSMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [trailName, setTrailName] = useState('');
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  useEffect(() => {
    loadEmergencyContacts();
    getCurrentLocation();
  }, []);

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

  const handleShareLocation = async () => {
    await EmergencySOS.shareLiveLocation();
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
      {/* Emergency Actions */}
      <View style={styles.emergencySection}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>
          Emergency Actions
        </ThemedText>
        
        <Pressable
          style={[styles.sosButton, { backgroundColor: theme.error }]}
          onPress={() => setShowSOSModal(true)}
        >
          <Feather name="alert-triangle" size={32} color="white" />
          <ThemedText style={[Typography.h2, styles.sosButtonText]}>
            Send SOS Alert
          </ThemedText>
          <ThemedText style={styles.sosButtonSubtext}>
            Alert all emergency contacts
          </ThemedText>
        </Pressable>

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
            onPress={handleShareLocation}
          >
            <Feather name="map-pin" size={24} color={theme.primary} />
            <ThemedText style={styles.quickActionText}>Share Location</ThemedText>
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
                🆘 Send Emergency Alert
              </ThemedText>
              <Pressable onPress={() => setShowSOSModal(false)}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            <ThemedText style={styles.modalDescription}>
              This will send your location and message to all emergency contacts
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
              placeholder="Emergency message (optional)"
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
              <ThemedText style={styles.modalButtonText}>Send SOS Alert</ThemedText>
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
});
