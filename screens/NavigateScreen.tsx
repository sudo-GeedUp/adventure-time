import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { TrailCardSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import ExploreMapScreen from "./ExploreMapScreen";
import {
  getTrailsNearLocation,
  filterTrailsByDifficulty,
  filterTrailsByLandType,
  Trail,
} from "@/utils/trails";
import { calculateDistance } from "@/utils/location";
import { OfflineMapsManager } from "@/utils/offlineMaps";
import { storage } from "@/utils/storage";
import type { CompletedAdventure } from "@/utils/storage";
import { aggregateTrailCommunityData } from "@/utils/communityTrailInsights";
import {
  isFirebaseAvailable,
  CommunityAdventuresService,
} from "@/utils/firebase";

type DifficultyFilter = "All" | "Easy" | "Moderate" | "Hard" | "Expert";
type LandTypeFilter = "All" | "Public" | "Private";

export default function NavigateScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [location, setLocation] = useState<any>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [filteredTrails, setFilteredTrails] = useState<Trail[]>([]);
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("All");
  const [landTypeFilter, setLandTypeFilter] = useState<LandTypeFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingTrails, setDownloadingTrails] = useState<Set<string>>(
    new Set(),
  );
  const [cachedTrails, setCachedTrails] = useState<Set<string>>(new Set());
  const [communityTrails, setCommunityTrails] = useState<Trail[]>([]);
  const [communityAdventures, setCommunityAdventures] = useState<
    CompletedAdventure[]
  >([]);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        return;
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }

    // Fallback: Use default location (Moab, Utah area where all trails are)
    const defaultLocation = {
      coords: {
        latitude: 38.5729,
        longitude: -109.5898,
        altitude: null,
        accuracy: 0,
        altitudeAccuracy: null,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    };
    setLocation(defaultLocation);
  }, []);

  const updateCommunityTrailsData = useCallback(
    (adventures: CompletedAdventure[]) => {
      setCommunityAdventures(adventures);
      if (!adventures || adventures.length === 0) {
        console.log("No community trails found");
        setCommunityTrails([]);
        return;
      }
      const communityTrailsData: Trail[] = adventures
        .filter((adv) => adv.route && adv.route.length > 0)
        .map((adv) => ({
          id: adv.id,
          name: adv.trailName || adv.title || "Community Trail",
          description: `Community trail by ${adv.userName || "Unknown"}`,
          difficulty: adv.difficulty || "Moderate",
          distance: adv.totalDistance || 0,
          duration:
            adv.endTime && adv.startTime
              ? Math.round((adv.endTime - adv.startTime) / 1000 / 60)
              : 0,
          safetyRating: 7,
          landType: "public" as const,
          features: [],
          location: adv.route[0] || { latitude: 0, longitude: 0 },
          elevation: adv.maxAltitude || 0,
          vehicleTypes: [adv.vehicleType || "All"],
          popularity: 5,
        }));
      setCommunityTrails(communityTrailsData);
      console.log("Loaded", communityTrailsData.length, "community trails");
    },
    [],
  );

  const setupCommunityTrails = useCallback(() => {
    let unsubscribe: (() => void) | null = null;

    const loadAndSubscribe = async () => {
      try {
        const localAdventures = await storage.getCommunityAdventures();

        if (isFirebaseAvailable()) {
          unsubscribe =
            CommunityAdventuresService.subscribeToCommunityAdventures(
              (firebaseAdventures) => {
                const combined = [...localAdventures];
                firebaseAdventures.forEach((adv) => {
                  const idx = combined.findIndex((a) => a.id === adv.id);
                  if (idx >= 0) {
                    combined[idx] = adv;
                  } else {
                    combined.push(adv);
                  }
                });
                updateCommunityTrailsData(combined);
              },
            );
        } else {
          updateCommunityTrailsData(localAdventures);
        }
      } catch (error) {
        console.error("Error loading community trails:", error);
        setCommunityTrails([]);
      }
    };

    loadAndSubscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [updateCommunityTrailsData]);

  const loadNearbyTrails = useCallback(async () => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      let nearbyTrails = getTrailsNearLocation(location.coords, 50);

      // Merge offline cached trails
      try {
        const cachedTrails = await OfflineMapsManager.getTrailsNearLocation(
          location.coords,
          50,
        );
        const trailMap = new Map<string, Trail>();
        nearbyTrails.forEach((t) => trailMap.set(t.id, t));
        cachedTrails.forEach((t) => trailMap.set(t.id, t as Trail));
        nearbyTrails = Array.from(trailMap.values());
      } catch (cacheError) {
        console.error("Error loading cached trails:", cacheError);
      }

      const allTrails = [...nearbyTrails, ...communityTrails];
      const sortedByDistance = allTrails.sort((a, b) => {
        const distA = calculateDistance(location.coords, a.location);
        const distB = calculateDistance(location.coords, b.location);
        return distA - distB;
      });
      setTrails(sortedByDistance);
    } catch (err) {
      console.error("Error loading nearby trails:", err);
      setError("Failed to load trails.");
    } finally {
      setIsLoading(false);
    }
  }, [location, communityTrails]);

  const communityInsightsByTrailId = React.useMemo(() => {
    const trailIds = new Set(
      [...trails, ...communityTrails].map((trail) => trail.id),
    );
    return new Map(
      [...trailIds].map((trailId) => [
        trailId,
        aggregateTrailCommunityData(communityAdventures, trailId),
      ]),
    );
  }, [communityAdventures, communityTrails, trails]);

  const applyFilters = useCallback(() => {
    let filtered = [...trails];

    // Search filter - search by trail name, description, location, and features
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trail) =>
          trail.name.toLowerCase().includes(query) ||
          trail.description.toLowerCase().includes(query) ||
          // Search by location coordinates (for city/region searches)
          `${trail.location.latitude},${trail.location.longitude}`.includes(
            query,
          ) ||
          // Search by features (rock crawling, scenic, etc.)
          trail.features.some((feature) =>
            feature.toLowerCase().includes(query),
          ) ||
          // Search by vehicle types
          trail.vehicleTypes.some((type) => type.toLowerCase().includes(query)),
      );
    }

    // Difficulty filter
    if (difficultyFilter !== "All") {
      filtered = filterTrailsByDifficulty(
        filtered,
        difficultyFilter as "Easy" | "Moderate" | "Hard" | "Expert",
      );
    }

    // Land type filter
    if (landTypeFilter === "Public") {
      filtered = filterTrailsByLandType(filtered, "public");
    } else if (landTypeFilter === "Private") {
      filtered = filterTrailsByLandType(filtered, "private");
    }

    setFilteredTrails(filtered);
  }, [trails, searchQuery, difficultyFilter, landTypeFilter]);

  const loadCachedTrailsStatus = useCallback(async () => {
    const cachedStatus = new Set<string>();
    for (const trail of filteredTrails) {
      const isCached = await OfflineMapsManager.isTrailCached(trail.id);
      if (isCached) {
        cachedStatus.add(trail.id);
      }
    }
    setCachedTrails(cachedStatus);
  }, [filteredTrails]);

  useEffect(() => {
    const unsubscribe = setupCommunityTrails();
    requestLocationPermission();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [setupCommunityTrails, requestLocationPermission]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    if (location) {
      loadNearbyTrails();
    }
  }, [location, communityTrails, loadNearbyTrails]);

  useEffect(() => {
    loadCachedTrailsStatus();
  }, [loadCachedTrailsStatus]);

  const openGPSNavigation = (trail: Trail) => {
    const { latitude, longitude } = trail.location;
    const label = encodeURIComponent(trail.name);

    let url = "";
    if (Platform.OS === "ios") {
      url = `maps://app?daddr=${latitude},${longitude}&q=${label}`;
    } else {
      url = `google.navigation:q=${latitude},${longitude}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        Alert.alert("Error", "Unable to open GPS navigation");
        console.error("Navigation error:", err);
      });
  };

  const downloadTrailForOffline = async (trail: Trail) => {
    setDownloadingTrails((prev) => new Set(prev).add(trail.id));
    try {
      await OfflineMapsManager.cacheTrail(trail);
      setCachedTrails((prev) => new Set(prev).add(trail.id));
      Alert.alert("Success", `"${trail.name}" downloaded for offline use!`);
    } catch {
      Alert.alert("Error", "Failed to download trail for offline use");
    } finally {
      setDownloadingTrails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(trail.id);
        return newSet;
      });
    }
  };

  const renderTrailCard = ({ item }: { item: Trail }) => {
    const distance =
      location && item.location
        ? calculateDistance(location.coords, item.location)
        : 0;
    const communityInsights = communityInsightsByTrailId.get(item.id);

    const getRiskColor = (difficulty: string) => {
      switch (difficulty) {
        case "Easy":
          return theme.success;
        case "Moderate":
          return theme.accent;
        case "Hard":
          return theme.warning;
        case "Expert":
          return "#D32F2F";
        default:
          return theme.tabIconDefault;
      }
    };

    const getLandTypeLabel = (landType: string) => {
      switch (landType) {
        case "public":
          return "🔓 Public";
        case "private":
          return "🔒 Private";
        case "mixed":
          return "🔐 Mixed";
        default:
          return landType;
      }
    };

    return (
      <Pressable
        style={[styles.trailCard, { backgroundColor: theme.backgroundDefault }]}
        android_ripple={{ color: theme.backgroundSecondary }}
      >
        <View style={styles.trailHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText style={[Typography.h4, styles.trailName]}>
              {item.name}
            </ThemedText>
            <View style={styles.trailMeta}>
              <Feather name="map-pin" size={14} color={theme.accent} />
              <ThemedText
                style={[styles.metaText, { color: theme.tabIconDefault }]}
              >
                {distance.toFixed(1)} miles away
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getRiskColor(item.difficulty) },
            ]}
          >
            <ThemedText style={styles.difficultyText}>
              {item.difficulty}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          style={[styles.description, { color: theme.tabIconDefault }]}
        >
          {item.description}
        </ThemedText>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Feather name="navigation" size={16} color={theme.primary} />
            <ThemedText
              style={[styles.statText, { color: theme.tabIconDefault }]}
            >
              {item.distance.toFixed(1)} mi
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <Feather name="clock" size={16} color={theme.primary} />
            <ThemedText
              style={[styles.statText, { color: theme.tabIconDefault }]}
            >
              {Math.round(item.duration / 60)}h
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <Feather name="star" size={16} color={theme.primary} />
            <ThemedText
              style={[styles.statText, { color: theme.tabIconDefault }]}
            >
              {item.safetyRating.toFixed(1)}/10
            </ThemedText>
          </View>
        </View>

        {communityInsights &&
          (communityInsights.pace.status === "ready" ||
            communityInsights.hazards.status === "available") && (
            <View style={styles.communityInsightRow}>
              {communityInsights.pace.status === "ready" && (
                <>
                  <Feather name="users" size={14} color={theme.accent} />
                  <ThemedText
                    style={[styles.communityInsightText, { color: theme.text }]}
                  >
                    Observed peer pace ~
                    {communityInsights.pace.observedPeerPaceMph.toFixed(1)} mph
                  </ThemedText>
                </>
              )}
              {communityInsights.hazards.status === "available" && (
                <ThemedText
                  style={[
                    styles.communityInsightText,
                    { color: theme.warning },
                  ]}
                >
                  {communityInsights.pace.status === "ready" ? " · " : ""}
                  {communityInsights.hazards.reportedHazardCount} reported
                  hazard
                  {communityInsights.hazards.reportedHazardCount === 1
                    ? ""
                    : "s"}
                </ThemedText>
              )}
            </View>
          )}

        <View style={styles.landTypeRow}>
          <ThemedText
            style={[styles.landTypeLabel, { color: theme.tabIconDefault }]}
          >
            Land:
          </ThemedText>
          <ThemedText style={[styles.landTypeValue]}>
            {getLandTypeLabel(item.landType)}
          </ThemedText>
        </View>

        <View style={styles.featuresRow}>
          {item.features.slice(0, 2).map((feature, idx) => (
            <View
              key={`${item.id}-feature-${idx}`}
              style={[
                styles.featureTag,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText
                style={[styles.featureText, { color: theme.tabIconDefault }]}
              >
                {feature}
              </ThemedText>
            </View>
          ))}
          {item.features.length > 2 && (
            <ThemedText
              style={[styles.moreFeatures, { color: theme.tabIconDefault }]}
            >
              +{item.features.length - 2}
            </ThemedText>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.startButton, { backgroundColor: theme.primary }]}
            onPress={() =>
              navigation.navigate("ActiveAdventure", { trail: item })
            }
            android_ripple={{ color: theme.secondary }}
          >
            <Feather name="play" size={20} color="white" />
            <ThemedText style={[styles.startButtonText, { color: "white" }]}>
              Start Adventure
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.navigationButton, { backgroundColor: theme.accent }]}
            onPress={() => openGPSNavigation(item)}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          >
            <Feather name="navigation" size={18} color="white" />
            <ThemedText
              style={[styles.navigationButtonText, { color: "white" }]}
            >
              Take Me There
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.offlineButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => downloadTrailForOffline(item)}
            android_ripple={{ color: theme.primary }}
          >
            <Feather
              name={cachedTrails.has(item.id) ? "check-circle" : "download"}
              size={18}
              color={cachedTrails.has(item.id) ? theme.success : theme.primary}
            />
          </Pressable>
        </View>

        {/* Offline Download Button */}
        <View style={styles.offlineSection}>
          {cachedTrails.has(item.id) ? (
            <View style={styles.offlineStatus}>
              <Feather name="download" size={16} color={theme.success} />
              <ThemedText
                style={[
                  styles.offlineText,
                  { color: theme.success, marginLeft: Spacing.xs },
                ]}
              >
                Available Offline
              </ThemedText>
            </View>
          ) : (
            <Pressable
              style={[
                styles.downloadButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => downloadTrailForOffline(item)}
              disabled={downloadingTrails.has(item.id)}
            >
              {downloadingTrails.has(item.id) ? (
                <>
                  <Feather
                    name="loader"
                    size={16}
                    color={theme.tabIconDefault}
                  />
                  <ThemedText
                    style={[
                      styles.downloadButtonText,
                      { color: theme.tabIconDefault },
                    ]}
                  >
                    Downloading...
                  </ThemedText>
                </>
              ) : (
                <>
                  <Feather name="download" size={16} color={theme.primary} />
                  <ThemedText
                    style={[
                      styles.downloadButtonText,
                      { color: theme.primary },
                    ]}
                  >
                    Download for Offline
                  </ThemedText>
                </>
              )}
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  const renderFilterButton = (
    label: string,
    isActive: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      style={[
        styles.filterButton,
        {
          backgroundColor: isActive ? theme.primary : theme.backgroundSecondary,
        },
      ]}
      onPress={onPress}
    >
      <ThemedText
        style={[
          styles.filterButtonText,
          { color: isActive ? theme.buttonText : theme.tabIconDefault },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  // If map view is selected, show the map screen
  if (viewMode === "map") {
    return (
      <View style={{ flex: 1 }}>
        <ExploreMapScreen />
        <Pressable
          style={[
            styles.viewToggleButton,
            {
              top: insets.top + 70,
              right: Spacing.md,
              backgroundColor: theme.backgroundDefault,
            },
          ]}
          onPress={() => setViewMode("list")}
        >
          <Feather name="list" size={20} color={theme.primary} />
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl + Spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Feather name="compass" size={28} color={theme.primary} />
        <ThemedText style={[Typography.h3, styles.headerTitle]}>
          Navigate Trails
        </ThemedText>
        <Pressable
          onPress={() => setViewMode("map")}
          style={styles.viewToggleHeaderButton}
        >
          <Feather name="map" size={24} color={theme.primary} />
        </Pressable>
        <Pressable
          onPress={() => (navigation as any).getParent()?.navigate("Guides")}
          style={styles.helpButton}
        >
          <Feather name="help-circle" size={24} color={theme.primary} />
        </Pressable>
      </View>

      {/* Adventure Time - Hero Feature */}
      <Pressable
        style={[styles.adventureTimeHero, { backgroundColor: theme.primary }]}
        onPress={() =>
          navigation.navigate("ActiveAdventure", {
            trail: {
              name: "Adventure Time",
              difficulty: "Moderate" as const,
              id: `adventure_${Date.now()}`,
              description: "Live GPS tracking with community data",
              distance: 0,
              duration: 0,
              safetyRating: 0,
              landType: "public" as const,
              features: [],
              coordinates: { latitude: 0, longitude: 0 },
            },
          })
        }
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIconContainer}>
            <Feather name="navigation" size={48} color="white" />
          </View>
          <View style={styles.heroTextContainer}>
            <ThemedText style={[styles.heroTitle, { color: "white" }]}>
              🏁 Adventure Time
            </ThemedText>
            <ThemedText
              style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.95)" }]}
            >
              Live GPS tracking with rally navigator
            </ThemedText>
            <ThemedText
              style={[
                styles.heroDescription,
                { color: "rgba(255,255,255,0.8)" },
              ]}
            >
              Real-time callouts • Community data • Route tracking
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={32} color="white" />
        </View>
      </Pressable>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.primary,
          },
        ]}
      >
        <Feather name="search" size={18} color={theme.tabIconDefault} />
        <TextInput
          style={[styles.searchInput, { color: theme.tabIconDefault }]}
          placeholder="Search trails by name..."
          placeholderTextColor={theme.tabIconDefault}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x" size={18} color={theme.tabIconDefault} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterSection}>
        <ThemedText style={[Typography.label, styles.filterLabel]}>
          Difficulty:
        </ThemedText>
        <View style={styles.filterRow}>
          {(
            ["All", "Easy", "Moderate", "Hard", "Expert"] as DifficultyFilter[]
          ).map((difficulty) => (
            <View key={difficulty}>
              {renderFilterButton(
                difficulty,
                difficultyFilter === difficulty,
                () => setDifficultyFilter(difficulty),
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ThemedText style={[Typography.label, styles.filterLabel]}>
          Land Type:
        </ThemedText>
        <View style={styles.filterRow}>
          {(["All", "Public", "Private"] as LandTypeFilter[]).map(
            (landType) => (
              <View key={landType}>
                {renderFilterButton(landType, landTypeFilter === landType, () =>
                  setLandTypeFilter(landType),
                )}
              </View>
            ),
          )}
        </View>
      </View>

      {error ? (
        <ErrorState
          title="Couldn't load trails"
          message={error}
          onRetry={loadNearbyTrails}
        />
      ) : isLoading ? (
        <View style={{ gap: Spacing.md }}>
          <TrailCardSkeleton />
          <TrailCardSkeleton />
          <TrailCardSkeleton />
        </View>
      ) : filteredTrails.length > 0 ? (
        <>
          <ThemedText style={[Typography.label, styles.resultCount]}>
            {filteredTrails.length} trail
            {filteredTrails.length !== 1 ? "s" : ""} found
          </ThemedText>
          <View style={{ gap: Spacing.md }}>
            {filteredTrails.map((trail) => (
              <View key={trail.id}>{renderTrailCard({ item: trail })}</View>
            ))}
          </View>
        </>
      ) : (
        <EmptyState
          icon="search"
          title="No trails found"
          description={
            trails.length === 0
              ? "No trails available nearby. Try again later."
              : "No trails match your filters or search."
          }
          actionLabel="Refresh"
          onAction={loadNearbyTrails}
        />
      )}
    </ScrollView>
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
    marginBottom: Spacing.lg,
  },
  helpButton: {
    marginLeft: "auto",
    padding: Spacing.xs,
  },
  adventureTimeHero: {
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    minHeight: 160,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  chooseForMeButton: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  chooseForMeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  chooseForMeTextContainer: {
    flex: 1,
  },
  chooseForMeTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  chooseForMeSubtitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  freeAdventureButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  freeAdventureTextContainer: {
    flex: 1,
  },
  freeAdventureTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  freeAdventureSubtitle: {
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.xs,
    height: 40,
  },
  headerTitle: {
    marginLeft: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  filterButtonText: {
    fontWeight: "600",
    fontSize: 12,
  },
  resultCount: {
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  trailCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  trailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  trailName: {
    marginBottom: Spacing.xs,
  },
  trailMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontWeight: "700",
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
  },
  landTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  landTypeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  landTypeValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  communityInsightRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  communityInsightText: {
    fontSize: 12,
    fontWeight: "600",
  },
  featureTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  featureText: {
    fontSize: 11,
  },
  moreFeatures: {
    fontSize: 11,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing["2xl"],
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 280,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  startButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  startButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  navigationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  navigationButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  offlineSection: {
    marginTop: Spacing.md,
  },
  offlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  offlineText: {
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
  offlineButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  downloadButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewToggleButton: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  viewToggleHeaderButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
