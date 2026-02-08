import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage, StatusUpdate } from "@/utils/storage";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";

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
  const { theme } = useTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);

  useEffect(() => {
    loadFriendsData();
    loadStatusUpdates();
  }, []);

  const loadFriendsData = async () => {
    const friendsData = await storage.getFriendsData();
    setFriends(friendsData);
  };

  const loadStatusUpdates = async () => {
    const recentUpdates = await storage.getRecentUpdates(8);
    setUpdates(recentUpdates);
  };

  const addSampleFriends = async () => {
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
      <View
        style={[
          styles.updateCard,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
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
    <View
      style={[styles.friendCard, { backgroundColor: theme.backgroundDefault }]}
    >
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
                  style={[
                    Typography.small,
                    { color: theme.text, opacity: 0.7 },
                  ]}
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

  return (
    <ScreenScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }}>
      <View style={styles.header}>
        <View>
          <ThemedText style={[Typography.h3, { marginBottom: Spacing.xs }]}>
            Adventure Friends
          </ThemedText>
          <ThemedText style={[Typography.small, { color: theme.text }]}>
            {friends.length} friends online
          </ThemedText>
        </View>
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
            Add friends to see their adventures and locations
          </ThemedText>
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
