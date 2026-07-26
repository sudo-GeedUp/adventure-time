import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

export default function LiveMapScreen() {
  const { theme } = useTheme();

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <Feather
          name="navigation"
          size={64}
          color={theme.tabIconDefault}
          style={styles.icon}
        />
        <ThemedText style={[Typography.h3, styles.title]}>
          Live Map Unavailable
        </ThemedText>
        <ThemedText
          style={[Typography.body, styles.message, { color: theme.text }]}
        >
          Live GPS tracking and navigation are only available on iOS and Android
          devices.
          {"\n\n"}
          Download the mobile app to access real-time features.
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
