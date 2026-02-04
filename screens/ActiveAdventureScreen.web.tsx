import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

interface ActiveAdventureScreenWebProps {
  // No props currently used, but interface added for clarity
}

export default function ActiveAdventureScreen(_props: ActiveAdventureScreenWebProps) {
  const { theme } = useTheme();

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <Feather
          name="activity"
          size={64}
          color={theme.tabIconDefault}
          style={styles.icon}
        />
        <ThemedText style={[Typography.h3, styles.title]}>
          Active Adventure Tracking Unavailable
        </ThemedText>
        <ThemedText
          style={[Typography.body, styles.message, { color: theme.text }]}
        >
          Adventure tracking with GPS requires a mobile device.
          {"\n\n"}
          Use the iOS or Android app to track your adventures in real-time.
        </ThemedText>
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
  },
});
