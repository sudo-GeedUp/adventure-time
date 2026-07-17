import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ThemedText from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { TrailReviewManager } from '@/utils/trailReviews';
import { storage } from '@/utils/storage';

type RouteParams = {
  TrailReview: {
    trailId: string;
    trailName: string;
  };
};

export default function TrailReviewScreen() {
  const route = useRoute<RouteProp<RouteParams, 'TrailReview'>>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { trailId, trailName } = route.params;

  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Hard' | 'Expert'>('Moderate');
  const [trailCondition, setTrailCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous'>('Good');
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCrowded, setIsCrowded] = useState(false);
  const [weather, setWeather] = useState('');
  const [requiredMods, setRequiredMods] = useState('');
  const [hazards, setHazards] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setPhotos([...photos, ...newPhotos].slice(0, 5));
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri].slice(0, 5));
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Review Required', 'Please write a review');
      return;
    }

    setIsSubmitting(true);

    try {
      const profile = await storage.getUserProfile();
      
      await TrailReviewManager.addReview({
        trailId,
        trailName,
        userId: profile?.id || 'user',
        userName: profile?.name || 'Anonymous',
        rating,
        difficulty,
        vehicleType: profile?.vehicleType || 'Unknown',
        conditions: {
          weather: weather || 'Unknown',
          trailCondition,
          crowded: isCrowded,
        },
        review: reviewText,
        photos: photos.length > 0 ? photos : undefined,
        bestTimeToVisit: bestTime || undefined,
        requiredMods: requiredMods ? requiredMods.split(',').map(m => m.trim()) : undefined,
        hazards: hazards ? hazards.split(',').map(h => h.trim()) : undefined,
      });

      Alert.alert('Review Submitted', 'Thank you for your review!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <Feather
              name="star"
              size={32}
              color={star <= rating ? '#FFD700' : theme.tabIconDefault}
              style={styles.star}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText style={[Typography.h3, styles.title]}>
          Review {trailName}
        </ThemedText>
      </View>

      {/* Rating */}
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Overall Rating
        </ThemedText>
        {renderStars()}
      </View>

      {/* Difficulty */}
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Difficulty Level
        </ThemedText>
        <View style={styles.buttonGroup}>
          {(['Easy', 'Moderate', 'Hard', 'Expert'] as const).map((level) => (
            <Pressable
              key={level}
              style={[
                styles.difficultyButton,
                { 
                  backgroundColor: difficulty === level ? theme.primary : theme.backgroundDefault,
                  borderColor: theme.border,
                }
              ]}
              onPress={() => setDifficulty(level)}
            >
              <ThemedText
                style={[
                  styles.buttonText,
                  { color: difficulty === level ? 'white' : theme.text }
                ]}
              >
                {level}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Trail Condition */}
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Trail Condition
        </ThemedText>
        <View style={styles.buttonGroup}>
          {(['Excellent', 'Good', 'Fair', 'Poor', 'Dangerous'] as const).map((condition) => (
            <Pressable
              key={condition}
              style={[
                styles.conditionButton,
                { 
                  backgroundColor: trailCondition === condition ? theme.accent : theme.backgroundDefault,
                  borderColor: theme.border,
                }
              ]}
              onPress={() => setTrailCondition(condition)}
            >
              <ThemedText
                style={[
                  styles.buttonText,
                  { color: trailCondition === condition ? 'white' : theme.text }
                ]}
              >
                {condition}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Review Text */}
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Your Review
        </ThemedText>
        <TextInput
          style={[styles.reviewInput, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
          placeholder="Share your experience on this trail..."
          placeholderTextColor={theme.tabIconDefault}
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={6}
        />
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Photos (Optional)
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <View style={[styles.photo, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText style={styles.photoText}>Photo {index + 1}</ThemedText>
                </View>
                <Pressable
                  style={styles.removePhoto}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                >
                  <Feather name="x" size={16} color="white" />
                </Pressable>
              </View>
            ))}
            {photos.length < 5 && (
              <>
                <Pressable
                  style={[styles.addPhotoButton, { backgroundColor: theme.backgroundDefault }]}
                  onPress={handleTakePhoto}
                >
                  <Feather name="camera" size={24} color={theme.primary} />
                  <ThemedText style={styles.addPhotoText}>Take Photo</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.addPhotoButton, { backgroundColor: theme.backgroundDefault }]}
                  onPress={handleSelectPhoto}
                >
                  <Feather name="image" size={24} color={theme.primary} />
                  <ThemedText style={styles.addPhotoText}>Choose Photo</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Additional Details */}
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Additional Details (Optional)
        </ThemedText>
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
          placeholder="Weather conditions"
          placeholderTextColor={theme.tabIconDefault}
          value={weather}
          onChangeText={setWeather}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
          placeholder="Required modifications (comma separated)"
          placeholderTextColor={theme.tabIconDefault}
          value={requiredMods}
          onChangeText={setRequiredMods}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
          placeholder="Hazards encountered (comma separated)"
          placeholderTextColor={theme.tabIconDefault}
          value={hazards}
          onChangeText={setHazards}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
          placeholder="Best time to visit (e.g., Spring, Early morning)"
          placeholderTextColor={theme.tabIconDefault}
          value={bestTime}
          onChangeText={setBestTime}
        />

        <View style={styles.crowdedContainer}>
          <ThemedText>Was it crowded?</ThemedText>
          <Pressable
            style={[
              styles.checkbox,
              { 
                backgroundColor: isCrowded ? theme.primary : theme.backgroundDefault,
                borderColor: theme.border,
              }
            ]}
            onPress={() => setIsCrowded(!isCrowded)}
          >
            {isCrowded && <Feather name="check" size={16} color="white" />}
          </Pressable>
        </View>
      </View>

      {/* Submit Button */}
      <Pressable
        style={[
          styles.submitButton,
          { 
            backgroundColor: isSubmitting ? theme.tabIconDefault : theme.primary,
            opacity: isSubmitting ? 0.5 : 1,
          }
        ]}
        onPress={handleSubmitReview}
        disabled={isSubmitting}
      >
        <ThemedText style={styles.submitButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </ThemedText>
      </Pressable>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  star: {
    marginHorizontal: Spacing.xs,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  difficultyButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  conditionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  photosContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    fontSize: 12,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF0000',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  crowdedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
