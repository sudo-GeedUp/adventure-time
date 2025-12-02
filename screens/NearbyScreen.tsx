import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage, NearbyOffroader as StoredOffroader, UserProfile } from "@/utils/storage";
import { calculateDistance } from "@/utils/location";
import { getWeather } from "@/utils/weather";
import { analyzeTrailConditions, calculateImpactAssessment } from "@/utils/conditions";
import type { WeatherCondition, ImpactAssessment, TrailConditionSummary } from "@/utils/conditions";
import ReportConditionModal from "@/components/ReportConditionModal";

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
  } catch (e) {
    // Maps not available
  }
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
  const [location, setLocation] = useState<any>(null);
  const [offroaders, setOffroaders] = useState<NearbyOffroader[]>([]);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [impact, setImpact] = useState<ImpactAssessment | null>(null);
  const [trailConditions, setTrailConditions] = useState<TrailConditionSummary | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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

  const handleRefresh = () => {
    requestLocationPermission();
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
            {item.distance} miles away
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
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {offroaders.map((offroader) => (
              <Marker
                key={offroader.id}
                coordinate={offroader.location}
                title={offroader.name}
                description={offroader.vehicleType}
              />
            ))}
          </MapView>
        </View>
      ) : (
        <View style={[styles.mapPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="map" size={64} color={theme.tabIconDefault} style={styles.mapIcon} />
          <ThemedText style={[styles.mapText, { color: theme.tabIconDefault }]}>
            {Platform.OS === "web" 
              ? "Map available in Expo Go app" 
              : location ? "Loading map..." : "Getting location..."}
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

      <View style={styles.listTitle}>
        <ThemedText style={[Typography.h4, styles.listTitleText]}>
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
          contentContainerStyle={[styles.container, { paddingBottom: Spacing.xxxl }]}
          scrollIndicatorInsets={{ bottom: Spacing.xxl }}
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
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.xl,
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
});
