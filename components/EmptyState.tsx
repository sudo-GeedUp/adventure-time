import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Feather
        name={icon as any}
        size={48}
        color={theme.tabIconDefault}
        style={styles.icon}
      />
      <ThemedText style={[Typography.h4, { color: theme.text }]}>
        {title}
      </ThemedText>
      {description && (
        <ThemedText
          style={[styles.description, { color: theme.tabIconDefault }]}
        >
          {description}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={onAction}
        >
          <ThemedText style={{ color: "white", fontWeight: "600" }}>
            {actionLabel}
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
  description: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
