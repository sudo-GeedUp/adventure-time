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

  useEffect(() => {
    loadScanHistory();
  }, []);

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
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "AI Recovery Analysis is a premium feature. Subscribe to unlock this and other premium features.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Subscribe", onPress: () => navigation.navigate("ProfileTab", { screen: "Subscription" }) }
        ]
      );
      return;
    }

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
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "AI Recovery Analysis is a premium feature. Subscribe to unlock this and other premium features.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Subscribe", onPress: () => navigation.navigate("ProfileTab", { screen: "Subscription" }) }
        ]
      );
      return;
    }

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
          AI Recovery Analysis {!isPremium && "🔒"}
        </ThemedText>
        <ThemedText style={[styles.emptyDescription, { color: theme.tabIconDefault }]}>
          {isPremium 
            ? "Take a photo of your vehicle's situation and get AI-powered recovery recommendations"
            : "Premium feature: Subscribe to unlock AI-powered recovery analysis and recommendations"}
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
});
