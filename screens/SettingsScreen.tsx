import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { OfflineMapsManager } from "@/utils/offlineMaps";
import Constants from "expo-constants";

type PermissionState = "granted" | "denied" | "unknown";

export default function SettingsScreen() {
  const { theme } = useTheme();
  const appVersion = Constants.expoConfig?.version ?? "2.1.1";
  const buildNumber = Constants.expoConfig?.ios?.buildNumber;
  const versionText = buildNumber
    ? `${appVersion} (${buildNumber})`
    : appVersion;

  const [permissions, setPermissions] = useState<{
    location: PermissionState;
    camera: PermissionState;
    photos: PermissionState;
  }>({ location: "unknown", camera: "unknown", photos: "unknown" });

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const toState = (granted: boolean): PermissionState =>
        granted ? "granted" : "denied";

      (async () => {
        try {
          const [location, camera, photos] = await Promise.all([
            Location.getForegroundPermissionsAsync(),
            ImagePicker.getCameraPermissionsAsync(),
            ImagePicker.getMediaLibraryPermissionsAsync(),
          ]);
          if (!active) return;
          setPermissions({
            location: toState(location.granted),
            camera: toState(camera.granted),
            photos: toState(photos.granted),
          });
        } catch (error) {
          console.error("Error reading permission status:", error);
        }
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  const handleClearCache = () => {
    Alert.alert(
      "Clear Offline Cache",
      "This will remove cached trails, map tiles, and saved routes from this device. Your profile, saved guides, and scan history are not affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await OfflineMapsManager.clearAllCache();
              Alert.alert(
                "Cache Cleared",
                "Cached trails, map tiles, and saved routes have been removed.",
              );
            } catch (error) {
              console.error("Error clearing offline cache:", error);
              Alert.alert(
                "Couldn't Clear Cache",
                "Something went wrong clearing the offline cache. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete your profile, saved guides, scan history, and emergency contacts. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await storage.clearAll();
            Alert.alert("Data Cleared", "All app data has been deleted.");
          },
        },
      ],
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Offline Content
        </ThemedText>
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText
            style={[styles.description, { color: theme.tabIconDefault }]}
          >
            Recovery guides are bundled with the app and always available
            offline. Trails and map tiles are cached as you browse them.
          </ThemedText>
        </View>

        <Pressable
          style={[
            styles.menuItem,
            { backgroundColor: theme.backgroundDefault },
          ]}
          onPress={handleClearCache}
          android_ripple={{ color: theme.backgroundSecondary }}
        >
          <View style={styles.menuItemContent}>
            <Feather name="trash-2" size={24} color={theme.warning} />
            <View style={styles.menuItemText}>
              <ThemedText style={Typography.label}>
                Clear Offline Cache
              </ThemedText>
              <ThemedText
                style={[styles.description, { color: theme.tabIconDefault }]}
              >
                Free up storage space
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Permissions
        </ThemedText>
        <Pressable
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
          onPress={() => Linking.openSettings()}
          android_ripple={{ color: theme.backgroundSecondary }}
        >
          {(
            [
              { key: "location", icon: "map-pin", label: "Location Access" },
              { key: "camera", icon: "camera", label: "Camera Access" },
              { key: "photos", icon: "image", label: "Photo Library Access" },
            ] as const
          ).map(({ key, icon, label }) => {
            const state = permissions[key];
            const color =
              state === "granted"
                ? theme.success
                : state === "denied"
                  ? theme.warning
                  : theme.tabIconDefault;
            return (
              <View key={key} style={styles.permissionRow}>
                <Feather name={icon} size={20} color={color} />
                <ThemedText style={styles.permissionText}>{label}</ThemedText>
                <ThemedText style={[styles.permissionState, { color }]}>
                  {state === "granted"
                    ? "Allowed"
                    : state === "denied"
                      ? "Not allowed"
                      : "Checking..."}
                </ThemedText>
              </View>
            );
          })}
          <ThemedText
            style={[styles.description, { color: theme.tabIconDefault }]}
          >
            Tap to change these in system settings.
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          About
        </ThemedText>
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText style={styles.infoLabel}>App Version</ThemedText>
          <ThemedText style={styles.infoValue}>{versionText}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Data
        </ThemedText>
        <Pressable
          style={[styles.dangerButton, { borderColor: theme.error }]}
          onPress={handleClearData}
          android_ripple={{ color: theme.error + "20" }}
        >
          <Feather name="alert-triangle" size={24} color={theme.error} />
          <ThemedText style={[styles.dangerButtonText, { color: theme.error }]}>
            Clear All App Data
          </ThemedText>
        </Pressable>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minHeight: 72,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  description: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  permissionText: {
    marginLeft: Spacing.md,
    fontSize: 16,
    flex: 1,
  },
  permissionState: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  dangerButtonText: {
    marginLeft: Spacing.md,
    fontSize: 16,
    fontWeight: "700",
  },
});
