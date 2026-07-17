import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage, StatusUpdate } from "@/utils/storage";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { subscribeToFriends, saveFriendToFirebase } from "@/utils/firebaseHelpers";

let MapView: any = null;
let Marker: any = null;
let Circle: any = null;

// Only load maps on native platforms (iOS/Android)
if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    Circle = maps.Circle;
  } catch (e) {
    // Maps not available in this environment
  }
}

const INITIAL_REGION = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

interface Friend {
  id: string;
  name: string;
  vehicleType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  lastSeen: number;
  adventures: Adventure[];
}

interface Adventure {
  id: string;
  title: string;
  location: string;
  timestamp: number;
  difficulty: "Easy" | "Moderate" | "Hard";
}

export default function FriendsScreen() {
  const { theme, isDark } = useTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [mapView, setMapView] = useState(false);
  const [userLocation, setUserLocation] = useState(INITIAL_REGION);
  const [useFirebase, setUseFirebase] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const mapsAvailable = MapView !== null;

  useEffect(() => {
    loadFriendsData();
    loadStatusUpdates();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadFriendsData = async () => {
    // Try Firebase first, fallback to local storage
    try {
      const { getFirebaseServices } = require("@/config/firebase");
      const { db } = getFirebaseServices();
      if (db) {
        const { getCurrentUser } = require("@/utils/firebaseHelpers");
        const user = getCurrentUser();
        if (user) {
          const { subscribeToFriends } = require("@/utils/firebaseHelpers");
          const unsubscribeFn = subscribeToFriends(db, user.uid, (friendsData: Friend[]) => {
            setFriends(friendsData);
            setUseFirebase(true);
          });
          setUnsubscribe(() => unsubscribeFn);
          return;
        }
      }
    } catch (e) {
      // Firebase not available
    }
    // Fallback to local storage
    const friendsData = await storage.getFriendsData();
    setFriends(friendsData);
  };

  const loadStatusUpdates = async () => {
    const recentUpdates = await storage.getRecentUpdates(8);
    setUpdates(recentUpdates);
  };

  const addSampleFriends = async () => {
    if (!useFirebase) {
      Alert.alert(
        "Firebase Not Configured",
        "Add your Firebase credentials to .env to enable real-time friends. For now, using local storage.",
        [{ text: "OK" }]
      );
    }
    const sampleFriends: Friend[] = [
      {
        id: "friend_1",
        name: "Alex Mountain",
        vehicleType: "Jeep Wrangler",
        location: { latitude: 40.75, longitude: -73.98 },
        lastSeen: Date.now() - 10 * 60 * 1000,
        adventures: [
          {
            id: "adv_1",
            title: "Rocky trail recovery",
            location: "Bear Mountain",
            timestamp: Date.now() - 30 * 60 * 1000,
            difficulty: "Hard",
          },
          {
            id: "adv_2",
            title: "Sand dune exploration",
            location: "Desert Valley",
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
            difficulty: "Moderate",
          },
        ],
      },
      {
        id: "friend_2",
        name: "Jordan Trail",
        vehicleType: "Ford F-150",
        location: { latitude: 40.73, longitude: -74.01 },
        lastSeen: Date.now() - 5 * 60 * 1000,
        adventures: [
          {
            id: "adv_3",
            title: "Mud pit rescue",
            location: "Swamp Creek",
            timestamp: Date.now() - 1 * 60 * 60 * 1000,
            difficulty: "Hard",
          },
        ],
      },
      {
        id: "friend_3",
        name: "Casey Off-Road",
        vehicleType: "Toyota 4Runner",
        location: { latitude: 40.72, longitude: -74.02 },
        lastSeen: Date.now() - 15 * 60 * 1000,
        adventures: [
          {
            id: "adv_4",
            title: "Rock crawling adventure",
            location: "Stone Valley",
            timestamp: Date.now() - 45 * 60 * 1000,
            difficulty: "Hard",
          },
        ],
      },
    ];

    // Using local storage for friends data
    await storage.saveFriendsData(sampleFriends);
    setFriends(sampleFriends);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return theme.success;
      case "Moderate":
        return theme.warning;
      case "Hard":
        return theme.error;
      default:
        return theme.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "mobile":
        return { icon: "check-circle", color: theme.success };
      case "recovering":
        return { icon: "refresh-cw", color: theme.warning };
      case "stuck":
        return { icon: "alert-circle", color: theme.error };
      default:
        return { icon: "info", color: theme.primary };
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const StatusUpdateCard = ({ update }: { update: StatusUpdate }) => {
    const { icon, color } = getStatusIcon(update.status);
    return (
      <View style={[styles.updateCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.updateIcon, { backgroundColor: color + "20" }]}>
          <Feather name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.updateContent}>
          <ThemedText style={[Typography.small, { fontWeight: "600" }]}>
            {update.userName}
          </ThemedText>
          <ThemedText
            style={[
              Typography.small,
              {
                color: theme.tabIconDefault,
                textTransform: "capitalize",
                marginTop: Spacing.xs,
              },
            ]}
          >
            {update.status === "mobile"
              ? "is mobile again"
              : update.status === "recovering"
              ? "is recovering"
              : "is stuck"}
            {update.location ? ` • ${update.location}` : ""}
          </ThemedText>
        </View>
        <ThemedText style={[Typography.small, { color: theme.tabIconDefault }]}>
          {formatTime(update.timestamp)}
        </ThemedText>
      </View>
    );
  };

  const FriendCard = ({ friend }: { friend: Friend }) => (
    <View style={[styles.friendCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.friendHeader}>
        <View style={styles.friendInfo}>
          <ThemedText style={[Typography.h4, { marginBottom: Spacing.xs }]}>
            {friend.name}
          </ThemedText>
          <ThemedText style={[Typography.small, { color: theme.text }]}>
            {friend.vehicleType}
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: theme.success + "20" },
          ]}
        >
          <Feather name="map-pin" size={14} color={theme.success} />
          <ThemedText style={[Typography.small, { color: theme.success }]}>
            Online
          </ThemedText>
        </View>
      </View>

      {friend.adventures.length > 0 && (
        <View style={{ marginTop: Spacing.md }}>
          <ThemedText style={[Typography.label, { marginBottom: Spacing.sm }]}>
            Recent Adventures
          </ThemedText>
          {friend.adventures.map((adventure) => (
            <View
              key={adventure.id}
              style={[
                styles.adventureItem,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <View style={styles.adventureContent}>
                <ThemedText style={Typography.small}>
                  {adventure.title}
                </ThemedText>
                <ThemedText
                  style={[Typography.small, { color: theme.text, opacity: 0.7 }]}
                >
                  {adventure.location}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(adventure.difficulty) },
                ]}
              >
                <ThemedText
                  style={[
                    Typography.small,
                    { color: "#fff", fontWeight: "600" },
                  ]}
                >
                  {adventure.difficulty}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (mapView && mapsAvailable) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={userLocation}
          showsUserLocation
        >
          <Circle
            center={userLocation}
            radius={16090}
            strokeColor={theme.primary}
            strokeWidth={2}
            fillColor={theme.primary + "15"}
          />

          {friends.map((friend) => (
            <Marker
              key={friend.id}
              coordinate={friend.location}
              title={friend.name}
              description={friend.vehicleType}
              pinColor={theme.accent}
            />
          ))}
        </MapView>

        <Pressable
          onPress={() => setMapView(false)}
          style={[
            styles.viewToggle,
            { backgroundColor: theme.primary, bottom: Spacing.xl },
          ]}
        >
          <Feather name="list" size={20} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenScrollView
      contentContainerStyle={{ paddingBottom: Spacing.xl }}
    >
      <View style={styles.header}>
        <View>
          <ThemedText style={[Typography.h3, { marginBottom: Spacing.xs }]}>
            Adventure Friends
          </ThemedText>
          <ThemedText style={[Typography.small, { color: theme.text }]}>
            {friends.length} friends online
          </ThemedText>
        </View>
        {mapsAvailable && (
          <Pressable
            onPress={() => setMapView(true)}
            style={[
              styles.mapButton,
              { backgroundColor: theme.primary },
            ]}
          >
            <Feather name="map" size={18} color="#fff" />
          </Pressable>
        )}
      </View>

      {updates.length > 0 && (
        <View style={styles.updatesSection}>
          <ThemedText style={[Typography.h4, styles.sectionTitle]}>
            Recent Updates
          </ThemedText>
          {updates.map((update) => (
            <StatusUpdateCard key={update.id} update={update} />
          ))}
        </View>
      )}

      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather
            name="users"
            size={48}
            color={theme.tabIconDefault}
            style={{ marginBottom: Spacing.lg }}
          />
          <ThemedText style={[Typography.h4, { marginBottom: Spacing.sm }]}>
            No Friends Yet
          </ThemedText>
          <ThemedText
            style={[
              Typography.small,
              { textAlign: "center", color: theme.text },
            ]}
          >
            {useFirebase
              ? "Waiting for friends to connect..."
              : "Add friends to see their adventures and locations"}
          </ThemedText>
          {!useFirebase && (
            <Pressable
              onPress={addSampleFriends}
              style={[
                styles.addFriendsButton,
                { backgroundColor: theme.primary },
              ]}
            >
              <ThemedText style={[Typography.button, { color: "#fff" }]}>
                Add Sample Friends
              </ThemedText>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FriendCard friend={item} />}
          contentContainerStyle={{ gap: Spacing.lg }}
        />
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  updatesSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  updateCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  updateIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  updateContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  viewToggle: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  friendCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  friendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  friendInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  adventureItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  adventureContent: {
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing.lg,
  },
  addFriendsButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
});
