import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import ThemedText from "@/components/ThemedText";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Guide } from "@/data/guides";

interface GuideListItemProps {
  guide: Guide;
  onPress: () => void;
  isSaved?: boolean;
}

export default function GuideListItem({ guide, onPress, isSaved }: GuideListItemProps) {
  const { theme } = useTheme();

  const difficultyColor =
    guide.difficulty === "Easy"
      ? theme.success
      : guide.difficulty === "Moderate"
      ? theme.warning
      : theme.error;

  return (
    <Pressable
      style={[styles.item, { backgroundColor: theme.backgroundDefault }]}
      onPress={onPress}
      android_ripple={{ color: theme.backgroundSecondary }}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, Typography.h4]}>{guide.title}</ThemedText>
          {isSaved ? (
            <Feather name="bookmark" size={20} color={theme.primary} />
          ) : null}
        </View>
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: difficultyColor + "20" }]}>
            <ThemedText style={[styles.badgeText, { color: difficultyColor }]}>
              {guide.difficulty}
            </ThemedText>
          </View>
          <ThemedText style={[styles.equipment, { color: theme.tabIconDefault }]}>
            {guide.equipment.length} items needed
          </ThemedText>
        </View>
      </View>
      <Feather name="chevron-right" size={24} color={theme.tabIconDefault} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minHeight: 80,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  title: {},
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  equipment: {
    fontSize: 14,
  },
});
