import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

export default function ExploreMapScreen() {
  const { theme } = useTheme();

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <Feather
          name="map"
          size={64}
          color={theme.tabIconDefault}
          style={styles.icon}
        />
        <ThemedText style={[Typography.h3, styles.title]}>
          Map View Unavailable
        </ThemedText>
        <ThemedText
          style={[Typography.body, styles.message, { color: theme.text }]}
        >
          Interactive maps are only available on iOS and Android devices.
          {"\n\n"}
          Please use the mobile app to access:
        </ThemedText>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Feather name="check" size={20} color={theme.primary} />
            <ThemedText style={[Typography.body, { marginLeft: Spacing.sm }]}>
              Live trail maps
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check" size={20} color={theme.primary} />
            <ThemedText style={[Typography.body, { marginLeft: Spacing.sm }]}>
              Nearby adventures
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check" size={20} color={theme.primary} />
            <ThemedText style={[Typography.body, { marginLeft: Spacing.sm }]}>
              Friend locations
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check" size={20} color={theme.primary} />
            <ThemedText style={[Typography.body, { marginLeft: Spacing.sm }]}>
              GPS navigation
            </ThemedText>
          </View>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  featureList: {
    alignSelf: "stretch",
    maxWidth: 400,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
});
