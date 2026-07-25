import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
}: ErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Feather
        name="alert-circle"
        size={48}
        color={theme.error}
        style={styles.icon}
      />
      <ThemedText style={[Typography.h4, { color: theme.text }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.message, { color: theme.tabIconDefault }]}>
        {message}
      </ThemedText>
      {onRetry && (
        <Pressable
          style={[styles.retryButton, { backgroundColor: theme.error }]}
          onPress={onRetry}
        >
          <Feather name="refresh-cw" size={16} color="white" />
          <ThemedText
            style={{
              color: "white",
              fontWeight: "600",
              marginLeft: Spacing.sm,
            }}
          >
            Try Again
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"] * 2,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    marginBottom: Spacing.lg,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
