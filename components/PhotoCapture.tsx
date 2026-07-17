import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface PhotoCaptureProps {
  onPhotoSelected: (uri: string) => void;
  maxPhotos?: number;
  photos?: string[];
}

export default function PhotoCapture({ onPhotoSelected, maxPhotos = 5, photos = [] }: PhotoCaptureProps) {
  const { theme } = useTheme();
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>(photos);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to add photos.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (selectedPhotos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only add up to ${maxPhotos} photos.`);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedPhotos([...selectedPhotos, uri]);
        onPhotoSelected(uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickPhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (selectedPhotos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only add up to ${maxPhotos} photos.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedPhotos([...selectedPhotos, uri]);
        onPhotoSelected(uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(newPhotos);
  };

  return (
    <View style={styles.container}>
      {/* Photo Grid */}
      {selectedPhotos.length > 0 && (
        <View style={styles.photoGrid}>
          {selectedPhotos.map((uri, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri }} style={styles.photo} />
              <Pressable
                style={[styles.removeButton, { backgroundColor: theme.error }]}
                onPress={() => removePhoto(index)}
              >
                <Feather name="x" size={16} color="white" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      {selectedPhotos.length < maxPhotos && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={takePhoto}
          >
            <Feather name="camera" size={20} color="white" />
            <ThemedText style={styles.actionButtonText}>Take Photo</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={pickPhoto}
          >
            <Feather name="image" size={20} color="white" />
            <ThemedText style={styles.actionButtonText}>Choose Photo</ThemedText>
          </Pressable>
        </View>
      )}

      {selectedPhotos.length > 0 && (
        <ThemedText style={[styles.photoCount, { color: theme.tabIconDefault }]}>
          {selectedPhotos.length} / {maxPhotos} photos
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  photoCount: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
