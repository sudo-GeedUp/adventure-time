import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import {
  storage,
  RoutePoint,
  AdventureHazard,
  AssistanceWaypoint,
} from "@/utils/storage";
import * as Location from "expo-location";
import { calculateDistance } from "@/utils/location";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Trail } from "@/utils/trails";
import { OfflineMapsManager } from "@/utils/offlineMaps";
import {
  breadcrumbManager,
  Breadcrumb,
  BreadcrumbTrail,
} from "@/utils/breadcrumbs";
import {
  rallyNavigatorService,
  NavigationCallout,
} from "@/services/rallyNavigatorService";
import { EmergencySOS } from "@/utils/emergencySOS";

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
  } catch (e) {
    console.log("Maps not available");
  }
}

type ActiveAdventureScreenRouteProp = RouteProp<any, "ActiveAdventure">;

interface AdventureSession {
  startLocation: { latitude: number; longitude: number };
  currentDistance: number;
  startTime: number;
  // Location tracking with optional heading for map camera orientation
  locations: Array<{
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
  }>;
  route: RoutePoint[];
  hazards: AdventureHazard[];
  assistanceWaypoints: AssistanceWaypoint[];
  maxSpeed: number;
  maxAltitude: number;
  totalSpeed: number;
  speedReadings: number;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  mapContainer: {
    height: 250,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  liveMap: {
    flex: 1,
  },
  hazardMapMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  assistanceMapMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  trailInfoOverlay: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  trailInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  trailInfoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  trailAlertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  trailAlertText: {
    fontSize: 12,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  hazardList: {
    maxHeight: 300,
    marginBottom: Spacing.lg,
  },
  hazardOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
  },
  hazardIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  hazardLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  descriptionInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: Spacing.lg,
    minHeight: 80,
    textAlignVertical: "top",
  },
  assistanceInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: Spacing.lg,
    minHeight: 120,
    textAlignVertical: "top",
  },
  warningBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "white",
  },
  modalDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing.xl,
  },
  modalInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    fontSize: 16,
  },
  modalButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  warningText: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  navigatorPanel: {
    backgroundColor: "rgba(0,0,0,0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  navigatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  calloutItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    borderLeftWidth: 4,
    gap: Spacing.sm,
  },
  calloutText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  speedometerCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  speedometerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  currentSpeedDisplay: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  currentSpeedValue: {
    fontSize: 72,
    fontWeight: "700",
    lineHeight: 80,
  },
  currentSpeedUnit: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: -Spacing.sm,
  },
  speedStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  speedStat: {
    alignItems: "center",
    flex: 1,
  },
  speedStatLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  speedStatValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  speedStatUnit: {
    fontSize: 12,
  },
  speedStatDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});

export default function ActiveAdventureScreen() {
  const route = useRoute<ActiveAdventureScreenRouteProp>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isPremium } = useSubscription();
  const insets = useSafeAreaInsets();
  const trail: Trail =
    (route.params as any)?.trail || ({ name: "Unknown Trail" } as Trail);

  const [session, setSession] = useState<AdventureSession | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showHazardModal, setShowHazardModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [selectedHazardType, setSelectedHazardType] = useState<string | null>(
    null,
  );
  const [hazardDescription, setHazardDescription] = useState("");
  const [assistanceDescription, setAssistanceDescription] = useState("");
  const [showMap, setShowMap] = useState(true);
  const [breadcrumbTrail, setBreadcrumbTrail] =
    useState<BreadcrumbTrail | null>(null);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null);
  const [navigationCallouts, setNavigationCallouts] = useState<
    NavigationCallout[]
  >([]);
  const [showNavigator, setShowNavigator] = useState(true);
  const [communityTrails, setCommunityTrails] = useState<any[]>([]);
  const mapRef = React.useRef<any>(null);
  const speedUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const altitudeUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const sosTrackingStartedRef = useRef(false);
  const speedHistoryRef = useRef<number[]>([]);

  const HAZARD_TYPES = [
    { id: "washout", label: "Washout", icon: "alert-triangle" },
    { id: "rockslide", label: "Rockslide", icon: "alert-octagon" },
    { id: "steep_grade", label: "Steep Grade", icon: "trending-up" },
    { id: "narrow_trail", label: "Narrow Trail", icon: "minimize-2" },
    { id: "water_crossing", label: "Water Crossing", icon: "droplet" },
    { id: "fallen_tree", label: "Fallen Tree", icon: "x-circle" },
    { id: "soft_ground", label: "Soft Ground", icon: "circle" },
    { id: "other", label: "Other Hazard", icon: "alert-circle" },
  ];

  // Load community trail data
  const loadCommunityTrails = async () => {
    try {
      const adventures = await storage.getCommunityAdventures();
      // Get recent adventures with routes near current location
      const recentTrails = adventures
        .filter((adv: any) => adv.route && adv.route.length > 0)
        .slice(0, 20); // Show last 20 community trails
      setCommunityTrails(recentTrails);
      console.log(
        "[Community Data] Loaded",
        recentTrails.length,
        "trails from past users",
      );
    } catch (error) {
      console.error("[Community Data] Error loading trails:", error);
    }
  };

  // Initialize adventure session
  useEffect(() => {
    startAdventure();
    loadCommunityTrails();
    // Initialize rally navigator with trail data
    console.log("[Rally Navigator] Initializing with trail:", trail.name);
    rallyNavigatorService.initialize(
      trail,
      [],
      [], // Hazards will be added dynamically during the adventure
    );
    console.log("[Rally Navigator] Initialized successfully");

    // Show initial welcome callout
    const welcomeCallout: NavigationCallout = {
      id: `welcome-${Date.now()}`,
      type: "info",
      message: `🏁 Adventure started on ${trail.name}! Stay safe and have fun!`,
      priority: "medium",
      timestamp: Date.now(),
      icon: "flag",
    };
    setNavigationCallouts([welcomeCallout]);

    // Start route tracking for emergency contact feature
    EmergencySOS.startRouteTracking();
    sosTrackingStartedRef.current = true;
    console.log("[Emergency SOS] Route tracking started");
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

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to track your adventure",
        );
        setIsTracking(false);
        return;
      }

      locationSubscriptionRef.current = await Location.watchPositionAsync(
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
            let calculatedSpeed = 0;

            if (lastLocation) {
              addedDistance = calculateDistance(lastLocation, newLocation);
              // Calculate speed from distance if GPS speed is invalid
              const timeDiff = (Date.now() - lastLocation.timestamp) / 1000; // seconds
              if (timeDiff > 0 && addedDistance > 0) {
                // Speed in mph: (miles / seconds) * 3600
                calculatedSpeed = (addedDistance / timeDiff) * 3600;
              }
            }

            const newDistance = prev.currentDistance + addedDistance;
            const newLocations = [...prev.locations, newLocation];

            // Use GPS speed if valid, otherwise use calculated speed
            let rawSpeed = 0;
            if (location.coords.speed && location.coords.speed >= 0) {
              rawSpeed = location.coords.speed * 2.237; // m/s to mph
            } else if (calculatedSpeed > 0) {
              rawSpeed = calculatedSpeed;
            }
            // No mock speed - use 0 if GPS data is invalid
            // Note: In iOS Simulator, GPS speed is often null/0 - this is normal
            // Real device will show actual GPS speed when moving

            // Apply speed smoothing
            const newSpeedHistory = [...speedHistoryRef.current, rawSpeed].slice(-5); // Keep last 5 readings
            speedHistoryRef.current = newSpeedHistory;
            setSpeedHistory(newSpeedHistory);

            // Calculate average speed for smooth display
            const smoothedSpeed =
              newSpeedHistory.reduce((a, b) => a + b, 0) /
              newSpeedHistory.length;

            const currentAltitude = location.coords.altitude || 0;

            // Create enhanced location object with smoothed speed in MPH for rally navigator
            const enhancedLocation = {
              ...location,
              coords: {
                ...location.coords,
                altitude: currentAltitude,
              },
              enhancedSpeed: smoothedSpeed, // Pass speed in MPH directly
            };

            // Process GPS for navigation callouts
            const callouts =
              rallyNavigatorService.processGPSUpdate(enhancedLocation);
            if (callouts.length > 0) {
              console.log(
                "[Rally Navigator] New callouts:",
                callouts.map((c) => c.message),
              );
              setNavigationCallouts((prev) =>
                [...callouts, ...prev].slice(0, 10),
              );
            }

            const newRoutePoint: RoutePoint = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              altitude: currentAltitude,
              timestamp: Date.now(),
              speed: smoothedSpeed,
            };

            // Add route point to emergency SOS tracking
            EmergencySOS.addRoutePoint(location);

            setSpeed(smoothedSpeed);
            setAltitude(currentAltitude);

            return {
              ...prev,
              currentDistance: newDistance,
              locations: newLocations,
              route: [...prev.route, newRoutePoint],
              maxSpeed: Math.max(prev.maxSpeed, smoothedSpeed),
              maxAltitude: Math.max(prev.maxAltitude, currentAltitude),
              totalSpeed: prev.totalSpeed + smoothedSpeed,
              speedReadings: prev.speedReadings + 1,
            };
          });
        },
      );
    };

    if (Platform.OS !== "web") {
      startLocationTracking();
    }
  }, [isTracking]);

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
        totalSpeed: 0,
        speedReadings: 0,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "Could not get your location. Please enable location services.",
      );
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
      const { newBadges: earnedBadges, profile } = await storage.addTrailMiles(
        session.currentDistance,
      );
      setNewBadges(earnedBadges.map((b) => b.id));
    }

    // Show summary and badge unlock alerts
    const message = isPremium
      ? `You traveled ${session.currentDistance.toFixed(1)} miles on ${trail.name}${
          newBadges.length > 0
            ? `\n\n🏆 New badge${newBadges.length > 1 ? "s" : ""} unlocked!`
            : ""
        }\n\nAdventure saved to your profile and shared with the community!`
      : `You traveled ${session.currentDistance.toFixed(1)} miles on ${trail.name}\n\nAdventure shared with the community!\n\n🔒 Subscribe to save adventures to your profile and unlock badges!`;

    Alert.alert("Adventure Complete!", message, [
      {
        text: "Back",
        onPress: () => navigation.goBack(),
      },
      ...(!isPremium
        ? [
            {
              text: "Subscribe",
              onPress: () =>
                (navigation as any).navigate("ProfileTab", {
                  screen: "Subscription",
                }),
            },
          ]
        : []),
    ]);
  };

  const handleMarkHazard = async () => {
    if (!selectedHazardType || !session) {
      Alert.alert("Error", "Please select a hazard type");
      return;
    }

    // Validate input length
    if (hazardDescription.length > 500) {
      Alert.alert("Error", "Description must be less than 500 characters");
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const hazardType = HAZARD_TYPES.find((h) => h.id === selectedHazardType);

      // Sanitize description with comprehensive security measures
      const sanitizedDescription = hazardDescription
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
        .replace(/[<>\"'&]/g, "") // Remove HTML/JS special characters
        .replace(/javascript:/gi, "") // Remove JavaScript protocol
        .replace(/on\w+=/gi, "") // Remove event handlers
        .replace(/[\r\n]/g, " ") // Replace newlines with spaces
        .replace(/\s+/g, " ") // Normalize whitespace
        .substring(0, 500); // Ensure max length

      const newHazard: AdventureHazard = {
        id: `hazard_${Date.now()}`,
        type: hazardType?.label || "Unknown",
        description: sanitizedDescription || "No description provided",
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: Date.now(),
      };

      setSession({
        ...session,
        hazards: [...session.hazards, newHazard],
      });

      Alert.alert(
        "Hazard Marked",
        "Other users will be warned about this hazard.",
      );
      setShowHazardModal(false);
      setSelectedHazardType(null);
      setHazardDescription("");
    } catch (error) {
      Alert.alert("Error", "Could not get your location to mark hazard.");
    }
  };

  const handleRequestAssistance = async () => {
    if (!assistanceDescription.trim() || !session) {
      Alert.alert("Error", "Please describe what help you need");
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});

      // Sanitize description with same security measures as hazard descriptions
      const sanitizedDescription = assistanceDescription
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, "")
        .replace(/[<>\"'&]/g, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+=/gi, "")
        .replace(/[\r\n]/g, " ")
        .replace(/\s+/g, " ")
        .substring(0, 500);

      const newWaypoint: AssistanceWaypoint = {
        id: `assistance_${Date.now()}`,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        description: sanitizedDescription,
        timestamp: Date.now(),
        status: "active",
      };

      setSession({
        ...session,
        assistanceWaypoints: [...session.assistanceWaypoints, newWaypoint],
      });

      // Send location and route to emergency contacts
      await EmergencySOS.shareLocationWithRoute(
        `🆘 ASSISTANCE NEEDED: ${assistanceDescription.trim()}`,
        trail.name,
      );

      setShowAssistanceModal(false);
      setAssistanceDescription("");
    } catch (error) {
      console.error("[Emergency SOS] Error sending assistance request:", error);
      Alert.alert(
        "Error",
        "Could not send assistance request. Please try again.",
      );
    }
  };

  useEffect(() => {
    return () => {
      // Clear timeouts
      if (speedUpdateTimeoutRef.current) {
        clearTimeout(speedUpdateTimeoutRef.current);
        speedUpdateTimeoutRef.current = null;
      }
      if (altitudeUpdateTimeoutRef.current) {
        clearTimeout(altitudeUpdateTimeoutRef.current);
        altitudeUpdateTimeoutRef.current = null;
      }

      // Clear location subscription properly
      if (locationSubscriptionRef.current) {
        try {
          locationSubscriptionRef.current.remove();
        } catch (error) {
          console.error("[Location] Error removing subscription:", error);
        } finally {
          locationSubscriptionRef.current = null;
        }
      }

      // Stop emergency SOS tracking only if it was started
      if (sosTrackingStartedRef.current) {
        try {
          EmergencySOS.stopRouteTracking();
          sosTrackingStartedRef.current = false;
        } catch (error) {
          console.error(
            "[Emergency SOS] Error stopping route tracking:",
            error,
          );
        }
      }
    };
  }, []);

  const formatTime = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}:${(
      seconds % 60
    )
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const formatSpeed = useCallback((mph: number) => {
    return mph.toFixed(1);
  }, []);

  // Note: startAdventure is called in the initialization useEffect above.
  // Cleanup of location subscription and SOS tracking is handled in the cleanup useEffect.

  if (!session) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedText style={Typography.h3}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={28} color={theme.primary} />
          </Pressable>
          <ThemedText style={[Typography.h4, styles.headerTitle]}>
            {trail.name}
          </ThemedText>
          <Pressable onPress={() => setShowNavigator(!showNavigator)}>
            <Feather
              name={showNavigator ? "volume-2" : "volume-x"}
              size={24}
              color={theme.primary}
            />
          </Pressable>
        </View>

        {/* Rally Navigator Callouts */}
        {showNavigator && navigationCallouts.length > 0 && (
          <View
            style={[
              styles.navigatorPanel,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.navigatorHeader}>
              <Feather name="radio" size={20} color={theme.primary} />
              <ThemedText
                style={[
                  Typography.label,
                  { color: theme.primary, marginLeft: Spacing.xs },
                ]}
              >
                CO-DRIVER
              </ThemedText>
            </View>
            {navigationCallouts.slice(0, 3).map((callout) => (
              <View
                key={callout.id}
                style={[
                  styles.calloutItem,
                  {
                    backgroundColor:
                      callout.priority === "critical"
                        ? theme.error + "20"
                        : callout.priority === "high"
                          ? theme.warning + "20"
                          : theme.backgroundSecondary,
                    borderLeftColor:
                      callout.priority === "critical"
                        ? theme.error
                        : callout.priority === "high"
                          ? theme.warning
                          : theme.primary,
                  },
                ]}
              >
                <Feather
                  name={(callout.icon as any) || "navigation"}
                  size={18}
                  color={
                    callout.priority === "critical"
                      ? theme.error
                      : callout.priority === "high"
                        ? theme.warning
                        : theme.primary
                  }
                />
                <ThemedText
                  style={[
                    styles.calloutText,
                    {
                      color:
                        callout.priority === "critical"
                          ? theme.error
                          : callout.priority === "high"
                            ? theme.warning
                            : theme.text,
                      fontWeight:
                        callout.priority === "critical" ? "800" : "600",
                    },
                  ]}
                >
                  {callout.message}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Live Map View */}
        {showMap && MapView && session.locations.length > 0 && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.liveMap}
              initialRegion={{
                latitude:
                  session.locations[session.locations.length - 1].latitude,
                longitude:
                  session.locations[session.locations.length - 1].longitude,
                latitudeDelta: 0.002, // Zoomed in for better road visibility
                longitudeDelta: 0.002,
              }}
              showsUserLocation
              followsUserLocation
              showsMyLocationButton={false}
              showsCompass
              mapType="hybrid"
              camera={{
                center: {
                  latitude:
                    session.locations[session.locations.length - 1].latitude,
                  longitude:
                    session.locations[session.locations.length - 1].longitude,
                },
                heading:
                  session.locations[session.locations.length - 1].heading || 0,
                pitch: 45, // Tilt view for better 3D perspective of road
                zoom: 18,
                altitude: 100,
              }}
            >
              {/* Community Trail Routes - Past User Logs */}
              {communityTrails.map(
                (trail) =>
                  trail.route &&
                  trail.route.length > 1 && (
                    <Polyline
                      key={trail.id}
                      coordinates={trail.route.map((point: any) => ({
                        latitude: point.latitude,
                        longitude: point.longitude,
                      }))}
                      strokeColor="#888888"
                      strokeWidth={2}
                      lineDashPattern={[5, 5]}
                      opacity={0.4}
                    />
                  ),
              )}

              {/* Current Route Polyline */}
              {session.route.length > 1 && (
                <Polyline
                  coordinates={session.route.map((point) => ({
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }))}
                  strokeColor={theme.primary}
                  strokeWidth={4}
                />
              )}

              {/* Hazard Markers */}
              {session.hazards.map((hazard) => (
                <Marker
                  key={hazard.id}
                  coordinate={hazard.location}
                  title={hazard.type}
                  description={hazard.description}
                >
                  <View
                    style={[
                      styles.hazardMapMarker,
                      { backgroundColor: theme.warning },
                    ]}
                  >
                    <Feather name="alert-triangle" size={16} color="white" />
                  </View>
                </Marker>
              ))}

              {/* Assistance Waypoint Markers */}
              {session.assistanceWaypoints.map((waypoint) => (
                <Marker
                  key={waypoint.id}
                  coordinate={waypoint.location}
                  title="Assistance Request"
                  description={waypoint.description}
                >
                  <View
                    style={[
                      styles.assistanceMapMarker,
                      { backgroundColor: theme.error },
                    ]}
                  >
                    <Feather name="alert-circle" size={16} color="white" />
                  </View>
                </Marker>
              ))}
            </MapView>

            {/* Waze-style Trail Info Overlay */}
            <View
              style={[
                styles.trailInfoOverlay,
                { backgroundColor: theme.backgroundDefault + "F0" },
              ]}
            >
              <View style={styles.trailInfoRow}>
                <Feather name="navigation" size={16} color={theme.primary} />
                <ThemedText
                  style={[styles.trailInfoText, { color: theme.text }]}
                >
                  {session.currentDistance.toFixed(1)} mi • {formatSpeed(speed)}{" "}
                  mph
                </ThemedText>
              </View>
              {session.hazards.length > 0 && (
                <View
                  style={[
                    styles.trailAlertRow,
                    { backgroundColor: theme.warning + "20" },
                  ]}
                >
                  <Feather
                    name="alert-triangle"
                    size={14}
                    color={theme.warning}
                  />
                  <ThemedText
                    style={[styles.trailAlertText, { color: theme.warning }]}
                  >
                    {session.hazards.length} hazard
                    {session.hazards.length > 1 ? "s" : ""} ahead
                  </ThemedText>
                </View>
              )}
              {session.assistanceWaypoints.length > 0 && (
                <View
                  style={[
                    styles.trailAlertRow,
                    { backgroundColor: theme.error + "20" },
                  ]}
                >
                  <Feather name="alert-circle" size={14} color={theme.error} />
                  <ThemedText
                    style={[styles.trailAlertText, { color: theme.error }]}
                  >
                    {session.assistanceWaypoints.length} assistance request
                    {session.assistanceWaypoints.length > 1 ? "s" : ""}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Speedometer Card */}
        <View
          style={[
            styles.speedometerCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.speedometerHeader}>
            <Feather name="activity" size={24} color={theme.primary} />
            <ThemedText style={[Typography.h4, { marginLeft: Spacing.sm }]}>
              Speedometer
            </ThemedText>
          </View>

          {/* Current Speed - Large Display */}
          <View style={styles.currentSpeedDisplay}>
            <ThemedText
              style={[styles.currentSpeedValue, { color: theme.primary }]}
            >
              {speed.toFixed(1)}
            </ThemedText>
            <ThemedText
              style={[styles.currentSpeedUnit, { color: theme.tabIconDefault }]}
            >
              mph
            </ThemedText>
          </View>

          {/* Speed Stats Row */}
          <View style={styles.speedStatsRow}>
            <View style={styles.speedStat}>
              <ThemedText
                style={[styles.speedStatLabel, { color: theme.tabIconDefault }]}
              >
                Max
              </ThemedText>
              <ThemedText
                style={[styles.speedStatValue, { color: theme.warning }]}
              >
                {session.maxSpeed.toFixed(1)}
              </ThemedText>
              <ThemedText
                style={[styles.speedStatUnit, { color: theme.tabIconDefault }]}
              >
                mph
              </ThemedText>
            </View>

            <View style={styles.speedStatDivider} />

            <View style={styles.speedStat}>
              <ThemedText
                style={[styles.speedStatLabel, { color: theme.tabIconDefault }]}
              >
                Avg
              </ThemedText>
              <ThemedText
                style={[styles.speedStatValue, { color: theme.accent }]}
              >
                {session.speedReadings > 0
                  ? (session.totalSpeed / session.speedReadings).toFixed(1)
                  : "0.0"}
              </ThemedText>
              <ThemedText
                style={[styles.speedStatUnit, { color: theme.tabIconDefault }]}
              >
                mph
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Live Stats */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          {/* Distance */}
          <View style={styles.statBlock}>
            <Feather name="navigation" size={28} color={theme.primary} />
            <ThemedText style={[Typography.h3, styles.statValue]}>
              {session.currentDistance.toFixed(1)}
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.tabIconDefault }]}
            >
              miles
            </ThemedText>
          </View>

          {/* Time */}
          <View style={styles.statBlock}>
            <Feather name="clock" size={28} color={theme.accent} />
            <ThemedText style={[Typography.h3, styles.statValue]}>
              {formatTime(elapsedTime)}
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.tabIconDefault }]}
            >
              elapsed
            </ThemedText>
          </View>

          {/* Altitude */}
          <View style={styles.statBlock}>
            <Feather name="trending-up" size={28} color={theme.success} />
            <ThemedText style={[Typography.h3, styles.statValue]}>
              {altitude > 0 ? Math.round(altitude) : "--"}
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.tabIconDefault }]}
            >
              ft
            </ThemedText>
          </View>
        </View>

        {/* Trail Info */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <ThemedText style={[Typography.label, { fontWeight: "600" }]}>
                Expected Distance
              </ThemedText>
              <ThemedText
                style={[styles.infoValue, { color: theme.tabIconDefault }]}
              >
                {trail.distance.toFixed(1)} miles
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Feather name="trending-up" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <ThemedText style={[Typography.label, { fontWeight: "600" }]}>
                Difficulty
              </ThemedText>
              <ThemedText
                style={[styles.infoValue, { color: theme.tabIconDefault }]}
              >
                {trail.difficulty}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          <Pressable
            style={[
              styles.quickActionButton,
              {
                backgroundColor: theme.warning + "20",
                borderColor: theme.warning,
              },
            ]}
            onPress={() => setShowHazardModal(true)}
          >
            <Feather name="alert-triangle" size={24} color={theme.warning} />
            <ThemedText
              style={[styles.quickActionText, { color: theme.warning }]}
            >
              Mark Hazard
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.quickActionButton,
              { backgroundColor: theme.error + "20", borderColor: theme.error },
            ]}
            onPress={() => setShowAssistanceModal(true)}
          >
            <Feather name="alert-circle" size={24} color={theme.error} />
            <ThemedText
              style={[styles.quickActionText, { color: theme.error }]}
            >
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
                style={[
                  styles.button,
                  styles.pauseButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setIsTracking(false)}
              >
                <Feather name="pause" size={24} color={theme.tabIconDefault} />
                <ThemedText
                  style={[styles.buttonText, { color: theme.tabIconDefault }]}
                >
                  Pause
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.endButton,
                  { backgroundColor: theme.warning },
                ]}
                onPress={endAdventure}
              >
                <Feather
                  name="flag"
                  size={24}
                  color={theme.backgroundDefault}
                />
                <ThemedText
                  style={[
                    styles.buttonText,
                    { color: theme.backgroundDefault },
                  ]}
                >
                  End Adventure
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={[
                  styles.button,
                  styles.resumeButton,
                  { backgroundColor: theme.success },
                ]}
                onPress={() => setIsTracking(true)}
              >
                <Feather
                  name="play"
                  size={24}
                  color={theme.backgroundDefault}
                />
                <ThemedText
                  style={[
                    styles.buttonText,
                    { color: theme.backgroundDefault },
                  ]}
                >
                  Resume
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.endButton,
                  { backgroundColor: theme.error },
                ]}
                onPress={endAdventure}
              >
                <Feather name="x" size={24} color={theme.backgroundDefault} />
                <ThemedText
                  style={[
                    styles.buttonText,
                    { color: theme.backgroundDefault },
                  ]}
                >
                  Finish
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* Hazard Marking Modal */}
      <Modal
        visible={showHazardModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHazardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[Typography.h3, styles.modalTitle]}>
                Mark Hazard
              </ThemedText>
              <Pressable onPress={() => setShowHazardModal(false)}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            <ThemedText
              style={[styles.modalSubtitle, { color: theme.tabIconDefault }]}
            >
              Select the type of hazard you encountered:
            </ThemedText>

            <ScrollView
              style={styles.hazardList}
              showsVerticalScrollIndicator={false}
            >
              {HAZARD_TYPES.map((hazard) => (
                <Pressable
                  key={hazard.id}
                  style={[
                    styles.hazardOption,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor:
                        selectedHazardType === hazard.id
                          ? theme.warning
                          : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedHazardType(hazard.id)}
                >
                  <View
                    style={[
                      styles.hazardIcon,
                      {
                        backgroundColor:
                          selectedHazardType === hazard.id
                            ? theme.warning
                            : "transparent",
                      },
                    ]}
                  >
                    <Feather
                      name={hazard.icon as any}
                      size={24}
                      color={
                        selectedHazardType === hazard.id
                          ? "white"
                          : theme.warning
                      }
                    />
                  </View>
                  <ThemedText style={styles.hazardLabel}>
                    {hazard.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <TextInput
              style={[
                styles.descriptionInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Additional details (optional)..."
              placeholderTextColor={theme.tabIconDefault}
              value={hazardDescription}
              onChangeText={setHazardDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setShowHazardModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.warning,
                    opacity: selectedHazardType ? 1 : 0.5,
                  },
                ]}
                onPress={handleMarkHazard}
                disabled={!selectedHazardType}
              >
                <ThemedText
                  style={[styles.modalButtonText, { color: "white" }]}
                >
                  Mark Hazard
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assistance Request Modal */}
      <Modal
        visible={showAssistanceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssistanceModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[Typography.h3, styles.modalTitle]}>
                Request Assistance
              </ThemedText>
              <Pressable onPress={() => setShowAssistanceModal(false)}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            <ThemedText
              style={[styles.modalSubtitle, { color: theme.tabIconDefault }]}
            >
              Describe what help you need. Your location will be shared with
              nearby offroaders.
            </ThemedText>

            <TextInput
              style={[
                styles.assistanceInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g., Stuck in mud, need winch or tow strap..."
              placeholderTextColor={theme.tabIconDefault}
              value={assistanceDescription}
              onChangeText={setAssistanceDescription}
              multiline
              numberOfLines={5}
              autoFocus
            />

            <View
              style={[
                styles.warningBox,
                {
                  backgroundColor: theme.error + "15",
                  borderColor: theme.error,
                },
              ]}
            >
              <Feather name="alert-circle" size={20} color={theme.error} />
              <ThemedText style={[styles.warningText, { color: theme.error }]}>
                Only use this for genuine emergencies or when you need recovery
                assistance.
              </ThemedText>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setShowAssistanceModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.error,
                    opacity: assistanceDescription.trim() ? 1 : 0.5,
                  },
                ]}
                onPress={handleRequestAssistance}
                disabled={!assistanceDescription.trim()}
              >
                <ThemedText
                  style={[styles.modalButtonText, { color: "white" }]}
                >
                  Send Request
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}
