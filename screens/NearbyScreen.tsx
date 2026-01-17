import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, Alert, Platform, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage, NearbyOffroader as StoredOffroader, UserProfile } from "@/utils/storage";
import { calculateDistance } from "@/utils/location";
import { getWeather } from "@/utils/weather";
import { analyzeTrailConditions, calculateImpactAssessment } from "@/utils/conditions";
import type { WeatherCondition, ImpactAssessment, TrailConditionSummary } from "@/utils/conditions";
import ReportConditionModal from "@/components/ReportConditionModal";
import { getTrailsNearLocation, Trail } from "@/utils/trails";

let MapView: any = null;
let Marker: any = null;
let mapsLoadError: string | null = null;

if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    console.log("Maps loaded successfully:", !!MapView);
  } catch (e: any) {
    mapsLoadError = e?.message || "Unknown error loading maps";
    console.log("Maps load error:", mapsLoadError);
  }
} else {
  console.log("Maps not available on web platform");
}

interface NearbyOffroader extends StoredOffroader {
  distance: number;
}

const MAP_RADIUS = 10;

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}

const mapsAvailable = MapView !== null;

export default function NearbyScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const [location, setLocation] = useState<any>(null);
  const [offroaders, setOffroaders] = useState<NearbyOffroader[]>([]);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [impact, setImpact] = useState<ImpactAssessment | null>(null);
  const [trailConditions, setTrailConditions] = useState<TrailConditionSummary | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nearbyTrails, setNearbyTrails] = useState<Trail[]>([]);
  const [communityTrails, setCommunityTrails] = useState<Trail[]>([]);
  const [allTrails, setAllTrails] = useState<Trail[]>([]);
  const [showTrailsMap, setShowTrailsMap] = useState(true);
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

  useEffect(() => {
    requestLocationPermission();
    loadUserProfile();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Permission Required",
        "Location access is needed to find nearby offroaders who can assist you."
      );
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);
    await loadNearbyOffroaders(currentLocation);
    await loadConditions(currentLocation);
    await loadNearbyTrails(currentLocation);
  };

  const loadNearbyOffroaders = async (currentLocation: any) => {
    try {
      await storage.removeOldOffroaders(30);
      
      let stored = await storage.getNearbyOffroaders();

      const withDistances: NearbyOffroader[] = stored.map((offroader) => ({
        ...offroader,
        distance: calculateDistance(currentLocation.coords, offroader.location),
      }));

      withDistances.sort((a, b) => a.distance - b.distance);

      setOffroaders(withDistances);
    } catch (error) {
      console.error("Error loading nearby offroaders:", error);
    }
  };

  const loadConditions = async (currentLocation: any) => {
    setIsLoadingWeather(true);
    setWeatherError(false);
    
    try {
      const weatherData = await getWeather(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      setWeather(weatherData);
      
      if (!weatherData) {
        setWeatherError(true);
      }

      const allTips = await storage.getCommunityTips();
      const analyzedConditions = analyzeTrailConditions(
        allTips,
        currentLocation.coords,
        MAP_RADIUS
      );
      setTrailConditions(analyzedConditions);

      const impactAssessment = calculateImpactAssessment(weatherData, analyzedConditions);
      setImpact(impactAssessment);
    } catch (error) {
      console.error("Error loading conditions:", error);
      setWeatherError(true);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await storage.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadNearbyTrails = async (currentLocation: any) => {
    try {
      // Get all popular 4x4 trails within 200 miles
      const popularTrails = getTrailsNearLocation(currentLocation.coords, 200);
      const adventures = await storage.getCommunityAdventures();
      
      // Convert community adventures to Trail format
      const communityTrailsData: Trail[] = adventures.map((adv: any) => ({
        id: `community_${adv.id}`,
        name: adv.trailName || adv.title || "Community Trail",
        description: `User-logged trail by ${adv.userName || "Anonymous"}`,
        difficulty: adv.difficulty || "Moderate",
        distance: adv.totalDistance || 0,
        duration: Math.round((adv.endTime - adv.startTime) / 1000 / 60) || 60,
        safetyRating: 7,
        landType: "public" as const,
        features: ["Community Trail", "User Logged"],
        location: adv.route[0] || { latitude: 0, longitude: 0 },
        elevation: adv.maxAltitude || 0,
        vehicleTypes: [adv.vehicleType || "All"],
        popularity: 5,
      }));

      // Combine all trails
      const combinedTrails = [...popularTrails, ...communityTrailsData];
      
      // Calculate distance from user for each trail
      const trailsWithDistance = combinedTrails.map(trail => ({
        ...trail,
        distanceFromUser: calculateDistance(currentLocation.coords, trail.location)
      }));
      
      // Sort by distance
      const sortedTrails = trailsWithDistance.sort((a, b) => a.distanceFromUser - b.distanceFromUser);
      
      setAllTrails(sortedTrails);
      setNearbyTrails(sortedTrails.slice(0, 10)); // Top 10 nearest
      setCommunityTrails(communityTrailsData);
    } catch (error) {
      console.error("Error loading nearby trails:", error);
    }
  };

  const handleRefresh = () => {
    requestLocationPermission();
  };

  const openGPSNavigation = (trail: any) => {
    const { latitude, longitude } = trail.location;
    const label = encodeURIComponent(trail.name);
    
    if (Platform.OS === "ios") {
      const url = `maps://app?daddr=${latitude},${longitude}&q=${label}`;
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "Unable to open Maps. Please ensure Apple Maps is installed.");
      });
    } else {
      const url = `google.navigation:q=${latitude},${longitude}&label=${label}`;
      Linking.openURL(url).catch(() => {
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(webUrl);
      });
    }
  };

  const handleReportSubmitted = async () => {
    if (location) {
      await loadConditions(location);
    }
  };

  const handleOffroaderPress = (offroader: NearbyOffroader) => {
    navigation.navigate("Chat", {
      participantId: offroader.id,
      participantName: offroader.name,
      participantVehicle: offroader.vehicleType,
    });
  };

  const renderOffroader = ({ item }: { item: NearbyOffroader }) => (
    <Pressable
      style={[styles.offroaderCard, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => handleOffroaderPress(item)}
      android_ripple={{ color: theme.backgroundSecondary }}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Feather name="user" size={28} color={theme.buttonText} />
      </View>
      <View style={styles.offroaderInfo}>
        <ThemedText style={[Typography.h4, styles.offroaderName]}>{item.name}</ThemedText>
        <ThemedText style={[styles.vehicleType, { color: theme.tabIconDefault }]}>
          {item.vehicleType}
        </ThemedText>
        <View style={styles.distanceRow}>
          <Feather name="navigation" size={16} color={theme.accent} />
          <ThemedText style={[styles.distance, { color: theme.accent }]}>
            {item.distance.toFixed(1)} miles away
          </ThemedText>
        </View>
      </View>
      <Feather name="chevron-right" size={24} color={theme.tabIconDefault} />
    </Pressable>
  );

  const renderMapHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Feather name="map-pin" size={24} color={theme.success} />
          <ThemedText style={[Typography.h3, styles.headerTitle]}>
            {location ? "Location Active" : "Getting Location..."}
          </ThemedText>
        </View>
        <View style={styles.headerButtons}>
          <Pressable onPress={() => setShowReportModal(true)} style={styles.reportButton}>
            <Feather name="alert-triangle" size={24} color={theme.warning} />
          </Pressable>
          <Pressable onPress={handleRefresh} style={styles.refreshButton}>
            <Feather name="refresh-cw" size={24} color={theme.primary} />
          </Pressable>
        </View>
      </View>

      {mapsAvailable && location ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 1.0,
              longitudeDelta: 1.0,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {/* Trail markers */}
            {allTrails.slice(0, 20).map((trail: any) => (
              <Marker
                key={trail.id}
                coordinate={trail.location}
                title={trail.name}
                description={`${trail.difficulty} • ${trail.distance.toFixed(1)} mi`}
                pinColor={trail.id.startsWith('community_') ? "#10b981" : "#3b82f6"}
                onPress={() => setSelectedTrail(trail)}
              />
            ))}
            {/* Offroader markers */}
            {offroaders.map((offroader) => (
              <Marker
                key={`offroader_${offroader.id}`}
                coordinate={offroader.location}
                title={offroader.name}
                description={offroader.vehicleType}
                pinColor="#ef4444"
              />
            ))}
          </MapView>
          <View style={[styles.mapLegend, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
              <ThemedText style={styles.legendText}>Popular Trails</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
              <ThemedText style={styles.legendText}>Community Trails</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
              <ThemedText style={styles.legendText}>Offroaders</ThemedText>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.mapPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="map" size={64} color={theme.tabIconDefault} style={styles.mapIcon} />
          <ThemedText style={[styles.mapText, { color: theme.tabIconDefault }]}>
            {Platform.OS === "web" 
              ? "Map available in Expo Go app" 
              : mapsLoadError 
                ? `Map error: ${mapsLoadError}`
                : !mapsAvailable
                  ? "Map requires Expo Go on device"
                  : location 
                    ? "Loading map..." 
                    : "Getting location..."}
          </ThemedText>
        </View>
      )}

      {isLoadingWeather ? (
        <View style={[
          styles.conditionsCard,
          { backgroundColor: theme.backgroundDefault, borderLeftColor: theme.tabIconDefault }
        ]}>
          <View style={styles.loadingContainer}>
            <Feather name="loader" size={24} color={theme.tabIconDefault} />
            <ThemedText style={[styles.loadingText, { color: theme.tabIconDefault }]}>
              Loading trail conditions and weather...
            </ThemedText>
          </View>
        </View>
      ) : (weather || (trailConditions && trailConditions.recentTips.length > 0)) && impact ? (
        <View style={[
          styles.conditionsCard,
          { backgroundColor: theme.backgroundDefault, borderLeftColor: impact.color }
        ]}>
          <View style={styles.conditionsHeader}>
            <Feather 
              name="alert-circle" 
              size={24} 
              color={impact.color}
            />
            <ThemedText style={[Typography.h4, { marginLeft: Spacing.sm }]}>
              Current Conditions
            </ThemedText>
          </View>

          {weather ? (
            <View style={styles.weatherRow}>
              <Feather name="cloud" size={18} color={theme.tabIconDefault} />
              <ThemedText style={styles.weatherText}>
                {weather.condition} • {Math.round(weather.temperature)}°F • Wind {weather.windSpeed} mph
              </ThemedText>
            </View>
          ) : weatherError ? (
            <View style={styles.weatherRow}>
              <Feather name="cloud-off" size={18} color={theme.warning} />
              <ThemedText style={[styles.weatherText, { color: theme.warning }]}>
                Weather data unavailable
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.severityBadge}>
            <ThemedText style={[styles.severityText, { color: impact.color }]}>
              {impact.overallSeverity.toUpperCase()} RISK
            </ThemedText>
          </View>

          {trailConditions && trailConditions.recentTips.length > 0 ? (
            <View style={styles.trailTipsSection}>
              <ThemedText style={styles.sectionTitle}>
                Recent Trail Reports ({trailConditions.recentTips.length}):
              </ThemedText>
              {trailConditions.recentTips.slice(0, 3).map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Feather name="message-circle" size={14} color={theme.primary} />
                  <ThemedText style={styles.tipText} numberOfLines={2}>
                    {tip.title} - {getTimeAgo(tip.timestamp)}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          {impact.riskFactors.length > 0 ? (
            <View style={styles.riskSection}>
              <ThemedText style={styles.sectionTitle}>Risk Factors:</ThemedText>
              {impact.riskFactors.map((factor, index) => (
                <View key={index} style={styles.riskItem}>
                  <Feather name="alert-triangle" size={14} color={theme.warning} />
                  <ThemedText style={styles.riskText}>{factor}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          {impact.recommendations.length > 0 ? (
            <View style={styles.recommendSection}>
              <ThemedText style={styles.sectionTitle}>Recommendations:</ThemedText>
              {impact.recommendations.slice(0, 2).map((rec, index) => (
                <View key={index} style={styles.recItem}>
                  <Feather name="check-circle" size={14} color={theme.success} />
                  <ThemedText style={styles.recText}>{rec}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : !isLoadingWeather && !weather && (!trailConditions || trailConditions.recentTips.length === 0) ? (
        <View style={[
          styles.conditionsCard,
          { backgroundColor: theme.backgroundDefault, borderLeftColor: theme.tabIconDefault }
        ]}>
          <ThemedText style={styles.noDataText}>
            No recent trail conditions or weather data available. Share a tip to help others!
          </ThemedText>
        </View>
      ) : null}

      {nearbyTrails.length > 0 && (
        <View style={styles.trailsSection}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText style={[Typography.h4, styles.sectionHeaderTitle]}>
              Local & Nearby Trails ({allTrails.length})
            </ThemedText>
            <ThemedText style={[styles.trailCount, { color: theme.tabIconDefault }]}>
              {communityTrails.length} community
            </ThemedText>
          </View>
          <ThemedText style={[styles.trailsDescription, { color: theme.tabIconDefault }]}>
            Popular 4x4 trails and user-logged routes. Tap "Take Me There" for GPS navigation.
          </ThemedText>
          {nearbyTrails.map((trail: any) => (
            <View
              key={trail.id}
              style={[styles.trailCard, { backgroundColor: theme.backgroundDefault }]}
            >
              <View style={styles.trailCardHeader}>
                <View style={styles.trailCardContent}>
                  <View style={styles.trailNameRow}>
                    <ThemedText style={[Typography.h4, styles.trailName]}>
                      {trail.name}
                    </ThemedText>
                    {trail.id.startsWith('community_') && (
                      <View style={[styles.communityBadge, { backgroundColor: theme.success + "20" }]}>
                        <ThemedText style={[styles.communityBadgeText, { color: theme.success }]}>
                          Community
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={[styles.trailDescription, { color: theme.tabIconDefault }]} numberOfLines={1}>
                    {trail.description}
                  </ThemedText>
                  <View style={styles.trailMetaRow}>
                    <View style={styles.trailMetaItem}>
                      <Feather name="navigation" size={14} color={theme.accent} />
                      <ThemedText style={[styles.trailMetaText, { color: theme.accent }]}>
                        {trail.distanceFromUser.toFixed(1)} mi away
                      </ThemedText>
                    </View>
                    <View style={styles.trailMetaItem}>
                      <Feather name="trending-up" size={14} color={theme.tabIconDefault} />
                      <ThemedText style={[styles.trailMetaText, { color: theme.tabIconDefault }]}>
                        {trail.difficulty}
                      </ThemedText>
                    </View>
                    <View style={styles.trailMetaItem}>
                      <Feather name="map" size={14} color={theme.tabIconDefault} />
                      <ThemedText style={[styles.trailMetaText, { color: theme.tabIconDefault }]}>
                        {trail.distance.toFixed(1)} mi
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.trailCardActions}>
                <Pressable
                  style={[styles.takeMeThereButton, { backgroundColor: theme.primary }]}
                  onPress={() => openGPSNavigation(trail)}
                  android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                >
                  <Feather name="navigation" size={18} color="white" />
                  <ThemedText style={styles.takeMeThereText}>
                    Take Me There
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.startButton, { backgroundColor: theme.accent }]}
                  onPress={() => navigation.navigate("NavigateTab", { screen: "ActiveAdventure", params: { trail } })}
                  android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                >
                  <Feather name="play" size={18} color="white" />
                  <ThemedText style={styles.startButtonText}>
                    Start
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ))}
          {allTrails.length > 10 && (
            <Pressable
              style={[styles.viewAllButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => navigation.navigate("NavigateTab")}
              android_ripple={{ color: theme.backgroundSecondary }}
            >
              <ThemedText style={[styles.viewAllText, { color: theme.primary }]}>
                View All {allTrails.length} Trails
              </ThemedText>
              <Feather name="arrow-right" size={20} color={theme.primary} />
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.listTitleContainer}>
        <ThemedText style={[Typography.h4, styles.listTitle]}>
          Nearby Offroaders ({offroaders.length})
        </ThemedText>
      </View>
    </View>
  );

  return (
    <>
      {offroaders.length > 0 ? (
        <FlatList
          ListHeaderComponent={renderMapHeader}
          data={offroaders}
          renderItem={renderOffroader}
          keyExtractor={(item) => item.id}
          style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
          contentContainerStyle={[
            styles.container,
            { paddingTop, paddingBottom: paddingBottom + Spacing.xl }
          ]}
          scrollIndicatorInsets={{ bottom: paddingBottom }}
        />
      ) : (
        <ScreenScrollView>
          {renderMapHeader()}
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={theme.tabIconDefault} />
            <ThemedText style={[styles.emptyText, { color: theme.tabIconDefault }]}>
              No offroaders nearby at the moment. Recovery guides are available offline.
            </ThemedText>
          </View>
        </ScreenScrollView>
      )}

      <ReportConditionModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        userLocation={location}
        userProfile={userProfile}
        onReportSubmitted={handleReportSubmitted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    marginLeft: Spacing.sm,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reportButton: {
    padding: Spacing.sm,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  mapContainer: {
    height: 300,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
  },
  mapIcon: {
    marginBottom: Spacing.md,
  },
  mapText: {
    textAlign: "center",
    fontSize: 16,
  },
  listSection: {
    flex: 1,
  },
  listTitleContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  listTitle: {
    marginBottom: Spacing.lg,
  },
  offroaderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  offroaderInfo: {
    flex: 1,
  },
  offroaderName: {
    marginBottom: Spacing.xs,
  },
  vehicleType: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  distance: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  conditionsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
  },
  conditionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  weatherText: {
    fontSize: 14,
    opacity: 0.8,
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.sm,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "700",
  },
  riskSection: {
    marginTop: Spacing.md,
  },
  recommendSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  riskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  riskText: {
    fontSize: 14,
    flex: 1,
  },
  recItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  recText: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  trailTipsSection: {
    marginTop: Spacing.md,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  noDataText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  trailsSection: {
    marginBottom: Spacing.xl,
  },
  trailsDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  trailCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionHeaderTitle: {
    flex: 1,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  trailCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  trailCardHeader: {
    marginBottom: Spacing.md,
  },
  trailCardContent: {
    flex: 1,
  },
  trailNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  trailName: {
    flex: 1,
  },
  trailDescription: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  communityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  communityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  trailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  trailMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  trailMetaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trailCardActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  takeMeThereButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  takeMeThereText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  startButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: "600",
  },
  mapLegend: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
