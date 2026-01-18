import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Trail, getTrailsNearLocation } from '@/utils/trails';
import { calculateDistance } from '@/utils/location';
import { storage } from '@/utils/storage';
import { useNavigation } from '@react-navigation/native';
import { pickSmartRandomAdventure } from '@/utils/adventurePicker';
import { FirebaseLocationService, UserLocation, isFirebaseAvailable } from '@/utils/firebase';

const { width, height } = Dimensions.get('window');

interface NearbyUser {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  vehicleType: string;
  isOnline: boolean;
  lastSeen: number;
}

interface Adventure {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert';
  distance: number;
  type: 'trail' | 'community' | 'custom';
  rating: number;
  features: string[];
}

type FilterType = 'all' | 'trails' | 'users' | 'adventures';
type DifficultyFilter = 'all' | 'Easy' | 'Moderate' | 'Hard' | 'Expert';
type DistanceFilter = 'all' | '5' | '10' | '25' | '50';

export default function ExploreMapScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 38.5729,
    longitude: -109.5898,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const [trails, setTrails] = useState<Trail[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [firebaseUsers, setFirebaseUsers] = useState<UserLocation[]>([]);

  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showRandomModal, setShowRandomModal] = useState(false);

  useEffect(() => {
    initializeLocation();
    loadNearbyData();
    
    // Subscribe to real-time user locations from Firebase
    let unsubscribe: (() => void) | null = null;
    if (isFirebaseAvailable()) {
      unsubscribe = FirebaseLocationService.subscribeToNearbyUsers((users) => {
        setFirebaseUsers(users);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadNearbyData();
    }
  }, [userLocation, distanceFilter]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadNearbyData = async () => {
    const maxDistance = distanceFilter === 'all' ? 50 : parseInt(distanceFilter);
    const coords = userLocation?.coords || { latitude: 38.5729, longitude: -109.5898 };

    // Load trails
    const nearbyTrails = getTrailsNearLocation(coords, maxDistance);
    setTrails(nearbyTrails);

    // Load community adventures
    try {
      const communityAdventures = await storage.getCommunityAdventures();
      const adventuresData: Adventure[] = communityAdventures
        .filter((adv: any) => {
          if (!adv.route || adv.route.length === 0) return false;
          const distance = calculateDistance(coords, adv.route[0]);
          return distance <= maxDistance;
        })
        .map((adv: any) => ({
          id: adv.id,
          name: adv.trailName || adv.title || 'Community Adventure',
          location: adv.route[0],
          difficulty: adv.difficulty || 'Moderate',
          distance: adv.totalDistance || 0,
          type: 'community' as const,
          rating: 4.5,
          features: adv.features || [],
        }));
      setAdventures(adventuresData);
    } catch (error) {
      console.error('Error loading adventures:', error);
    }

    // Use Firebase users if available, otherwise use mock data
    if (isFirebaseAvailable() && firebaseUsers.length > 0) {
      const users: NearbyUser[] = firebaseUsers
        .filter(user => {
          const distance = calculateDistance(coords, user.location);
          return distance <= maxDistance;
        })
        .map(user => ({
          id: user.userId,
          name: user.userName,
          location: user.location,
          vehicleType: user.vehicleType,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
        }));
      setNearbyUsers(users);
    } else {
      // Fallback to mock data for demo purposes
      const mockUsers: NearbyUser[] = [
        {
          id: '1',
          name: 'Trail Rider',
          location: {
            latitude: coords.latitude + 0.02,
            longitude: coords.longitude + 0.02,
          },
          vehicleType: 'Jeep Wrangler',
          isOnline: true,
          lastSeen: Date.now(),
        },
        {
          id: '2',
          name: 'Mountain Explorer',
          location: {
            latitude: coords.latitude - 0.03,
            longitude: coords.longitude + 0.01,
          },
          vehicleType: 'Toyota 4Runner',
          isOnline: true,
          lastSeen: Date.now(),
        },
        {
          id: '3',
          name: 'Desert Wanderer',
          location: {
            latitude: coords.latitude + 0.01,
            longitude: coords.longitude - 0.02,
          },
          vehicleType: 'Ford Bronco',
          isOnline: false,
          lastSeen: Date.now() - 3600000,
        },
      ];
      setNearbyUsers(mockUsers);
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  };

  const handleRandomAdventure = () => {
    const allTrails = [...trails, ...adventures.map(a => ({
      id: a.id,
      name: a.name,
      description: `${a.type} adventure`,
      difficulty: a.difficulty,
      distance: a.distance,
      duration: 0,
      safetyRating: a.rating * 2,
      landType: 'public' as const,
      features: a.features,
      location: a.location,
      elevation: 0,
      vehicleTypes: ['All'],
      popularity: 5,
    }))];

    if (allTrails.length === 0) {
      Alert.alert('No Adventures Available', 'Please wait while we load nearby adventures.');
      return;
    }

    const result = pickSmartRandomAdventure(allTrails, {
      difficulty: difficultyFilter !== 'all' ? difficultyFilter as any : undefined,
    });

    if (result) {
      Alert.alert(
        `${result.emoji} ${result.reason}`,
        `We've picked "${result.trail.name}" for you!\n\nDifficulty: ${result.trail.difficulty}\nDistance: ${result.trail.distance.toFixed(1)} miles\n\nReady to start this adventure?`,
        [
          { text: 'Pick Another', onPress: handleRandomAdventure },
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Adventure',
            onPress: () => {
              navigation.navigate('ActiveAdventure', { trail: result.trail });
            },
          },
        ]
      );
    }
  };

  const getFilteredTrails = () => {
    let filtered = trails;

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(t => t.difficulty === difficultyFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.features.some(f => f.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getFilteredAdventures = () => {
    let filtered = adventures;

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(a => a.difficulty === difficultyFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.features.some(f => f.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getFilteredUsers = () => {
    let filtered = nearbyUsers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.vehicleType.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const renderMarkers = () => {
    const markers: React.ReactElement[] = [];
    const filteredTrails = getFilteredTrails();
    const filteredAdventures = getFilteredAdventures();
    const filteredUsers = getFilteredUsers();

    // Render trail markers
    if (filterType === 'all' || filterType === 'trails') {
      filteredTrails.forEach(trail => {
        markers.push(
          <Marker
            key={`trail-${trail.id}`}
            coordinate={trail.location}
            onPress={() => setSelectedItem({ type: 'trail', data: trail })}
          >
            <View style={[styles.markerContainer, { backgroundColor: theme.primary }]}>
              <Feather name="map-pin" size={20} color="white" />
            </View>
          </Marker>
        );
      });
    }

    // Render adventure markers
    if (filterType === 'all' || filterType === 'adventures') {
      filteredAdventures.forEach(adventure => {
        markers.push(
          <Marker
            key={`adventure-${adventure.id}`}
            coordinate={adventure.location}
            onPress={() => setSelectedItem({ type: 'adventure', data: adventure })}
          >
            <View style={[styles.markerContainer, { backgroundColor: theme.accent }]}>
              <Feather name="compass" size={20} color="white" />
            </View>
          </Marker>
        );
      });
    }

    // Render user markers
    if (filterType === 'all' || filterType === 'users') {
      filteredUsers.forEach(user => {
        markers.push(
          <Marker
            key={`user-${user.id}`}
            coordinate={user.location}
            onPress={() => setSelectedItem({ type: 'user', data: user })}
          >
            <View
              style={[
                styles.markerContainer,
                { backgroundColor: user.isOnline ? theme.success : theme.tabIconDefault },
              ]}
            >
              <Feather name="user" size={20} color="white" />
            </View>
          </Marker>
        );
      });
    }

    return markers;
  };

  const renderSelectedItemCard = () => {
    if (!selectedItem) return null;

    const { type, data } = selectedItem;

    return (
      <View style={[styles.selectedCard, { backgroundColor: theme.backgroundDefault }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => setSelectedItem(null)}
        >
          <Feather name="x" size={20} color={theme.tabIconDefault} />
        </Pressable>

        {type === 'trail' && (
          <>
            <View style={styles.cardHeader}>
              <Feather name="map-pin" size={24} color={theme.primary} />
              <ThemedText style={[Typography.h4, { marginLeft: Spacing.sm }]}>
                {data.name}
              </ThemedText>
            </View>
            <ThemedText style={[styles.cardDescription, { color: theme.tabIconDefault }]}>
              {data.description}
            </ThemedText>
            <View style={styles.cardStats}>
              <View style={styles.cardStat}>
                <Feather name="navigation" size={16} color={theme.primary} />
                <ThemedText style={styles.cardStatText}>{data.distance.toFixed(1)} mi</ThemedText>
              </View>
              <View style={styles.cardStat}>
                <Feather name="activity" size={16} color={theme.primary} />
                <ThemedText style={styles.cardStatText}>{data.difficulty}</ThemedText>
              </View>
              <View style={styles.cardStat}>
                <Feather name="star" size={16} color={theme.primary} />
                <ThemedText style={styles.cardStatText}>{data.safetyRating}/10</ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.cardButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                setSelectedItem(null);
                navigation.navigate('ActiveAdventure', { trail: data });
              }}
            >
              <Feather name="play" size={18} color="white" />
              <ThemedText style={styles.cardButtonText}>Start Adventure</ThemedText>
            </Pressable>
          </>
        )}

        {type === 'adventure' && (
          <>
            <View style={styles.cardHeader}>
              <Feather name="compass" size={24} color={theme.accent} />
              <ThemedText style={[Typography.h4, { marginLeft: Spacing.sm }]}>
                {data.name}
              </ThemedText>
            </View>
            <View style={styles.cardStats}>
              <View style={styles.cardStat}>
                <Feather name="navigation" size={16} color={theme.accent} />
                <ThemedText style={styles.cardStatText}>{data.distance.toFixed(1)} mi</ThemedText>
              </View>
              <View style={styles.cardStat}>
                <Feather name="activity" size={16} color={theme.accent} />
                <ThemedText style={styles.cardStatText}>{data.difficulty}</ThemedText>
              </View>
              <View style={styles.cardStat}>
                <Feather name="star" size={16} color={theme.accent} />
                <ThemedText style={styles.cardStatText}>{data.rating}/5</ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.cardButton, { backgroundColor: theme.accent }]}
              onPress={() => {
                setSelectedItem(null);
                // Navigate to adventure details
              }}
            >
              <Feather name="eye" size={18} color="white" />
              <ThemedText style={styles.cardButtonText}>View Details</ThemedText>
            </Pressable>
          </>
        )}

        {type === 'user' && (
          <>
            <View style={styles.cardHeader}>
              <Feather name="user" size={24} color={theme.success} />
              <ThemedText style={[Typography.h4, { marginLeft: Spacing.sm }]}>
                {data.name}
              </ThemedText>
              {data.isOnline && (
                <View style={[styles.onlineBadge, { backgroundColor: theme.success }]}>
                  <ThemedText style={styles.onlineBadgeText}>Online</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.cardStats}>
              <View style={styles.cardStat}>
                <Feather name="truck" size={16} color={theme.success} />
                <ThemedText style={styles.cardStatText}>{data.vehicleType}</ThemedText>
              </View>
              <View style={styles.cardStat}>
                <Feather name="clock" size={16} color={theme.success} />
                <ThemedText style={styles.cardStatText}>
                  {data.isOnline ? 'Now' : 'Offline'}
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.cardButton, { backgroundColor: theme.success }]}
              onPress={() => {
                setSelectedItem(null);
                // Navigate to user profile or chat
              }}
            >
              <Feather name="message-circle" size={18} color="white" />
              <ThemedText style={styles.cardButtonText}>Send Message</ThemedText>
            </Pressable>
          </>
        )}
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={Typography.h3}>Filters</ThemedText>
            <Pressable onPress={() => setShowFilters(false)}>
              <Feather name="x" size={24} color={theme.tabIconDefault} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Show Type Filter */}
            <View style={styles.filterSection}>
              <ThemedText style={[Typography.h4, styles.filterTitle]}>Show</ThemedText>
              <View style={styles.filterButtons}>
                {(['all', 'trails', 'adventures', 'users'] as FilterType[]).map(type => (
                  <Pressable
                    key={type}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          filterType === type ? theme.primary : theme.backgroundSecondary,
                      },
                    ]}
                    onPress={() => setFilterType(type)}
                  >
                    <ThemedText
                      style={[
                        styles.filterButtonText,
                        { color: filterType === type ? 'white' : theme.tabIconDefault },
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Difficulty Filter */}
            <View style={styles.filterSection}>
              <ThemedText style={[Typography.h4, styles.filterTitle]}>Difficulty</ThemedText>
              <View style={styles.filterButtons}>
                {(['all', 'Easy', 'Moderate', 'Hard', 'Expert'] as DifficultyFilter[]).map(
                  difficulty => (
                    <Pressable
                      key={difficulty}
                      style={[
                        styles.filterButton,
                        {
                          backgroundColor:
                            difficultyFilter === difficulty
                              ? theme.primary
                              : theme.backgroundSecondary,
                        },
                      ]}
                      onPress={() => setDifficultyFilter(difficulty)}
                    >
                      <ThemedText
                        style={[
                          styles.filterButtonText,
                          {
                            color:
                              difficultyFilter === difficulty ? 'white' : theme.tabIconDefault,
                          },
                        ]}
                      >
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </ThemedText>
                    </Pressable>
                  )
                )}
              </View>
            </View>

            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <ThemedText style={[Typography.h4, styles.filterTitle]}>
                Max Distance (miles)
              </ThemedText>
              <View style={styles.filterButtons}>
                {(['all', '5', '10', '25', '50'] as DistanceFilter[]).map(distance => (
                  <Pressable
                    key={distance}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          distanceFilter === distance ? theme.primary : theme.backgroundSecondary,
                      },
                    ]}
                    onPress={() => setDistanceFilter(distance)}
                  >
                    <ThemedText
                      style={[
                        styles.filterButtonText,
                        { color: distanceFilter === distance ? 'white' : theme.tabIconDefault },
                      ]}
                    >
                      {distance === 'all' ? 'All' : `${distance} mi`}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Apply Button */}
            <Pressable
              style={[styles.applyButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowFilters(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const getResultCount = () => {
    const trailCount = filterType === 'all' || filterType === 'trails' ? getFilteredTrails().length : 0;
    const adventureCount = filterType === 'all' || filterType === 'adventures' ? getFilteredAdventures().length : 0;
    const userCount = filterType === 'all' || filterType === 'users' ? getFilteredUsers().length : 0;
    return trailCount + adventureCount + userCount;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {renderMarkers()}
      </MapView>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { top: insets.top + Spacing.md, backgroundColor: theme.backgroundDefault },
        ]}
      >
        <Feather name="search" size={20} color={theme.tabIconDefault} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search adventures, trails, users..."
          placeholderTextColor={theme.tabIconDefault}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color={theme.tabIconDefault} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Button */}
      <Pressable
        style={[
          styles.filterFloatingButton,
          { top: insets.top + Spacing.md, backgroundColor: theme.primary },
        ]}
        onPress={() => setShowFilters(true)}
      >
        <Feather name="sliders" size={20} color="white" />
        {(filterType !== 'all' || difficultyFilter !== 'all' || distanceFilter !== 'all') && (
          <View style={styles.filterBadge} />
        )}
      </Pressable>

      {/* You Pick Random Adventure Button */}
      <Pressable
        style={[
          styles.randomPickButton,
          { top: insets.top + Spacing.md + 60, backgroundColor: theme.accent },
        ]}
        onPress={handleRandomAdventure}
      >
        <Feather name="shuffle" size={20} color="white" />
      </Pressable>

      {/* Center on User Button */}
      <Pressable
        style={[
          styles.centerButton,
          { bottom: insets.bottom + Spacing.xl + 80, backgroundColor: theme.backgroundDefault },
        ]}
        onPress={centerOnUser}
      >
        <Feather name="navigation" size={24} color={theme.primary} />
      </Pressable>

      {/* Results Count */}
      <View
        style={[
          styles.resultsContainer,
          { bottom: insets.bottom + Spacing.xl + 20, backgroundColor: theme.backgroundDefault },
        ]}
      >
        <Feather name="map-pin" size={16} color={theme.primary} />
        <ThemedText style={styles.resultsText}>
          {getResultCount()} nearby {filterType === 'all' ? 'results' : filterType}
        </ThemedText>
      </View>

      {/* Selected Item Card */}
      {renderSelectedItemCard()}

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.xs,
  },
  filterFloatingButton: {
    position: 'absolute',
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
  },
  randomPickButton: {
    position: 'absolute',
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButton: {
    position: 'absolute',
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resultsContainer: {
    position: 'absolute',
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedCard: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardStatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  cardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  onlineBadge: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  onlineBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterTitle: {
    marginBottom: Spacing.md,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
