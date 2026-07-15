import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage, CompletedAdventure, RoutePoint } from "@/utils/storage";
import { OfflineMapsManager } from "@/utils/offlineMaps";
import { Trail } from "@/utils/trails";

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
  } catch {
    console.log("Maps not available");
  }
}

interface OfflineTrail extends Trail {
  cachedAt: number;
  isDownloaded: boolean;
}

interface AdventureListItem {
  id: string;
  title: string;
  subtitle?: string;
  distance?: number;
  date?: number;
  sortKey: number;
  type: "adventure" | "offline";
  coordinates: { latitude: number; longitude: number }[];
  center: { latitude: number; longitude: number };
  original: CompletedAdventure | OfflineTrail;
}

export default function MyAdventuresScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);

  const [items, setItems] = useState<AdventureListItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AdventureListItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (mapReady && selectedItem && mapRef.current) {
      if (selectedItem.coordinates.length > 1) {
        mapRef.current.fitToCoordinates(selectedItem.coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } else if (selectedItem.coordinates.length === 1) {
        mapRef.current.animateToRegion(
          {
            ...selectedItem.coordinates[0],
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          500,
        );
      }
    }
  }, [mapReady, selectedItem]);

  const loadItems = async () => {
    try {
      const [adventures, cachedTrails] = await Promise.all([
        storage.getCommunityAdventures(),
        OfflineMapsManager.getCachedTrails(),
      ]);

      const adventureItems: AdventureListItem[] = adventures.map((adv) => {
        const coords =
          adv.route?.map((point: RoutePoint) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          })) || [];
        return {
          id: `adv_${adv.id}`,
          title: adv.trailName || adv.title || "Past Adventure",
          subtitle: `${new Date(adv.startTime).toLocaleDateString()}`,
          distance: adv.totalDistance,
          date: adv.startTime,
          sortKey: adv.startTime,
          type: "adventure",
          coordinates: coords,
          center: coords[0] || { latitude: 0, longitude: 0 },
          original: adv,
        };
      });

      const offlineItems: AdventureListItem[] = cachedTrails.map((trail) => ({
        id: `offline_${trail.id}`,
        title: trail.name,
        subtitle: "Saved Offline Trail",
        distance: trail.distance,
        date: trail.cachedAt,
        sortKey: trail.cachedAt,
        type: "offline",
        coordinates: trail.location ? [trail.location] : [],
        center: trail.location || { latitude: 0, longitude: 0 },
        original: trail,
      }));

      const allItems = [...adventureItems, ...offlineItems].sort(
        (a, b) => b.sortKey - a.sortKey,
      );

      setItems(allItems);
      if (allItems.length > 0) {
        setSelectedItem(allItems[0]);
      }
    } catch (error) {
      console.error("Error loading saved adventures:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (miles?: number) => {
    if (miles == null) return "";
    return `${miles.toFixed(1)} mi`;
  };

  const renderItem = ({ item }: { item: AdventureListItem }) => {
    const isSelected = selectedItem?.id === item.id;
    return (
      <Pressable
        style={[
          styles.card,
          { backgroundColor: theme.backgroundDefault },
          isSelected && { borderColor: theme.primary, borderWidth: 2 },
        ]}
        onPress={() => setSelectedItem(item)}
      >
        <View style={styles.cardContent}>
          <Feather
            name={item.type === "adventure" ? "map" : "download-cloud"}
            size={24}
            color={theme.primary}
          />
          <View style={styles.cardText}>
            <ThemedText style={Typography.label}>{item.title}</ThemedText>
            {item.subtitle ? (
              <ThemedText
                style={[styles.cardSubtitle, { color: theme.tabIconDefault }]}
              >
                {item.subtitle}
              </ThemedText>
            ) : null}
          </View>
        </View>
        <ThemedText style={{ color: theme.tabIconDefault }}>
          {formatDistance(item.distance)}
        </ThemedText>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.primary} />
        </Pressable>
        <ThemedText style={[Typography.h2, styles.headerTitle]}>
          My Adventures & Saved Maps
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {MapView && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            onMapReady={() => setMapReady(true)}
            initialRegion={
              selectedItem?.center
                ? {
                    ...selectedItem.center,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }
                : undefined
            }
          >
            {selectedItem && selectedItem.coordinates.length > 1 && (
              <Polyline
                coordinates={selectedItem.coordinates}
                strokeColor={theme.primary}
                strokeWidth={4}
              />
            )}
            {selectedItem &&
              selectedItem.coordinates.map((coord, index) => (
                <Marker
                  key={`marker_${index}`}
                  coordinate={coord}
                  pinColor={index === 0 ? theme.success : theme.primary}
                />
              ))}
          </MapView>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="map" size={48} color={theme.tabIconDefault} />
          <ThemedText
            style={[styles.emptyText, { color: theme.tabIconDefault }]}
          >
            No saved adventures or offline maps yet. Start an adventure or
            download a trail to see it here.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: insets.bottom + Spacing.lg,
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  mapContainer: {
    height: 250,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  map: {
    flex: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: "center",
    fontSize: 16,
  },
});
