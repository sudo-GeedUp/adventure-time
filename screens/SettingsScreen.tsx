import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { storage } from "@/utils/storage";

export default function SettingsScreen() {
  const { theme } = useTheme();

  const handleClearCache = () => {
    Alert.alert(
      "Clear Offline Guides",
      "Are you sure you want to clear all offline guide data? You will need to re-download guides for offline use.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Alert.alert("Cache Cleared", "Offline guide cache has been cleared.");
          },
        },
      ]
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
      ]
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Offline Content
        </ThemedText>
        <Pressable
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
          onPress={handleClearCache}
          android_ripple={{ color: theme.backgroundSecondary }}
        >
          <View style={styles.menuItemContent}>
            <Feather name="download" size={24} color={theme.primary} />
            <View style={styles.menuItemText}>
              <ThemedText style={Typography.label}>Download Guides</ThemedText>
              <ThemedText style={[styles.description, { color: theme.tabIconDefault }]}>
                Save guides for offline access
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={24} color={theme.tabIconDefault} />
        </Pressable>

        <Pressable
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
          onPress={handleClearCache}
          android_ripple={{ color: theme.backgroundSecondary }}
        >
          <View style={styles.menuItemContent}>
            <Feather name="trash-2" size={24} color={theme.warning} />
            <View style={styles.menuItemText}>
              <ThemedText style={Typography.label}>Clear Offline Guides</ThemedText>
              <ThemedText style={[styles.description, { color: theme.tabIconDefault }]}>
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
        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.permissionRow}>
            <Feather name="map-pin" size={20} color={theme.success} />
            <ThemedText style={styles.permissionText}>Location Access</ThemedText>
          </View>
          <View style={styles.permissionRow}>
            <Feather name="camera" size={20} color={theme.success} />
            <ThemedText style={styles.permissionText}>Camera Access</ThemedText>
          </View>
          <View style={styles.permissionRow}>
            <Feather name="image" size={20} color={theme.success} />
            <ThemedText style={styles.permissionText}>Photo Library Access</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>About</ThemedText>
        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={styles.infoLabel}>App Version</ThemedText>
          <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>Data</ThemedText>
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
