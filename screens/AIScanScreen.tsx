import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AIScanStackParamList } from "@/navigation/AIScanStackNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { useSubscription } from "@/contexts/SubscriptionContext";

type AIScanScreenNavigationProp = NativeStackNavigationProp<AIScanStackParamList, "AIScan">;

export default function AIScanScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { isPremium } = useSubscription();
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [stuckOfTheWeek, setStuckOfTheWeek] = useState<any>(null);

  useEffect(() => {
    loadScanHistory();
    loadStuckOfTheWeek();
  }, []);

  const loadStuckOfTheWeek = async () => {
    try {
      const allScans = await storage.getCommunityScanSubmissions();
      if (allScans && allScans.length > 0) {
        // Sort by difficulty score (higher = more stuck)
        const sorted = allScans.sort((a: any, b: any) => (b.difficultyScore || 0) - (a.difficultyScore || 0));
        setStuckOfTheWeek(sorted[0]);
      }
    } catch (error) {
      console.error('Error loading stuck of the week:', error);
    }
  };

  const loadScanHistory = async () => {
    const history = await storage.getScanHistory();
    setScanHistory(history);
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos for analysis."
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    // TODO: Re-enable premium gate before launch
    // if (!isPremium) {
    //   Alert.alert(
    //     "Premium Feature",
    //     "AI Recovery Analysis is a premium feature. Subscribe to unlock this and other premium features.",
    //     [
    //       { text: "Cancel", style: "cancel" },
    //       { text: "Subscribe", onPress: () => (navigation as any).navigate("ProfileTab", { screen: "Subscription" }) }
    //     ]
    //   );
    //   return;
    // }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      navigation.navigate("AIResults", { imageUri: result.assets[0].uri });
    }
  };

  const handleUploadPhoto = async () => {
    // TODO: Re-enable premium gate before launch
    // if (!isPremium) {
    //   Alert.alert(
    //     "Premium Feature",
    //     "AI Recovery Analysis is a premium feature. Subscribe to unlock this and other premium features.",
    //     [
    //       { text: "Cancel", style: "cancel" },
    //       { text: "Subscribe", onPress: () => (navigation as any).navigate("ProfileTab", { screen: "Subscription" }) }
    //     ]
    //   );
    //   return;
    // }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      navigation.navigate("AIResults", { imageUri: result.assets[0].uri });
    }
  };

  const handleScanPress = (imageUri: string) => {
    navigation.navigate("AIResults", { imageUri });
  };

  return (
    <ScreenScrollView>
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Feather name="camera" size={64} color={theme.primary} />
        </View>
        <ThemedText style={[Typography.h3, styles.emptyTitle]}>
          AI Recovery Analysis
        </ThemedText>
        <ThemedText style={[styles.emptyDescription, { color: theme.tabIconDefault }]}>
          Take a photo of your vehicle's situation and get AI-powered recovery recommendations
        </ThemedText>
      </View>

      <Pressable
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        onPress={handleTakePhoto}
        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      >
        <Feather name="camera" size={24} color={theme.buttonText} />
        <ThemedText style={[Typography.button, { color: theme.buttonText, marginLeft: Spacing.md }]}>
          Take Photo
        </ThemedText>
      </Pressable>

      <Pressable
        style={[styles.secondaryButton, { borderColor: theme.border }]}
        onPress={handleUploadPhoto}
        android_ripple={{ color: theme.backgroundSecondary }}
      >
        <Feather name="image" size={24} color={theme.primary} />
        <ThemedText style={[Typography.button, { color: theme.primary, marginLeft: Spacing.md }]}>
          Upload from Gallery
        </ThemedText>
      </Pressable>

      <Pressable
        style={[styles.guidesButton, { backgroundColor: theme.accent }]}
        onPress={() => navigation.navigate("Guides")}
        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      >
        <Feather name="book-open" size={24} color="white" />
        <ThemedText style={[Typography.button, { color: "white", marginLeft: Spacing.md }]}>
          Recovery Guides
        </ThemedText>
      </Pressable>

      {stuckOfTheWeek && (
        <View style={[styles.stuckOfWeekCard, { backgroundColor: theme.warning + '15', borderColor: theme.warning }]}>
          <View style={styles.stuckHeader}>
            <Feather name="award" size={24} color={theme.warning} />
            <ThemedText style={[Typography.h4, styles.stuckTitle, { color: theme.warning }]}>
              🏆 Stuck of the Week
            </ThemedText>
          </View>
          <ThemedText style={[styles.stuckSubtitle, { color: theme.tabIconDefault }]}>
            The most challenging recovery situation this week
          </ThemedText>
          
          {stuckOfTheWeek.imageUri && (
            <Image 
              source={{ uri: stuckOfTheWeek.imageUri }} 
              style={styles.stuckImage}
              resizeMode="cover"
            />
          )}
          
          <View style={styles.stuckDetails}>
            <View style={styles.stuckMetaRow}>
              <View style={styles.stuckMetaItem}>
                <Feather name="alert-triangle" size={16} color={theme.error} />
                <ThemedText style={[styles.stuckMetaText, { color: theme.error }]}>
                  {stuckOfTheWeek.situationType || 'Extreme Situation'}
                </ThemedText>
              </View>
              <View style={styles.stuckMetaItem}>
                <Feather name="user" size={16} color={theme.tabIconDefault} />
                <ThemedText style={[styles.stuckMetaText, { color: theme.tabIconDefault }]}>
                  {stuckOfTheWeek.userName || 'Anonymous'}
                </ThemedText>
              </View>
            </View>
            
            {stuckOfTheWeek.description && (
              <ThemedText style={[styles.stuckDescription, { color: theme.text }]} numberOfLines={3}>
                {stuckOfTheWeek.description}
              </ThemedText>
            )}
            
            <View style={styles.stuckStats}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statLabel, { color: theme.tabIconDefault }]}>Difficulty</ThemedText>
                <View style={styles.difficultyBar}>
                  <View 
                    style={[
                      styles.difficultyFill, 
                      { 
                        backgroundColor: theme.error,
                        width: `${Math.min((stuckOfTheWeek.difficultyScore || 8) * 10, 100)}%`
                      }
                    ]} 
                  />
                </View>
                <ThemedText style={[styles.statValue, { color: theme.error }]}>
                  {stuckOfTheWeek.difficultyScore || 8}/10
                </ThemedText>
              </View>
              
              <View style={styles.statItem}>
                <ThemedText style={[styles.statLabel, { color: theme.tabIconDefault }]}>Community Votes</ThemedText>
                <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                  {stuckOfTheWeek.votes || 0} 👍
                </ThemedText>
              </View>
            </View>
          </View>
          
          <Pressable
            style={[styles.viewDetailsButton, { backgroundColor: theme.warning }]}
            onPress={() => handleScanPress(stuckOfTheWeek.imageUri)}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <ThemedText style={styles.viewDetailsText}>View Full Analysis</ThemedText>
            <Feather name="arrow-right" size={18} color="white" />
          </Pressable>
        </View>
      )}

      {scanHistory.length > 0 ? (
        <View style={styles.historySection}>
          <ThemedText style={[Typography.h4, styles.historyTitle]}>
            Recent Scans
          </ThemedText>
          {scanHistory.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.historyItem, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => handleScanPress(item.imageUri)}
              android_ripple={{ color: theme.backgroundSecondary }}
            >
              <Image source={{ uri: item.imageUri }} style={styles.historyThumbnail} />
              <View style={styles.historyContent}>
                <ThemedText style={styles.historyType}>{item.situationType}</ThemedText>
                <ThemedText style={[styles.historyTime, { color: theme.tabIconDefault }]}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={24} color={theme.tabIconDefault} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    marginVertical: Spacing["3xl"],
  },
  emptyIcon: {
    marginBottom: Spacing["2xl"],
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  emptyDescription: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: Spacing.xl,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  guidesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing["2xl"],
  },
  historySection: {
    marginTop: Spacing.xl,
  },
  historyTitle: {
    marginBottom: Spacing.lg,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  historyThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  historyTime: {
    fontSize: 14,
  },
  stuckOfWeekCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  stuckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  stuckTitle: {
    flex: 1,
  },
  stuckSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  stuckImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  stuckDetails: {
    gap: Spacing.md,
  },
  stuckMetaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stuckMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stuckMetaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stuckDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  stuckStats: {
    gap: Spacing.md,
  },
  statItem: {
    gap: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  difficultyBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  difficultyFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
