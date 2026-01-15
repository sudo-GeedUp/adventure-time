import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { SAMPLE_TRAILS, Trail } from "@/utils/trails";
import { calculateDistance } from "@/utils/location";
import { OfflineMapsManager } from "@/utils/offlineMaps";

let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let Polyline: any = null;

if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    Circle = maps.Circle;
    Polyline = maps.Polyline;
    console.log("Maps loaded successfully:", !!MapView);
  } catch (e: any) {
    console.log("Maps load error:", e?.message || "Unknown error loading maps");
  }
}

const { width, height } = Dimensions.get("window");
const MAP_PADDING = 50;

const MAX_LOCATION_ACCURACY_METERS = 50;
const MAP_CENTER_THROTTLE_MS = 1200;
const MIN_CENTER_MOVE_METERS = 3;
const MAX_REASONABLE_SPEED_MPS = 100;

export default function LiveMapScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const lastAcceptedLocationRef = useRef<any>(null);
  const lastCenteredLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastCenterTimeRef = useRef<number>(0);
  
  const [location, setLocation] = useState<any>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [nearbyTrails, setNearbyTrails] = useState<Trail[]>([]);
  const [isTracking, setIsTracking] = useState(true);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

  const gpsAccuracyIsPoor =
    typeof gpsAccuracy === "number" &&
    gpsAccuracy > MAX_LOCATION_ACCURACY_METERS;

  const gpsStatusColor =
    location && !gpsAccuracyIsPoor ? theme.success : theme.warning;

  const gpsStatusText = !location
    ? "No Signal"
    : typeof gpsAccuracy === "number"
      ? `GPS ±${Math.round(gpsAccuracy)}m`
      : "GPS Active";

  useEffect(() => {
    initializeLocation();
    loadTrails();
  }, []);

  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  useEffect(() => {
    if (location && mapReady && isTracking) {
      updateMapRegion();
    }
  }, [location, mapReady, isTracking]);

  useEffect(() => {
    if (location) {
      updateNearbyTrails();
    }
  }, [location, trails]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is needed for live GPS tracking");
        return;
      }

      // Get initial location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setGpsAccuracy(
        typeof currentLocation.coords.accuracy === "number"
          ? currentLocation.coords.accuracy
          : null
      );
      setLocation(currentLocation);
      lastAcceptedLocationRef.current = currentLocation;

      // Start location tracking
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const nextAccuracy =
            typeof newLocation.coords.accuracy === "number"
              ? newLocation.coords.accuracy
              : null;
          setGpsAccuracy(nextAccuracy);

          if (
            typeof nextAccuracy === "number" &&
            nextAccuracy > MAX_LOCATION_ACCURACY_METERS
          ) {
            return;
          }

          const prevAccepted = lastAcceptedLocationRef.current;
          if (prevAccepted) {
            const prevTimestamp =
              typeof prevAccepted.timestamp === "number"
                ? prevAccepted.timestamp
                : Date.now();
            const newTimestamp =
              typeof newLocation.timestamp === "number"
                ? newLocation.timestamp
                : Date.now();
            const timeDeltaSeconds = Math.max(
              (newTimestamp - prevTimestamp) / 1000,
              0.001
            );

            const distanceMiles = calculateDistance(
              prevAccepted.coords,
              newLocation.coords
            );
            const distanceMeters = distanceMiles * 1609.344;
            const speedMps = distanceMeters / timeDeltaSeconds;

            if (speedMps > MAX_REASONABLE_SPEED_MPS) {
              return;
            }
          }

          lastAcceptedLocationRef.current = newLocation;
          setLocation(newLocation);
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      console.error("Error initializing location:", error);
      Alert.alert("Error", "Could not get your location");
    }
  };

  const loadTrails = async () => {
    try {
      // Load cached trails first for offline support
      const cachedTrails = await OfflineMapsManager.getCachedTrails();
      if (cachedTrails.length > 0) {
        setTrails(cachedTrails);
      } else {
        setTrails(SAMPLE_TRAILS);
      }
    } catch (error) {
      console.error("Error loading trails:", error);
      setTrails(SAMPLE_TRAILS);
    }
  };

  const updateMapRegion = () => {
    if (!mapRef.current || !location) return;

    if (gpsAccuracyIsPoor) {
      return;
    }

    const now = Date.now();
    if (now - lastCenterTimeRef.current < MAP_CENTER_THROTTLE_MS) return;

    const nextCenter = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    const lastCentered = lastCenteredLocationRef.current;
    if (lastCentered) {
      const distanceMeters =
        calculateDistance(lastCentered, nextCenter) * 1609.344;
      if (distanceMeters < MIN_CENTER_MOVE_METERS) return;
    }

    lastCenterTimeRef.current = now;
    lastCenteredLocationRef.current = nextCenter;

    mapRef.current.animateToRegion(
      {
        ...nextCenter,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800
    );
  };

  const updateNearbyTrails = () => {
    if (!location) return;
    
    const nearby = trails.filter(trail => {
      const distance = calculateDistance(location.coords, trail.location);
      return distance <= 20; // Show trails within 20 miles
    });
    
    setNearbyTrails(nearby);
  };

  const centerOnUser = () => {
    if (mapRef.current && location) {
      const nextCenter = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      lastCenterTimeRef.current = Date.now();
      lastCenteredLocationRef.current = nextCenter;

      mapRef.current.animateToRegion(
        {
          ...nextCenter,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking && location) {
      centerOnUser();
    }
  };

  const handleTrailPress = (trail: Trail) => {
    setIsTracking(false);
    setSelectedTrail(trail);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: trail.location.latitude,
        longitude: trail.location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const startAdventure = (trail: Trail) => {
    navigation.navigate("ActiveAdventure", { trail });
  };

  const renderMap = () => {
    if (!MapView) {
      return (
        <View style={[styles.mapPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="map" size={64} color={theme.tabIconDefault} />
          <ThemedText style={[styles.mapText, { color: theme.tabIconDefault }]}>
            Maps available on device only
          </ThemedText>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location?.coords.latitude || 38.5729,
          longitude: location?.coords.longitude || -109.5898,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsScale
        onPanDrag={() => isTracking && setIsTracking(false)}
        onMapReady={() => setMapReady(true)}
        mapType="standard"
      >
        {/* User location accuracy circle */}
        {location && (
          <Circle
            center={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            radius={Math.max(location.coords.accuracy || 10, gpsAccuracy || 0)}
            strokeColor={theme.primary}
            fillColor={`${theme.primary}33`}
            strokeWidth={2}
          />
        )}

        {/* Trail markers */}
        {nearbyTrails.map((trail) => (
          <Marker
            key={trail.id}
            coordinate={{
              latitude: trail.location.latitude,
              longitude: trail.location.longitude,
            }}
            onPress={() => handleTrailPress(trail)}
          >
            <View style={[styles.trailMarker, { backgroundColor: theme.primary }]}>
              <Feather name="flag" size={16} color="white" />
            </View>
          </Marker>
        ))}

        {/* Selected trail info */}
        {selectedTrail && location && !gpsAccuracyIsPoor && (
          <Polyline
            coordinates={[
              {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
              {
                latitude: selectedTrail.location.latitude,
                longitude: selectedTrail.location.longitude,
              },
            ]}
            strokeColor={theme.accent}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={[Typography.h3, styles.headerTitle]}>
            Live GPS Map
          </ThemedText>
          <View style={styles.locationStatus}>
            <Feather 
              name={location ? "navigation" : "compass"} 
              size={20} 
              color={gpsStatusColor} 
            />
            <ThemedText style={[styles.statusText, { color: gpsStatusColor }]}>
              {gpsStatusText}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {renderMap()}
        
        {/* Map Controls */}
        <View style={styles.mapControls}>
          <Pressable
            style={[styles.controlButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={centerOnUser}
          >
            <Feather name="crosshair" size={20} color={theme.primary} />
          </Pressable>
          
          <Pressable
            style={[styles.controlButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={toggleTracking}
          >
            <Feather 
              name={isTracking ? "navigation" : "compass"} 
              size={20} 
              color={isTracking ? theme.success : theme.warning} 
            />
          </Pressable>
        </View>
      </View>

      {/* Selected Trail Info */}
      {selectedTrail && (
        <View style={[styles.trailInfo, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.trailInfoHeader}>
            <ThemedText style={[Typography.h4]}>{selectedTrail.name}</ThemedText>
            <Pressable onPress={() => setSelectedTrail(null)}>
              <Feather name="x" size={20} color={theme.tabIconDefault} />
            </Pressable>
          </View>
          
          <View style={styles.trailDetails}>
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={16} color={theme.primary} />
              <ThemedText style={styles.detailText}>
                {location ? calculateDistance(location.coords, selectedTrail.location).toFixed(1) : "0"} miles away (straight-line)
              </ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="trending-up" size={16} color={theme.warning} />
              <ThemedText style={styles.detailText}>
                {selectedTrail.difficulty} • {selectedTrail.distance.toFixed(1)} miles
              </ThemedText>
            </View>
          </View>
          
          <Pressable
            style={[styles.startButton, { backgroundColor: theme.primary }]}
            onPress={() => startAdventure(selectedTrail)}
          >
            <Feather name="play" size={16} color="white" />
            <ThemedText style={[styles.startButtonText, { color: "white" }]}>
              Start Adventure
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Nearby Trails List */}
      <View style={[styles.nearbyList, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={[Typography.h4, styles.listTitle]}>
          Nearby Trails ({nearbyTrails.length})
        </ThemedText>
        
        {nearbyTrails.slice(0, 3).map((trail) => (
          <Pressable
            key={trail.id}
            style={[styles.nearbyItem, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => handleTrailPress(trail)}
          >
            <View style={styles.nearbyItemContent}>
              <ThemedText style={styles.nearbyItemName}>{trail.name}</ThemedText>
              <ThemedText style={[styles.nearbyItemDistance, { color: theme.tabIconDefault }]}>
                {location ? calculateDistance(location.coords, trail.location).toFixed(1) : "0"} miles
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={16} color={theme.tabIconDefault} />
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "600",
  },
  locationStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  mapText: {
    textAlign: "center",
    fontSize: 16,
  },
  mapControls: {
    position: "absolute",
    right: Spacing.lg,
    top: Spacing.lg,
    gap: Spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  trailMarker: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  trailInfo: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  trailInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  trailDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 14,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  startButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  nearbyList: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    maxHeight: 200,
  },
  listTitle: {
    marginBottom: Spacing.md,
  },
  nearbyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  nearbyItemContent: {
    flex: 1,
  },
  nearbyItemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  nearbyItemDistance: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
