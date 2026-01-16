import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { storage, CommunityTip, UserProfile } from "@/utils/storage";
import { useSubscription } from "@/contexts/SubscriptionContext";

const CATEGORIES = [
  { id: "recovery", label: "Recovery", icon: "tool" },
  { id: "navigation", label: "Navigation", icon: "compass" },
  { id: "trail_condition", label: "Trail Conditions", icon: "map" },
  { id: "maintenance", label: "Maintenance", icon: "settings" },
  { id: "safety", label: "Safety", icon: "shield" },
] as const;

export default function CommunityTipsScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { isPremium } = useSubscription();
  const insets = useSafeAreaInsets();
  const [tips, setTips] = useState<CommunityTip[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CommunityTip["category"]>("recovery");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [includeLocation, setIncludeLocation] = useState(false);
  const [suggestedSpeed, setSuggestedSpeed] = useState("");

  useEffect(() => {
    loadTips();
  }, []);

  const loadTips = async () => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Viewing community tips and trail conditions is a premium feature. Subscribe to access this feature!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Subscribe", onPress: () => (navigation as any).navigate("ProfileTab", { screen: "Subscription" }) }
        ]
      );
      return;
    }

    const communityTips = await storage.getCommunityTips();
    setTips(communityTips);
  };

  const handleSubmitTip = async () => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Posting community tips and trail conditions is a premium feature. Subscribe to share your knowledge!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Subscribe", onPress: () => (navigation as any).navigate("ProfileTab", { screen: "Subscription" }) }
        ]
      );
      return;
    }

    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Please provide both a title and description");
      return;
    }

    const profile = await storage.getUserProfile();
    let location: CommunityTip["location"] | undefined;

    if (includeLocation) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({});
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
        } catch (error) {
          console.error("Error getting location:", error);
        }
      }
    }

    const speedValue = suggestedSpeed ? parseFloat(suggestedSpeed) : undefined;
    
    const newTip: CommunityTip = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      timestamp: Date.now(),
      location,
      author: {
        name: profile?.name || "Anonymous",
        vehicleType: profile?.vehicleType || "Offroader",
      },
      helpful: 0,
      suggestedSpeed: speedValue && speedValue > 0 ? speedValue : undefined,
    };

    await storage.saveCommunityTip(newTip);
    setTitle("");
    setDescription("");
    setIncludeLocation(false);
    setSuggestedSpeed("");
    setShowAddForm(false);
    loadTips();
    Alert.alert("Success", "Your tip has been shared with the community!");
  };

  const handleMarkHelpful = async (tipId: string) => {
    await storage.markTipAsHelpful(tipId);
    loadTips();
  };

  const renderTip = ({ item }: { item: CommunityTip }) => {
    const category = CATEGORIES.find((c) => c.id === item.category);
    const timeAgo = getTimeAgo(item.timestamp);

    return (
      <View style={[styles.tipCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.tipHeader}>
          <View style={styles.categoryBadge}>
            <Feather name={category?.icon as any} size={14} color={theme.primary} />
            <ThemedText style={styles.categoryText}>{category?.label}</ThemedText>
          </View>
          <ThemedText style={styles.timeText}>{timeAgo}</ThemedText>
        </View>

        <ThemedText style={[Typography.h4, styles.tipTitle]}>{item.title}</ThemedText>
        <ThemedText style={styles.tipDescription}>{item.description}</ThemedText>

        <View style={styles.tipFooter}>
          <View style={styles.authorInfo}>
            <Feather name="user" size={14} color={theme.tabIconDefault} />
            <ThemedText style={styles.authorText}>
              {item.author.name} ({item.author.vehicleType})
            </ThemedText>
          </View>
          {item.suggestedSpeed ? (
            <View style={[styles.speedBadge, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="navigation" size={14} color={theme.primary} />
              <ThemedText style={[styles.speedText, { color: theme.primary }]}>
                {item.suggestedSpeed} mph
              </ThemedText>
            </View>
          ) : null}
          {item.location ? (
            <View style={styles.locationBadge}>
              <Feather name="map-pin" size={14} color={theme.tabIconDefault} />
              <ThemedText style={styles.locationText}>Location included</ThemedText>
            </View>
          ) : null}
        </View>

        <Pressable
          style={[styles.helpfulButton, { borderColor: theme.border }]}
          onPress={() => handleMarkHelpful(item.id)}
        >
          <Feather
            name="thumbs-up"
            size={18}
            color={item.helpful > 0 ? theme.primary : theme.tabIconDefault}
          />
          <ThemedText style={styles.helpfulText}>
            Helpful ({item.helpful})
          </ThemedText>
        </Pressable>
      </View>
    );
  };

  const getTimeAgo = (timestamp: number): string => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (showAddForm) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          }}
        >
          <View style={styles.container}>
          <ThemedText style={[Typography.h3, styles.formTitle]}>Share a Tip</ThemedText>

          <View style={styles.section}>
            <ThemedText style={styles.label}>Category</ThemedText>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        selectedCategory === cat.id
                          ? theme.primary + "20"
                          : theme.backgroundDefault,
                      borderColor:
                        selectedCategory === cat.id ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.id as CommunityTip["category"])}
                >
                  <Feather
                    name={cat.icon as any}
                    size={18}
                    color={selectedCategory === cat.id ? theme.primary : theme.tabIconDefault}
                  />
                  <ThemedText
                    style={[
                      styles.categoryChipText,
                      { color: selectedCategory === cat.id ? theme.primary : theme.text },
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.label}>Title</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
              placeholder="Brief, descriptive title"
              placeholderTextColor={theme.tabIconDefault}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, color: theme.text },
              ]}
              placeholder="Share your tip or trail condition report in detail..."
              placeholderTextColor={theme.tabIconDefault}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.label}>Suggested Trail Speed (Optional)</ThemedText>
            <ThemedText style={[styles.speedHintText, { color: theme.tabIconDefault }]}>
              Help others know a safe speed for this area
            </ThemedText>
            <View style={styles.speedInputRow}>
              <Feather name="navigation" size={20} color={theme.primary} />
              <TextInput
                style={[
                  styles.speedFormInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g. 15"
                placeholderTextColor={theme.tabIconDefault}
                keyboardType="numeric"
                value={suggestedSpeed}
                onChangeText={setSuggestedSpeed}
                maxLength={3}
              />
              <ThemedText style={[styles.speedUnitText, { color: theme.tabIconDefault }]}>
                mph
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={styles.locationToggle}
            onPress={() => setIncludeLocation(!includeLocation)}
          >
            <View style={styles.locationToggleLeft}>
              <Feather name="map-pin" size={20} color={theme.tabIconDefault} />
              <ThemedText style={styles.locationToggleText}>Include current location</ThemedText>
            </View>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: includeLocation ? theme.primary : "transparent",
                  borderColor: includeLocation ? theme.primary : theme.border,
                },
              ]}
            >
              {includeLocation ? <Feather name="check" size={16} color="white" /> : null}
            </View>
          </Pressable>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => {
                setShowAddForm(false);
                setTitle("");
                setDescription("");
                setIncludeLocation(false);
                setSuggestedSpeed("");
              }}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmitTip}
            >
              <ThemedText style={styles.submitButtonText}>Share Tip</ThemedText>
            </Pressable>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <>
      <ScreenFlatList
        data={tips}
        keyExtractor={(item) => item.id}
        renderItem={renderTip}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={[Typography.h3, styles.headerTitle]}>Community Tips {!isPremium && "🔒"}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {isPremium 
                ? "Share recovery tips and trail conditions with fellow offroaders"
                : "Premium feature: Subscribe to view and share trail conditions"}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="message-square" size={48} color={theme.tabIconDefault} />
            <ThemedText style={styles.emptyText}>No community tips yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Be the first to share a recovery tip or trail condition!
            </ThemedText>
          </View>
        }
      />

      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: insets.bottom + Spacing.xl,
          },
        ]}
        onPress={() => setShowAddForm(true)}
      >
        <Feather name="plus" size={24} color="white" />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
  },
  headerTitle: {
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  tipCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  tipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
  },
  tipTitle: {
    marginBottom: Spacing.sm,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  tipFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  authorText: {
    fontSize: 12,
    opacity: 0.7,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.7,
  },
  speedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  speedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  speedHintText: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  speedInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  speedFormInput: {
    width: 80,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  speedUnitText: {
    fontSize: 16,
    fontWeight: "500",
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  helpfulText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"] * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: Spacing.sm,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  formTitle: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  locationToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  locationToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  locationToggleText: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {},
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
