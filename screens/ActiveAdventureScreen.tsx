import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  FlatList,
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
  CompletedAdventure,
} from "@/utils/storage";
import { MapLayerType, getTileSource } from "@/utils/mapTiles";
import { OfflineMapsManager } from "@/utils/offlineMaps";
import { gpxRecorder } from "@/utils/gpxRecording";
import * as Location from "expo-location";
import { calculateDistance } from "@/utils/location";
import { getWeather } from "@/utils/weather";
import { WeatherCondition } from "@/utils/conditions";
import {
  snapToRoute,
  isOffRoute,
  getNextTurn,
  NavPoint,
} from "@/utils/routeNavigation";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { hapticFeedback } from "@/utils/haptics";
import { Trail } from "@/utils/trails";
import {
  FirebaseLocationService,
  isFirebaseAvailable,
  CommunityAdventuresService,
} from "@/utils/firebase";
import {
  rallyNavigatorService,
  NavigationCallout,
} from "@/services/rallyNavigatorService";
import { EmergencySOS } from "@/utils/emergencySOS";
import { analyticsService } from "@/services/analyticsService";

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let UrlTile: any = null;

if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    UrlTile = maps.UrlTile;
  } catch {
    console.log("Maps not available");
  }
}

type ActiveAdventureScreenRouteProp = RouteProp<any, "ActiveAdventure">;

interface AdventureSession {
  startLocation: { latitude: number; longitude: number };
  currentDistance: number;
  startTime: number;
  // Location tracking with optional heading for map camera orientation
  locations: {
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
  }[];
  route: RoutePoint[];
  hazards: AdventureHazard[];
  assistanceWaypoints: AssistanceWaypoint[];
  maxSpeed: number;
  maxAltitude: number;
  totalSpeed: number;
  speedReadings: number;
}

const METERS_PER_SECOND_TO_MPH = 2.237;
const MAX_REASONABLE_SPEED_MPS = 55;
const WEATHER_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const WEATHER_LOCATION_POLL_INTERVAL_MS = 5000;

interface TrackingLifecycle {
  cancelled: boolean;
  adventureStarted: boolean;
  sosStartPromise: Promise<void> | null;
  broadcastStartPromise: Promise<void> | null;
  stopPromise: Promise<void> | null;
}

function isValidCoordinate(point: any): point is NavPoint {
  return (
    point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
  );
}

function toPolylineCoordinates(points: any[], maxPoints = 500) {
  const validPoints = points.filter(isValidCoordinate);
  if (validPoints.length <= maxPoints) {
    return validPoints.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));
  }

  const step = Math.ceil((validPoints.length - 1) / (maxPoints - 1));
  const sampledPoints = validPoints.filter(
    (_, index) =>
      index === 0 || index === validPoints.length - 1 || index % step === 0,
  );
  return sampledPoints.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));
}

function sanitizeDescription(value: string, maxLength = 500) {
  return value.replace(/[<>]/g, "").trim().slice(0, maxLength);
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
  mapLayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  mapLayerButton: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  mapLayerButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectRouteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  selectRouteText: {
    fontSize: 13,
    fontWeight: "600",
  },
  routeList: {
    maxHeight: 300,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  routeItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  routeItemSource: {
    fontSize: 12,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  snappedLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "white",
  },
  wazeContainer: {
    flex: 1,
  },
  wazeMap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  wazeHeader: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  wazeHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  wazeHeaderTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
  },
  wazeSpeedBadge: {
    position: "absolute",
    right: Spacing.md,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  wazeSpeedValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 30,
  },
  wazeSpeedUnit: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  wazeWeatherBadge: {
    position: "absolute",
    right: Spacing.md + 80,
    width: 88,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    paddingHorizontal: Spacing.xs,
  },
  wazeWeatherValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 23,
  },
  wazeWeatherCondition: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    maxWidth: 76,
  },
  wazeBottomCard: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.75)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  wazeTurnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  wazeTurnDistance: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginLeft: Spacing.md,
  },
  wazeTurnLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: Spacing.md,
    flex: 1,
  },
  wazeRouteInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  wazeRouteInfoText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  wazeActionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  wazeActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  wazeActionText: {
    fontWeight: "700",
    fontSize: 13,
  },
});

export default function ActiveAdventureScreen() {
  const route = useRoute<ActiveAdventureScreenRouteProp>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isPremium } = useSubscription();
  const insets = useSafeAreaInsets();
  const trail = useMemo<Trail>(
    () => (route.params as any)?.trail || ({ name: "Unknown Trail" } as Trail),
    [route],
  );

  const targetRouteFromParams = useMemo(() => {
    const params = route.params as any;
    const completed = params?.completedAdventure as
      | CompletedAdventure
      | undefined;
    const completedRoute = completed?.route?.filter(isValidCoordinate) || [];
    if (completedRoute.length > 1) {
      return completedRoute;
    }
    const routeData = params?.targetRoute as any[] | undefined;
    const targetRoute = routeData?.filter(isValidCoordinate) || [];
    if (targetRoute.length > 1) {
      return targetRoute;
    }
    return null;
  }, [route]);

  const [selectedRoute, setSelectedRoute] = useState<any[] | null>(
    targetRouteFromParams,
  );
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [routesForSelection, setRoutesForSelection] = useState<
    {
      id: string;
      title: string;
      source: "community" | "gpx";
      route: any[];
      timestamp: number;
    }[]
  >([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  const targetRoutePolyline = useMemo(() => {
    if (!selectedRoute || selectedRoute.length < 2) return null;
    return toPolylineCoordinates(selectedRoute);
  }, [selectedRoute]);

  const screenActiveRef = useRef(true);
  const routeLoadRequestRef = useRef(0);

  const loadRoutesForSelection = useCallback(async () => {
    const requestId = ++routeLoadRequestRef.current;
    setIsLoadingRoutes(true);
    try {
      const [adventures, gpxTracks] = await Promise.all([
        storage.getCommunityAdventures(),
        gpxRecorder.getAllTracks(),
      ]);

      const communityRoutes = adventures
        .map((adv) => ({
          ...adv,
          route: adv.route?.filter(isValidCoordinate) || [],
        }))
        .filter((adv) => adv.route.length > 1)
        .map((adv) => ({
          id: `community-${adv.id}`,
          title: adv.title || adv.trailName || "Recorded Adventure",
          source: "community" as const,
          route: adv.route,
          timestamp: adv.endTime || adv.startTime || 0,
        }));

      const gpxRoutes = gpxTracks
        .map((track) => ({
          ...track,
          trackPoints: track.trackPoints?.filter(isValidCoordinate) || [],
        }))
        .filter((track) => track.trackPoints.length > 1)
        .map((track) => ({
          id: `gpx-${track.id}`,
          title: track.name || "Imported GPX Track",
          source: "gpx" as const,
          route: track.trackPoints,
          timestamp: track.endTime || track.startTime || 0,
        }));

      const allRoutes = [...communityRoutes, ...gpxRoutes].sort(
        (a, b) => b.timestamp - a.timestamp,
      );

      if (
        !screenActiveRef.current ||
        requestId !== routeLoadRequestRef.current
      ) {
        return;
      }
      setRoutesForSelection(allRoutes);
    } catch (error) {
      console.error("Error loading routes for selection:", error);
      if (
        screenActiveRef.current &&
        requestId === routeLoadRequestRef.current
      ) {
        Alert.alert("Error", "Could not load routes.");
      }
    } finally {
      if (
        screenActiveRef.current &&
        requestId === routeLoadRequestRef.current
      ) {
        setIsLoadingRoutes(false);
      }
    }
  }, []);

  const openRouteSelector = () => {
    loadRoutesForSelection();
    setShowRouteSelector(true);
  };

  const handleSelectRoute = (routeItem: (typeof routesForSelection)[0]) => {
    const validRoute = routeItem.route.filter(isValidCoordinate);
    if (validRoute.length < 2) {
      return;
    }

    setSelectedRoute(validRoute);
    setShowRouteSelector(false);

    // Cache the selected route for offline navigation
    OfflineMapsManager.cacheSelectedRoute(
      validRoute,
      routeItem.title,
      routeItem.source,
      routeItem.id,
    );
  };

  const [snappedLocation, setSnappedLocation] = useState<NavPoint | null>(null);
  const [navigationProgress, setNavigationProgress] = useState<{
    traveled: number;
    remaining: number;
    total: number;
  } | null>(null);
  const [offRouteAlert, setOffRouteAlert] = useState(false);
  const [nextTurn, setNextTurn] = useState<{
    distance: number;
    direction: "left" | "right";
  } | null>(null);

  const [session, setSession] = useState<AdventureSession | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [showHazardModal, setShowHazardModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [selectedHazardType, setSelectedHazardType] = useState<string | null>(
    null,
  );
  const [hazardDescription, setHazardDescription] = useState("");
  const [assistanceDescription, setAssistanceDescription] = useState("");
  const [showMap] = useState(true);
  const [mapLayer, setMapLayer] = useState<MapLayerType>("default");
  const [navigationCallouts, setNavigationCallouts] = useState<
    NavigationCallout[]
  >([]);
  const [showNavigator, setShowNavigator] = useState(true);
  const [communityTrails, setCommunityTrails] = useState<any[]>([]);

  const sessionRef = useRef<AdventureSession | null>(null);
  const selectedRouteRef = useRef(selectedRoute);
  const speedHistoryRef = useRef<number[]>([]);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const lifecycleRef = useRef<TrackingLifecycle | null>(null);
  const tileSource = useMemo(
    () => getTileSource(mapLayer, isPremium),
    [mapLayer, isPremium],
  );
  const communityTrailPolylines = useMemo(
    () =>
      communityTrails
        .map((communityTrail) => ({
          id: communityTrail.id,
          coordinates: toPolylineCoordinates(communityTrail.route || []),
        }))
        .filter((communityTrail) => communityTrail.coordinates.length > 1),
    [communityTrails],
  );
  const currentRoutePolyline = useMemo(
    () => toPolylineCoordinates(session?.route || []),
    [session?.route],
  );
  const mapRef = React.useRef<any>(null);
  const trailRef = useRef(trail);
  const weatherAttemptedRef = useRef(false);
  const weatherRequestRef = useRef(0);

  const recenterMap = useCallback(() => {
    const currentLocation = session?.locations[session.locations.length - 1];
    if (!currentLocation || !mapRef.current) return;

    mapRef.current.animateCamera(
      {
        center: snappedLocation || {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        heading: currentLocation.heading || 0,
        pitch: 45,
        zoom: 18,
        altitude: 100,
      },
      { duration: 500 },
    );
  }, [session, snappedLocation]);

  useEffect(() => {
    screenActiveRef.current = true;
    return () => {
      screenActiveRef.current = false;
      routeLoadRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    selectedRouteRef.current = selectedRoute;
  }, [selectedRoute]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    trailRef.current = trail;
  }, [trail]);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async (forceRefresh = false) => {
      if (
        cancelled ||
        !screenActiveRef.current ||
        (!forceRefresh && weatherAttemptedRef.current)
      ) {
        return;
      }

      const currentLocation =
        sessionRef.current?.locations[sessionRef.current.locations.length - 1];
      if (!currentLocation) return;

      if (!forceRefresh) {
        weatherAttemptedRef.current = true;
      }

      const requestId = ++weatherRequestRef.current;
      const currentWeather = await getWeather(
        currentLocation.latitude,
        currentLocation.longitude,
      );

      if (
        cancelled ||
        !screenActiveRef.current ||
        requestId !== weatherRequestRef.current
      ) {
        return;
      }

      setWeather(currentWeather);
    };

    void loadWeather();
    const locationPoll = setInterval(() => {
      void loadWeather();
    }, WEATHER_LOCATION_POLL_INTERVAL_MS);
    const weatherRefresh = setInterval(() => {
      void loadWeather(true);
    }, WEATHER_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      weatherRequestRef.current += 1;
      clearInterval(locationPoll);
      clearInterval(weatherRefresh);
    };
  }, []);

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

  const stopTrackingServices = useCallback((lifecycle: TrackingLifecycle) => {
    if (lifecycle.stopPromise) {
      return lifecycle.stopPromise;
    }

    lifecycle.cancelled = true;
    lifecycle.stopPromise = (async () => {
      if (lifecycle.broadcastStartPromise) {
        await lifecycle.broadcastStartPromise.catch((error) => {
          console.error("Error starting location broadcast:", error);
        });
      }
      FirebaseLocationService.stopLocationBroadcast();

      if (lifecycle.sosStartPromise) {
        await lifecycle.sosStartPromise.catch((error) => {
          console.error("Error starting SOS route tracking:", error);
        });
      }
      await EmergencySOS.stopRouteTracking();
    })();

    return lifecycle.stopPromise;
  }, []);

  const startAdventure = useCallback(async (lifecycle: TrackingLifecycle) => {
    if (lifecycle.adventureStarted) return;
    lifecycle.adventureStarted = true;
    const currentTrail = trailRef.current;

    try {
      const location = await Location.getCurrentPositionAsync({});
      hapticFeedback.medium();
      if (
        !Number.isFinite(location.coords.latitude) ||
        !Number.isFinite(location.coords.longitude)
      ) {
        throw new Error("Invalid initial location");
      }
      const initialAltitude = location.coords.altitude || 0;
      const userProfile = await storage.getUserProfile();
      if (lifecycle.cancelled || !screenActiveRef.current) return;

      const initialGpsSpeed = location.coords.speed;
      const initialSpeedMps =
        typeof initialGpsSpeed === "number" &&
        Number.isFinite(initialGpsSpeed) &&
        initialGpsSpeed >= 0
          ? initialGpsSpeed
          : 0;
      const initialSession: AdventureSession = {
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
            speed: initialSpeedMps * METERS_PER_SECOND_TO_MPH,
          },
        ],
        hazards: [],
        assistanceWaypoints: [],
        maxSpeed: 0,
        maxAltitude: initialAltitude,
        totalSpeed: 0,
        speedReadings: 0,
      };

      setAltitude(initialAltitude);
      sessionRef.current = initialSession;
      setSession(initialSession);

      // Start broadcasting location so other users can see this offroader
      const broadcastStart = FirebaseLocationService.startLocationBroadcast(
        userProfile?.id || "anonymous",
      );
      lifecycle.broadcastStartPromise = broadcastStart;
      broadcastStart.catch((error) => {
        console.error("Error starting location broadcast:", error);
      });

      analyticsService.logAdventureStart(
        currentTrail.id || currentTrail.name || "unknown",
        currentTrail.name || "Unknown Trail",
        currentTrail.difficulty || "Moderate",
      );
    } catch {
      hapticFeedback.error();
      if (!lifecycle.cancelled && screenActiveRef.current) {
        Alert.alert(
          "Error",
          "Could not get your location. Please enable location services.",
        );
      }
    }
  }, []);

  // Load community trail data
  const loadCommunityTrails = useCallback(async () => {
    try {
      const adventures = await storage.getCommunityAdventures();
      // Get recent adventures with routes near current location
      const recentTrails = adventures
        .map((adv: any) => ({
          ...adv,
          route: adv.route?.filter(isValidCoordinate) || [],
        }))
        .filter((adv: any) => adv.route.length > 0)
        .slice(0, 20); // Show last 20 community trails
      if (!screenActiveRef.current) return;
      setCommunityTrails(recentTrails);
      console.log(
        "[Community Data] Loaded",
        recentTrails.length,
        "trails from past users",
      );
    } catch (error) {
      console.error("[Community Data] Error loading trails:", error);
    }
  }, []);

  // Restore the last cached route when no route was passed via navigation
  useEffect(() => {
    if (targetRouteFromParams) return;

    const restoreCachedRoute = async () => {
      try {
        const cached = await OfflineMapsManager.getCachedSelectedRoute();
        const cachedRoute = cached?.route?.filter(isValidCoordinate) || [];
        if (screenActiveRef.current && cachedRoute.length > 1) {
          setSelectedRoute(cachedRoute);
        }
      } catch (error) {
        if (screenActiveRef.current) {
          console.error("Error restoring cached route:", error);
        }
      }
    };

    restoreCachedRoute();
  }, [targetRouteFromParams]);

  // Cache the selected route whenever it changes (including routes passed via navigation)
  useEffect(() => {
    if (!selectedRoute || selectedRoute.length < 2) return;

    const navParams = route.params as any;
    const completedAdventure = navParams?.completedAdventure as
      | CompletedAdventure
      | undefined;
    if (completedAdventure?.route === selectedRoute) {
      OfflineMapsManager.cacheSelectedRoute(
        selectedRoute,
        completedAdventure.title ||
          completedAdventure.trailName ||
          "Community Route",
        "community",
        completedAdventure.id,
      );
      return;
    }

    const targetRoute = navParams?.targetRoute as any[] | undefined;
    if (targetRoute === selectedRoute && trail?.name) {
      OfflineMapsManager.cacheSelectedRoute(
        selectedRoute,
        trail.name,
        "gpx",
        trail.id,
      );
    }
  }, [selectedRoute, route, trail]);

  // Initialize adventure session
  useEffect(() => {
    const previousLifecycle = lifecycleRef.current;
    const lifecycle: TrackingLifecycle = {
      cancelled: false,
      adventureStarted: false,
      sosStartPromise: null,
      broadcastStartPromise: null,
      stopPromise: null,
    };
    lifecycleRef.current = lifecycle;

    const currentTrail = trailRef.current;
    const initializeLifecycle = async () => {
      if (previousLifecycle?.stopPromise) {
        await previousLifecycle.stopPromise;
      }
      if (lifecycle.cancelled || !screenActiveRef.current) return;

      void startAdventure(lifecycle);
      loadCommunityTrails();
      // Initialize rally navigator with trail data
      console.log(
        "[Rally Navigator] Initializing with trail:",
        currentTrail.name,
      );
      rallyNavigatorService.initialize(
        currentTrail,
        [],
        [], // Hazards will be added dynamically during the adventure
      );
      console.log("[Rally Navigator] Initialized successfully");

      // Show initial welcome callout
      const welcomeCallout: NavigationCallout = {
        id: `welcome-${Date.now()}`,
        type: "info",
        message: `🏁 Adventure started on ${currentTrail.name}! Stay safe and have fun!`,
        priority: "medium",
        timestamp: Date.now(),
        icon: "flag",
      };
      setNavigationCallouts([welcomeCallout]);

      // Start route tracking for emergency contact feature
      const sosStart = EmergencySOS.startRouteTracking();
      lifecycle.sosStartPromise = sosStart;
      sosStart.catch((error) => {
        console.error("Error starting SOS route tracking:", error);
      });
      console.log("[Emergency SOS] Route tracking started");
    };

    void initializeLifecycle();

    return () => {
      lifecycle.cancelled = true;
      void stopTrackingServices(lifecycle);
    };
  }, [loadCommunityTrails, startAdventure, stopTrackingServices]);

  // Update elapsed time every second
  useEffect(() => {
    if (!isTracking || !session) return;
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - session.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTracking, session]);

  // Track location for the duration of the adventure
  useEffect(() => {
    if (!isTracking) return;
    let cancelled = false;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled || !screenActiveRef.current) return;

        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Location permission is needed to track your adventure",
          );
          setIsTracking(false);
          return;
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location) => {
            if (cancelled || !screenActiveRef.current) return;

            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: Date.now(),
            };
            if (!isValidCoordinate(newLocation)) return;

            const previousSession = sessionRef.current;
            if (!previousSession) return;

            const route = (selectedRouteRef.current || []).filter(
              isValidCoordinate,
            );
            if (route.length > 1) {
              const snap = snapToRoute(newLocation, route);
              if (snap) {
                setSnappedLocation(snap.snappedPoint);
                setNavigationProgress({
                  traveled: snap.distanceTraveledMiles,
                  remaining: snap.distanceRemainingMiles,
                  total: snap.totalRouteDistanceMiles,
                });
                setOffRouteAlert(isOffRoute(snap));
                const turn = getNextTurn(
                  route,
                  snap.segmentIndex,
                  snap.segmentProgress,
                );
                setNextTurn(
                  turn
                    ? { distance: turn.distance, direction: turn.direction }
                    : null,
                );
              }
            } else {
              setSnappedLocation(null);
              setNavigationProgress(null);
              setOffRouteAlert(false);
              setNextTurn(null);
            }

            // Calculate distance from last location
            const lastLocation =
              previousSession.locations[previousSession.locations.length - 1];
            const addedDistance = lastLocation
              ? calculateDistance(lastLocation, newLocation)
              : 0;
            const timeDiff = lastLocation
              ? (newLocation.timestamp - lastLocation.timestamp) / 1000
              : 0;

            // GPS and fallback speeds are kept in meters per second.
            const gpsSpeed = location.coords.speed;
            const calculatedSpeedMps =
              timeDiff > 0 && addedDistance > 0
                ? (addedDistance * 1609.344) / timeDiff
                : 0;
            const candidateSpeedMps =
              typeof gpsSpeed === "number" &&
              Number.isFinite(gpsSpeed) &&
              gpsSpeed >= 0
                ? gpsSpeed
                : calculatedSpeedMps;
            const hasValidSpeed =
              Number.isFinite(candidateSpeedMps) &&
              candidateSpeedMps >= 0 &&
              candidateSpeedMps <= MAX_REASONABLE_SPEED_MPS;

            // Discard invalid or implausible readings instead of poisoning the
            // smoothing window.
            const newSpeedHistory = hasValidSpeed
              ? [...speedHistoryRef.current, candidateSpeedMps].slice(-5)
              : speedHistoryRef.current;
            speedHistoryRef.current = newSpeedHistory;

            const smoothedSpeedMps =
              newSpeedHistory.length > 0
                ? newSpeedHistory.reduce((a, b) => a + b, 0) /
                  newSpeedHistory.length
                : 0;
            const smoothedSpeedMph =
              smoothedSpeedMps * METERS_PER_SECOND_TO_MPH;
            const currentAltitude = location.coords.altitude || 0;

            // Rally navigation and persisted adventure statistics use MPH.
            const enhancedLocation = {
              ...location,
              coords: {
                ...location.coords,
                altitude: currentAltitude,
              },
              enhancedSpeed: smoothedSpeedMph,
            };
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
              timestamp: newLocation.timestamp,
              speed: smoothedSpeedMph,
            };

            // EmergencySOS stores the raw GPS speed in meters per second.
            void EmergencySOS.addRoutePoint(location);

            setSpeed(smoothedSpeedMps);
            setAltitude(currentAltitude);

            const nextSession: AdventureSession = {
              ...previousSession,
              currentDistance: previousSession.currentDistance + addedDistance,
              locations: [...previousSession.locations, newLocation],
              route: [...previousSession.route, newRoutePoint],
              maxSpeed: Math.max(previousSession.maxSpeed, smoothedSpeedMph),
              maxAltitude: Math.max(
                previousSession.maxAltitude,
                currentAltitude,
              ),
              totalSpeed: previousSession.totalSpeed + smoothedSpeedMph,
              speedReadings: previousSession.speedReadings + 1,
            };
            sessionRef.current = nextSession;
            setSession((currentSession) => {
              if (!currentSession) return currentSession;
              return nextSession;
            });
          },
        );

        if (cancelled || !screenActiveRef.current) {
          subscription.remove();
          return;
        }
        locationSubscriptionRef.current = subscription;
      } catch (error) {
        if (!cancelled && screenActiveRef.current) {
          console.error("Error starting location tracking:", error);
          setIsTracking(false);
        }
      }
    };

    if (Platform.OS !== "web") {
      void startLocationTracking();
    }

    return () => {
      cancelled = true;
      const subscription = locationSubscriptionRef.current;
      locationSubscriptionRef.current = null;
      subscription?.remove();
    };
  }, [isTracking]);

  const endAdventure = useCallback(async () => {
    if (!session) return;

    setIsTracking(false);
    const lifecycle = lifecycleRef.current;
    if (lifecycle) {
      await stopTrackingServices(lifecycle);
    }

    // Get user profile for community adventure
    const userProfile = await storage.getUserProfile();
    if (!screenActiveRef.current) return;

    // Save completed adventure to community database
    const completedAdventure: CompletedAdventure = {
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
    } as CompletedAdventure;

    await storage.saveCompletedAdventure(completedAdventure);
    if (!screenActiveRef.current) return;

    analyticsService.logAdventureComplete(
      completedAdventure.id,
      Date.now() - session.startTime,
      session.currentDistance,
    );

    // Only save to profile if premium
    let earnedBadgeIds: string[] = [];
    if (isPremium) {
      // Log miles to profile
      const { newBadges: earnedBadges } = await storage.addTrailMiles(
        session.currentDistance,
      );
      earnedBadgeIds = earnedBadges.map((b) => b.id);
    }

    const showSummary = (isPublic: boolean = false) => {
      if (!screenActiveRef.current) return;
      const publicText = isPublic ? "\n\n🌎 Shared with the community!" : "";
      const message = isPremium
        ? `You traveled ${session.currentDistance.toFixed(1)} miles on ${trail.name}${
            earnedBadgeIds.length > 0
              ? `\n\n🏆 New badge${
                  earnedBadgeIds.length > 1 ? "s" : ""
                } unlocked!`
              : ""
          }${publicText}\n\nAdventure saved to your profile!`
        : `You traveled ${session.currentDistance.toFixed(1)} miles on ${trail.name}${publicText}\n\n🔒 Subscribe to save adventures to your profile and unlock badges!`;

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

    // Ask the user to make this completed drive public
    if (isFirebaseAvailable()) {
      Alert.alert(
        "Make this trail public?",
        "Share your completed drive so other users can see it under nearby trails.",
        [
          {
            text: "Keep private",
            style: "cancel",
            onPress: () => showSummary(false),
          },
          {
            text: "Make public",
            onPress: async () => {
              try {
                await CommunityAdventuresService.publishAdventure(
                  completedAdventure,
                );
                if (screenActiveRef.current) {
                  showSummary(true);
                }
              } catch (error) {
                console.error("Error publishing adventure:", error);
                if (screenActiveRef.current) {
                  Alert.alert(
                    "Error",
                    "Could not share trail. It was still saved locally.",
                  );
                  showSummary(false);
                }
              }
            },
          },
        ],
      );
    } else {
      showSummary(false);
    }
  }, [isPremium, navigation, session, stopTrackingServices, trail]);

  const handleMarkHazard = async () => {
    if (!selectedHazardType || !session) {
      Alert.alert("Error", "Please select a hazard type");
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const hazardType = HAZARD_TYPES.find((h) => h.id === selectedHazardType);

      const newHazard: AdventureHazard = {
        id: `hazard_${Date.now()}`,
        type: hazardType?.label || "Unknown",
        description:
          sanitizeDescription(hazardDescription) || "No description provided",
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
    } catch {
      Alert.alert("Error", "Could not get your location to mark hazard.");
    }
  };

  const handleRequestAssistance = async () => {
    if (!assistanceDescription.trim() || !session) {
      hapticFeedback.error();
      Alert.alert("Error", "Please describe what help you need");
      return;
    }

    hapticFeedback.heavy();

    try {
      const location = await Location.getCurrentPositionAsync({});

      const newWaypoint: AssistanceWaypoint = {
        id: `assistance_${Date.now()}`,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        description: sanitizeDescription(assistanceDescription),
        timestamp: Date.now(),
        status: "active",
      };

      setSession({
        ...session,
        assistanceWaypoints: [...session.assistanceWaypoints, newWaypoint],
      });

      // Send location and route to emergency contacts
      await EmergencySOS.shareLocationWithRoute(
        `🆘 ASSISTANCE NEEDED: ${sanitizeDescription(assistanceDescription)}`,
        trail.name,
      );

      setShowAssistanceModal(false);
      setAssistanceDescription("");
      hapticFeedback.success();
    } catch (error) {
      console.error("[Emergency SOS] Error sending assistance request:", error);
      hapticFeedback.error();
      Alert.alert(
        "Error",
        "Could not send assistance request. Please try again.",
      );
    }
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

  const formatSpeed = (metersPerSecond: number) => {
    const mph = metersPerSecond * METERS_PER_SECOND_TO_MPH;
    return mph.toFixed(1);
  };

  if (!session) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedText style={Typography.h3}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const renderWazeContent = () => {
    const currentLocation = session.locations[session.locations.length - 1];
    const turnIcon = nextTurn
      ? nextTurn.direction === "left"
        ? "corner-up-left"
        : "corner-up-right"
      : "navigation";

    return (
      <View style={styles.wazeContainer}>
        <MapView
          ref={mapRef}
          style={styles.wazeMap}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
          showsUserLocation={!selectedRoute}
          followsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic
          showsBuildings
          mapType={mapLayer === "default" ? "hybrid" : "standard"}
        >
          {tileSource && UrlTile && (
            <UrlTile
              urlTemplate={tileSource.url}
              maximumZ={tileSource.maxZoom ?? 18}
              flipY={tileSource.flipY ?? false}
              zIndex={1}
            />
          )}

          {targetRoutePolyline && targetRoutePolyline.length > 1 && (
            <Polyline
              coordinates={targetRoutePolyline}
              strokeColor={theme.accent}
              strokeWidth={5}
            />
          )}

          {selectedRoute && snappedLocation && (
            <Marker coordinate={snappedLocation}>
              <View
                style={[
                  styles.snappedLocationMarker,
                  { backgroundColor: theme.primary },
                ]}
              />
            </Marker>
          )}

          {communityTrailPolylines.map((communityTrail) => (
            <Polyline
              key={communityTrail.id}
              coordinates={communityTrail.coordinates}
              strokeColor="#888888"
              strokeWidth={2}
              lineDashPattern={[5, 5]}
              opacity={0.4}
            />
          ))}

          {currentRoutePolyline.length > 1 && (
            <Polyline
              coordinates={currentRoutePolyline}
              strokeColor={theme.primary}
              strokeWidth={4}
            />
          )}

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

        <View style={[styles.wazeHeader, { top: insets.top + Spacing.md }]}>
          <Pressable
            style={styles.wazeHeaderButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={24} color="#fff" />
          </Pressable>
          <ThemedText style={[Typography.h4, styles.wazeHeaderTitle]}>
            {trail.name}
          </ThemedText>
          <View style={{ flexDirection: "row", gap: Spacing.xs }}>
            <Pressable
              style={styles.wazeHeaderButton}
              onPress={recenterMap}
              accessibilityLabel="Recenter map"
            >
              <Feather name="crosshair" size={20} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.wazeHeaderButton}
              onPress={() => setShowNavigator(!showNavigator)}
              accessibilityLabel="Toggle navigator"
            >
              <Feather
                name={showNavigator ? "volume-2" : "volume-x"}
                size={20}
                color="#fff"
              />
            </Pressable>
          </View>
        </View>

        <View
          style={[styles.wazeSpeedBadge, { top: insets.top + Spacing.md + 60 }]}
        >
          <ThemedText style={styles.wazeSpeedValue}>
            {formatSpeed(speed)}
          </ThemedText>
          <ThemedText style={styles.wazeSpeedUnit}>mph</ThemedText>
        </View>

        <View
          style={[
            styles.wazeWeatherBadge,
            { top: insets.top + Spacing.md + 60 },
          ]}
        >
          <Feather name="cloud" size={14} color="#fff" />
          <ThemedText style={styles.wazeWeatherValue}>
            {weather ? `${weather.temperature}°` : "--"}
          </ThemedText>
          <ThemedText style={styles.wazeWeatherCondition} numberOfLines={1}>
            {weather?.condition || "Weather"}
          </ThemedText>
        </View>

        {showNavigator && navigationCallouts.length > 0 && (
          <View
            style={[
              styles.wazeHeader,
              {
                top: insets.top + Spacing.md + 140,
                backgroundColor: theme.backgroundDefault + "E0",
              },
            ]}
          >
            {navigationCallouts.slice(0, 1).map((callout) => (
              <View
                key={callout.id}
                style={{ flexDirection: "row", alignItems: "center" }}
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
                  style={{
                    marginLeft: Spacing.xs,
                    color: theme.text,
                    fontWeight: "700",
                    flex: 1,
                    fontSize: 14,
                  }}
                >
                  {callout.message}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        <View
          style={[
            styles.wazeBottomCard,
            { backgroundColor: theme.backgroundDefault + "E0" },
          ]}
        >
          <View style={styles.mapLayerRow}>
            {(["default", "satellite", "topo"] as MapLayerType[]).map(
              (layer) => (
                <Pressable
                  key={layer}
                  style={[
                    styles.mapLayerButton,
                    mapLayer === layer && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                  onPress={() => setMapLayer(layer)}
                >
                  <ThemedText
                    style={[
                      styles.mapLayerButtonText,
                      { color: mapLayer === layer ? "white" : theme.text },
                    ]}
                  >
                    {layer === "default"
                      ? "Default"
                      : layer === "satellite"
                        ? "Sat"
                        : "Topo"}
                  </ThemedText>
                </Pressable>
              ),
            )}
          </View>

          <Pressable
            style={styles.selectRouteButton}
            onPress={openRouteSelector}
          >
            <Feather name="map" size={16} color={theme.primary} />
            <ThemedText style={[styles.selectRouteText, { color: theme.text }]}>
              {selectedRoute ? "Change Target Route" : "Select Target Route"}
            </ThemedText>
          </Pressable>

          {offRouteAlert && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: Spacing.sm,
                padding: Spacing.sm,
                borderRadius: BorderRadius.sm,
                backgroundColor: theme.error + "20",
              }}
            >
              <Feather name="alert-circle" size={14} color={theme.error} />
              <ThemedText
                style={{
                  color: theme.error,
                  marginLeft: Spacing.xs,
                  fontWeight: "700",
                }}
              >
                Off route — return to target route
              </ThemedText>
            </View>
          )}

          {nextTurn ? (
            <View style={styles.wazeTurnRow}>
              <Feather name={turnIcon as any} size={36} color="#fff" />
              <ThemedText style={styles.wazeTurnDistance}>
                {nextTurn.distance.toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.wazeTurnLabel}>
                mi{"\n"}Turn {nextTurn.direction}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.wazeTurnRow}>
              <Feather name="navigation" size={36} color="#fff" />
              <ThemedText style={styles.wazeTurnLabel}>
                Follow the route
              </ThemedText>
            </View>
          )}

          <View style={styles.wazeRouteInfo}>
            <ThemedText style={styles.wazeRouteInfoText}>
              {navigationProgress
                ? `${navigationProgress.remaining.toFixed(1)} / ${navigationProgress.total.toFixed(1)} mi remaining`
                : `${session.currentDistance.toFixed(1)} mi traveled`}
            </ThemedText>
            <ThemedText style={styles.wazeRouteInfoText}>
              {formatTime(elapsedTime)} elapsed
            </ThemedText>
          </View>

          <View style={styles.wazeActionRow}>
            <Pressable
              style={[
                styles.wazeActionButton,
                {
                  backgroundColor: theme.warning + "20",
                  borderWidth: 1,
                  borderColor: theme.warning,
                },
              ]}
              onPress={() => setShowHazardModal(true)}
            >
              <Feather name="alert-triangle" size={18} color={theme.warning} />
              <ThemedText
                style={[styles.wazeActionText, { color: theme.warning }]}
              >
                Hazard
              </ThemedText>
            </Pressable>

            {isTracking ? (
              <Pressable
                style={[
                  styles.wazeActionButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setIsTracking(false)}
              >
                <Feather name="pause" size={18} color={theme.text} />
                <ThemedText
                  style={[styles.wazeActionText, { color: theme.text }]}
                >
                  Pause
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.wazeActionButton,
                  { backgroundColor: theme.success },
                ]}
                onPress={() => setIsTracking(true)}
              >
                <Feather name="play" size={18} color="#fff" />
                <ThemedText style={[styles.wazeActionText, { color: "#fff" }]}>
                  Resume
                </ThemedText>
              </Pressable>
            )}
          </View>

          <View style={[styles.wazeActionRow, { marginTop: Spacing.md }]}>
            <Pressable
              style={[
                styles.wazeActionButton,
                {
                  backgroundColor: theme.error + "20",
                  borderWidth: 1,
                  borderColor: theme.error,
                },
              ]}
              onPress={() => setShowAssistanceModal(true)}
            >
              <Feather name="alert-circle" size={18} color={theme.error} />
              <ThemedText
                style={[styles.wazeActionText, { color: theme.error }]}
              >
                Help
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.wazeActionButton,
                { backgroundColor: theme.warning },
              ]}
              onPress={endAdventure}
            >
              <Feather name="flag" size={18} color="#fff" />
              <ThemedText style={[styles.wazeActionText, { color: "#fff" }]}>
                End
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {session.locations.length > 0 && MapView && Marker && Polyline ? (
        renderWazeContent()
      ) : (
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
                showsUserLocation={!selectedRoute}
                followsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass
                mapType={mapLayer === "default" ? "hybrid" : "standard"}
              >
                {tileSource && UrlTile && (
                  <UrlTile
                    urlTemplate={tileSource.url}
                    maximumZ={tileSource.maxZoom ?? 18}
                    flipY={tileSource.flipY ?? false}
                    zIndex={1}
                  />
                )}

                {/* Target Route Polyline */}
                {targetRoutePolyline && targetRoutePolyline.length > 1 && (
                  <Polyline
                    coordinates={targetRoutePolyline}
                    strokeColor={theme.accent}
                    strokeWidth={5}
                  />
                )}

                {/* Snapped Location Marker */}
                {selectedRoute && snappedLocation && (
                  <Marker coordinate={snappedLocation}>
                    <View
                      style={[
                        styles.snappedLocationMarker,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  </Marker>
                )}

                {/* Community Trail Routes - Past User Logs */}
                {communityTrailPolylines.map((communityTrail) => (
                  <Polyline
                    key={communityTrail.id}
                    coordinates={communityTrail.coordinates}
                    strokeColor="#888888"
                    strokeWidth={2}
                    lineDashPattern={[5, 5]}
                    opacity={0.4}
                  />
                ))}

                {/* Current Route Polyline */}
                {currentRoutePolyline.length > 1 && (
                  <Polyline
                    coordinates={currentRoutePolyline}
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
                <View style={styles.mapLayerRow}>
                  {(["default", "satellite", "topo"] as MapLayerType[]).map(
                    (layer) => (
                      <Pressable
                        key={layer}
                        style={[
                          styles.mapLayerButton,
                          mapLayer === layer && {
                            backgroundColor: theme.primary,
                          },
                        ]}
                        onPress={() => setMapLayer(layer)}
                      >
                        <ThemedText
                          style={[
                            styles.mapLayerButtonText,
                            {
                              color: mapLayer === layer ? "white" : theme.text,
                            },
                          ]}
                        >
                          {layer === "default"
                            ? "Default"
                            : layer === "satellite"
                              ? "Sat"
                              : "Topo"}
                        </ThemedText>
                      </Pressable>
                    ),
                  )}
                </View>

                <Pressable
                  style={styles.selectRouteButton}
                  onPress={openRouteSelector}
                >
                  <Feather name="map" size={16} color={theme.primary} />
                  <ThemedText
                    style={[styles.selectRouteText, { color: theme.text }]}
                  >
                    {selectedRoute
                      ? "Change Target Route"
                      : "Select Target Route"}
                  </ThemedText>
                </Pressable>

                {navigationProgress && (
                  <View style={styles.trailInfoRow}>
                    <Feather name="activity" size={16} color={theme.primary} />
                    <ThemedText
                      style={[styles.trailInfoText, { color: theme.text }]}
                    >
                      {navigationProgress.traveled.toFixed(1)} /{" "}
                      {navigationProgress.total.toFixed(1)} mi
                    </ThemedText>
                  </View>
                )}

                {nextTurn && (
                  <View style={styles.trailInfoRow}>
                    <Feather
                      name="corner-up-left"
                      size={16}
                      color={theme.primary}
                    />
                    <ThemedText
                      style={[styles.trailInfoText, { color: theme.text }]}
                    >
                      Turn {nextTurn.direction} in{" "}
                      {nextTurn.distance.toFixed(1)} mi
                    </ThemedText>
                  </View>
                )}

                {offRouteAlert && (
                  <View
                    style={[
                      styles.trailAlertRow,
                      { backgroundColor: theme.error + "20" },
                    ]}
                  >
                    <Feather
                      name="alert-circle"
                      size={14}
                      color={theme.error}
                    />
                    <ThemedText
                      style={[styles.trailAlertText, { color: theme.error }]}
                    >
                      Off route — return to target route
                    </ThemedText>
                  </View>
                )}

                <View style={styles.trailInfoRow}>
                  <Feather name="navigation" size={16} color={theme.primary} />
                  <ThemedText
                    style={[styles.trailInfoText, { color: theme.text }]}
                  >
                    {session.currentDistance.toFixed(1)} mi •{" "}
                    {formatSpeed(speed)} mph
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
                    <Feather
                      name="alert-circle"
                      size={14}
                      color={theme.error}
                    />
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
                {formatSpeed(speed)}
              </ThemedText>
              <ThemedText
                style={[
                  styles.currentSpeedUnit,
                  { color: theme.tabIconDefault },
                ]}
              >
                mph
              </ThemedText>
            </View>

            {/* Speed Stats Row */}
            <View style={styles.speedStatsRow}>
              <View style={styles.speedStat}>
                <ThemedText
                  style={[
                    styles.speedStatLabel,
                    { color: theme.tabIconDefault },
                  ]}
                >
                  Max
                </ThemedText>
                <ThemedText
                  style={[styles.speedStatValue, { color: theme.warning }]}
                >
                  {session.maxSpeed.toFixed(1)}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.speedStatUnit,
                    { color: theme.tabIconDefault },
                  ]}
                >
                  mph
                </ThemedText>
              </View>

              <View style={styles.speedStatDivider} />

              <View style={styles.speedStat}>
                <ThemedText
                  style={[
                    styles.speedStatLabel,
                    { color: theme.tabIconDefault },
                  ]}
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
                  style={[
                    styles.speedStatUnit,
                    { color: theme.tabIconDefault },
                  ]}
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

            {/* Weather */}
            <View style={styles.statBlock}>
              <Feather name="cloud" size={28} color={theme.accent} />
              <ThemedText style={[Typography.h3, styles.statValue]}>
                {weather ? `${weather.temperature}°` : "--"}
              </ThemedText>
              <ThemedText
                style={[styles.statLabel, { color: theme.tabIconDefault }]}
                numberOfLines={1}
              >
                {weather?.condition || "weather"}
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
                {
                  backgroundColor: theme.error + "20",
                  borderColor: theme.error,
                },
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
                  <Feather
                    name="pause"
                    size={24}
                    color={theme.tabIconDefault}
                  />
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
      )}

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
              onChangeText={(text) =>
                setHazardDescription(sanitizeDescription(text))
              }
              multiline
              numberOfLines={3}
              maxLength={500}
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
              onChangeText={(text) =>
                setAssistanceDescription(sanitizeDescription(text))
              }
              multiline
              numberOfLines={5}
              maxLength={500}
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

      {/* Route Selector Modal */}
      <Modal
        visible={showRouteSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRouteSelector(false)}
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
                Select Target Route
              </ThemedText>
              <Pressable onPress={() => setShowRouteSelector(false)}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            {isLoadingRoutes ? (
              <ThemedText style={{ color: theme.tabIconDefault }}>
                Loading routes...
              </ThemedText>
            ) : routesForSelection.length === 0 ? (
              <ThemedText style={{ color: theme.tabIconDefault }}>
                No recorded adventures or GPX tracks found.
              </ThemedText>
            ) : (
              <FlatList
                data={routesForSelection}
                keyExtractor={(item) => item.id}
                style={styles.routeList}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.routeItem,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => handleSelectRoute(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={[styles.routeItemText, { color: theme.text }]}
                      >
                        {item.title}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.routeItemSource,
                          { color: theme.tabIconDefault },
                        ]}
                      >
                        {item.source === "community"
                          ? "Recorded Adventure"
                          : "Imported GPX"}
                      </ThemedText>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={theme.tabIconDefault}
                    />
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
