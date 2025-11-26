import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, Alert, TextInput, ScrollView } from "react-native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import {
  getTrailsNearLocation,
  filterTrailsByDifficulty,
  filterTrailsByLandType,
  sortTrailsByRating,
  Trail,
  SAMPLE_TRAILS,
} from "@/utils/trails";
import { calculateDistance } from "@/utils/location";

type DifficultyFilter = "All" | "Easy" | "Moderate" | "Hard" | "Expert";
type LandTypeFilter = "All" | "Public" | "Private";

export default function NavigateScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [location, setLocation] = useState<any>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [filteredTrails, setFilteredTrails] = useState<Trail[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [landTypeFilter, setLandTypeFilter] = useState<LandTypeFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load trails immediately with default location
    const defaultLocation = {
      coords: {
        latitude: 38.5729,
        longitude: -109.5898,
        altitude: 0,
        accuracy: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    };
    setLocation(defaultLocation);
    setTrails(sortTrailsByRating(SAMPLE_TRAILS));
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trails, difficultyFilter, landTypeFilter, searchQuery]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        loadNearbyTrails(currentLocation);
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
        altitude: 0,
        accuracy: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    };
    setLocation(defaultLocation);
    loadNearbyTrails(defaultLocation);
  };

  const loadNearbyTrails = (currentLocation: any) => {
    const nearbyTrails = getTrailsNearLocation(currentLocation.coords, 50);
    const sortedTrails = sortTrailsByRating(nearbyTrails);
    setTrails(sortedTrails);
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...trails];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (trail) =>
          trail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trail.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Difficulty filter
    if (difficultyFilter !== "All") {
      filtered = filterTrailsByDifficulty(filtered, difficultyFilter as "Easy" | "Moderate" | "Hard" | "Expert");
    }

    // Land type filter
    if (landTypeFilter === "Public") {
      filtered = filterTrailsByLandType(filtered, "public");
    } else if (landTypeFilter === "Private") {
      filtered = filterTrailsByLandType(filtered, "private");
    }

    setFilteredTrails(filtered);
  };

  const renderTrailCard = ({ item }: { item: Trail }) => {
    const distance =
      location && item.location
        ? calculateDistance(location.coords, item.location)
        : 0;

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
              <ThemedText style={[styles.metaText, { color: theme.tabIconDefault }]}>
                {distance.toFixed(1)} miles away
              </ThemedText>
            </View>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getRiskColor(item.difficulty) }]}>
            <ThemedText style={styles.difficultyText}>{item.difficulty}</ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.description, { color: theme.tabIconDefault }]}>
          {item.description}
        </ThemedText>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Feather name="navigation" size={16} color={theme.primary} />
            <ThemedText style={[styles.statText, { color: theme.tabIconDefault }]}>
              {item.distance.toFixed(1)} mi
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <Feather name="clock" size={16} color={theme.primary} />
            <ThemedText style={[styles.statText, { color: theme.tabIconDefault }]}>
              {Math.round(item.duration / 60)}h
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <Feather name="star" size={16} color={theme.primary} />
            <ThemedText style={[styles.statText, { color: theme.tabIconDefault }]}>
              {item.safetyRating.toFixed(1)}/10
            </ThemedText>
          </View>
        </View>

        <View style={styles.landTypeRow}>
          <ThemedText style={[styles.landTypeLabel, { color: theme.tabIconDefault }]}>
            Land:
          </ThemedText>
          <ThemedText style={[styles.landTypeValue]}>
            {getLandTypeLabel(item.landType)}
          </ThemedText>
        </View>

        <View style={styles.featuresRow}>
          {item.features.slice(0, 2).map((feature) => (
            <View
              key={feature}
              style={[
                styles.featureTag,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText style={[styles.featureText, { color: theme.tabIconDefault }]}>
                {feature}
              </ThemedText>
            </View>
          ))}
          {item.features.length > 2 && (
            <ThemedText style={[styles.moreFeatures, { color: theme.tabIconDefault }]}>
              +{item.features.length - 2}
            </ThemedText>
          )}
        </View>
      </Pressable>
    );
  };

  const renderFilterButton = (label: string, isActive: boolean, onPress: () => void) => (
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

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot }
      ]}
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
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.backgroundDefault, borderColor: theme.primary }]}>
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
        <ThemedText style={[Typography.h5, styles.filterLabel]}>Difficulty:</ThemedText>
        <View style={styles.filterRow}>
          {(["All", "Easy", "Moderate", "Hard", "Expert"] as DifficultyFilter[]).map(
            (difficulty) => (
              <View key={difficulty}>
                {renderFilterButton(difficulty, difficultyFilter === difficulty, () =>
                  setDifficultyFilter(difficulty)
                )}
              </View>
            )
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ThemedText style={[Typography.h5, styles.filterLabel]}>Land Type:</ThemedText>
        <View style={styles.filterRow}>
          {(["All", "Public", "Private"] as LandTypeFilter[]).map((landType) => (
            <View key={landType}>
              {renderFilterButton(landType, landTypeFilter === landType, () =>
                setLandTypeFilter(landType)
              )}
            </View>
          ))}
        </View>
      </View>

      {filteredTrails.length > 0 ? (
        <>
          <ThemedText style={[Typography.h5, styles.resultCount]}>
            {filteredTrails.length} trail{filteredTrails.length !== 1 ? "s" : ""} found
          </ThemedText>
          {filteredTrails.map((trail) => renderTrailCard({ item: trail }))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={theme.tabIconDefault} />
          <ThemedText style={[styles.emptyText, { color: theme.tabIconDefault }]}>
            {trails.length === 0 ? "Loading trails..." : "No trails match your filters or search."}
          </ThemedText>
        </View>
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 280,
  },
});
