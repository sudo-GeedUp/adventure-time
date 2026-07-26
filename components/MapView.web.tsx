import React from "react";
import { View, StyleSheet } from "react-native";
import ThemedText from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";

// Mock MapView component for web
export default function MapView({ children, ...props }: any) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <ThemedText style={styles.text}>
        Map view is not available on web. Please use the iOS or Android app.
      </ThemedText>
    </View>
  );
}

export function Marker(props: any) {
  return null;
}

export function Circle(props: any) {
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    textAlign: "center",
  },
});
