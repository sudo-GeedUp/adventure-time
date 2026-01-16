import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage, RoutePoint, AdventureHazard, AssistanceWaypoint } from "@/utils/storage";
import { calculateDistance } from "@/utils/location";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Trail } from "@/utils/trails";
import { OfflineMapsManager } from "@/utils/offlineMaps";

type ActiveAdventureScreenRouteProp = RouteProp<any, "ActiveAdventure">;

interface AdventureSession {
  startLocation: { latitude: number; longitude: number };
  currentDistance: number;
  startTime: number;
  locations: Array<{ latitude: number; longitude: number; timestamp: number }>;
  route: RoutePoint[];
  hazards: AdventureHazard[];
  assistanceWaypoints: AssistanceWaypoint[];
  maxSpeed: number;
  maxAltitude: number;
}

export default function ActiveAdventureScreen() {
  const route = useRoute<ActiveAdventureScreenRouteProp>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isPremium } = useSubscription();
  const insets = useSafeAreaInsets();
  const trail: Trail = (route.params as any)?.trail || { name: "Unknown Trail" } as Trail;

  const [session, setSession] = useState<AdventureSession | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showHazardModal, setShowHazardModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);

  // Initialize adventure session
  useEffect(() => {
    startAdventure();
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (!isTracking || !session) return;
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - session.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTracking, session]);

  // Track location every 5 seconds
  useEffect(() => {
    if (!isTracking) return;
    let locationSubscription: Location.LocationSubscription;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is needed to track your adventure");
        setIsTracking(false);
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          setSession((prev) => {
            if (!prev) return null;
            
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: Date.now(),
            };

            // Calculate distance from last location
            const lastLocation = prev.locations[prev.locations.length - 1];
            let addedDistance = 0;
            if (lastLocation) {
              addedDistance = calculateDistance(lastLocation, newLocation);
            }

            const newDistance = prev.currentDistance + addedDistance;
            const newLocations = [...prev.locations, newLocation];
            const currentSpeed = location.coords.speed ? location.coords.speed * 2.237 : 0;
            const currentAltitude = location.coords.altitude || 0;

            const newRoutePoint: RoutePoint = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              altitude: currentAltitude,
              timestamp: Date.now(),
              speed: currentSpeed,
            };

            setSpeed(currentSpeed);
            setAltitude(currentAltitude);

            return {
              ...prev,
              currentDistance: newDistance,
              locations: newLocations,
              route: [...prev.route, newRoutePoint],
              maxSpeed: Math.max(prev.maxSpeed, currentSpeed),
              maxAltitude: Math.max(prev.maxAltitude, currentAltitude),
            };
          });
        }
      );
    };

    if (Platform.OS !== "web") {
      startLocationTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isTracking, session]);

  const startAdventure = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const initialAltitude = location.coords.altitude || 0;
      setAltitude(initialAltitude);
      setSession({
        startLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        currentDistance: 0,
        startTime: Date.now(),
        locations: [
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
          },
        ],
        route: [
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: initialAltitude,
            timestamp: Date.now(),
            speed: location.coords.speed || 0,
          },
        ],
        hazards: [],
        assistanceWaypoints: [],
        maxSpeed: 0,
        maxAltitude: initialAltitude,
      });
    } catch (error) {
      Alert.alert("Error", "Could not get your location. Please enable location services.");
    }
  };

  const endAdventure = async () => {
    if (!session) return;

    setIsTracking(false);

    // Get user profile for community adventure
    const userProfile = await storage.getUserProfile();
    
    // Save completed adventure to community database
    const completedAdventure = {
      id: `adventure_${Date.now()}`,
      userId: userProfile?.id || "anonymous",
      userName: userProfile?.name || "Anonymous",
      vehicleType: userProfile?.vehicleType || "Unknown",
      title: trail.name || "Custom Adventure",
      startTime: session.startTime,
      endTime: Date.now(),
      totalDistance: session.currentDistance,
      maxSpeed: session.maxSpeed,
      maxAltitude: session.maxAltitude,
      route: session.route,
      hazards: session.hazards,
      assistanceWaypoints: session.assistanceWaypoints,
      trailName: trail.name,
      difficulty: trail.difficulty,
    };

    await storage.saveCompletedAdventure(completedAdventure);

    // Only save to profile if premium
    if (isPremium) {
      // Log miles to profile
      const { newBadges: earnedBadges, profile } = await storage.addTrailMiles(session.currentDistance);
      setNewBadges(earnedBadges.map((b) => b.id));
    }

    // Show summary and badge unlock alerts
    const message = isPremium 
      ? `You traveled ${session.currentDistance.toFixed(1)} miles on ${trail.name}${
          newBadges.length > 0 ? `\n\n🏆 New badge${newBadges.length > 1 ? "s" : ""} unlocked!` : ""
        }\n\nAdventure saved to your profile and shared with the community!`
      : `You traveled ${session.currentDistance.toFixed(1)} miles on ${trail.name}\n\nAdventure shared with the community!\n\n🔒 Subscribe to save adventures to your profile and unlock badges!`;
    
    Alert.alert(
      "Adventure Complete!",
      message,
      [
        {
          text: "Back",
          onPress: () => navigation.goBack(),
        },
        ...(!isPremium ? [{ text: "Subscribe", onPress: () => (navigation as any).navigate("ProfileTab", { screen: "Subscription" }) }] : []),
      ]
    );
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}:${(
      seconds % 60
    )
      .toString()
      .padStart(2, "0")}`;
  };

  const formatSpeed = (mps: number) => {
    const mph = mps * 2.237; // Convert m/s to mph
    return mph.toFixed(1);
  };

  if (!session) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={Typography.h3}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <ThemedText style={[Typography.h4, styles.headerTitle]}>{trail.name}</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      {/* Live Stats */}
      <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault }]}>
        {/* Distance */}
        <View style={styles.statBlock}>
          <Feather name="navigation" size={32} color={theme.primary} />
          <ThemedText style={[Typography.h2, styles.statValue]}>
            {session.currentDistance.toFixed(1)}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.tabIconDefault }]}>miles</ThemedText>
        </View>

        {/* Time */}
        <View style={styles.statBlock}>
          <Feather name="clock" size={32} color={theme.accent} />
          <ThemedText style={[Typography.h2, styles.statValue]}>{formatTime(elapsedTime)}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.tabIconDefault }]}>elapsed</ThemedText>
        </View>

        {/* Speed */}
        <View style={styles.statBlock}>
          <Feather name="zap" size={32} color={theme.warning} />
          <ThemedText style={[Typography.h2, styles.statValue]}>{formatSpeed(speed)}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.tabIconDefault }]}>mph</ThemedText>
        </View>

        {/* Altitude */}
        <View style={styles.statBlock}>
          <Feather name="trending-up" size={32} color={theme.success} />
          <ThemedText style={[Typography.h2, styles.statValue]}>
            {altitude > 0 ? Math.round(altitude) : '--'}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.tabIconDefault }]}>ft</ThemedText>
        </View>
      </View>

      {/* Trail Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={20} color={theme.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={[Typography.label, { fontWeight: "600" }]}>Expected Distance</ThemedText>
            <ThemedText style={[styles.infoValue, { color: theme.tabIconDefault }]}>
              {trail.distance.toFixed(1)} miles
            </ThemedText>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Feather name="trending-up" size={20} color={theme.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={[Typography.label, { fontWeight: "600" }]}>Difficulty</ThemedText>
            <ThemedText style={[styles.infoValue, { color: theme.tabIconDefault }]}>
              {trail.difficulty}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActionsContainer}>
        <Pressable
          style={[styles.quickActionButton, { backgroundColor: theme.warning + "20", borderColor: theme.warning }]}
          onPress={() => setShowHazardModal(true)}
        >
          <Feather name="alert-triangle" size={24} color={theme.warning} />
          <ThemedText style={[styles.quickActionText, { color: theme.warning }]}>
            Mark Hazard
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.quickActionButton, { backgroundColor: theme.error + "20", borderColor: theme.error }]}
          onPress={() => setShowAssistanceModal(true)}
        >
          <Feather name="alert-circle" size={24} color={theme.error} />
          <ThemedText style={[styles.quickActionText, { color: theme.error }]}>
            Need Help
          </ThemedText>
        </Pressable>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {isTracking ? (
          <>
            <Pressable
              style={[styles.button, styles.pauseButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => setIsTracking(false)}
            >
              <Feather name="pause" size={24} color={theme.tabIconDefault} />
              <ThemedText style={[styles.buttonText, { color: theme.tabIconDefault }]}>Pause</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, styles.endButton, { backgroundColor: theme.warning }]}
              onPress={endAdventure}
            >
              <Feather name="flag" size={24} color={theme.backgroundDefault} />
              <ThemedText style={[styles.buttonText, { color: theme.backgroundDefault }]}>End Adventure</ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={[styles.button, styles.resumeButton, { backgroundColor: theme.success }]}
              onPress={() => setIsTracking(true)}
            >
              <Feather name="play" size={24} color={theme.backgroundDefault} />
              <ThemedText style={[styles.buttonText, { color: theme.backgroundDefault }]}>Resume</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, styles.endButton, { backgroundColor: theme.error }]}
              onPress={endAdventure}
            >
              <Feather name="x" size={24} color={theme.backgroundDefault} />
              <ThemedText style={[styles.buttonText, { color: theme.backgroundDefault }]}>Finish</ThemedText>
            </Pressable>
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  statBlock: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  statValue: {
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    minHeight: 56,
  },
  pauseButton: {},
  resumeButton: {},
  endButton: {},
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
  },
});
