import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import ThemedText from "@/components/ThemedText";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { GuideCategory } from "@/data/guides";

interface CategoryCardProps {
  category: GuideCategory;
  onPress: () => void;
}

export default function CategoryCard({ category, onPress }: CategoryCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
      onPress={onPress}
      android_ripple={{ color: theme.backgroundSecondary }}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name={category.icon as any} size={32} color={theme.primary} />
      </View>
      <View style={styles.content}>
        <ThemedText style={[styles.title, Typography.h4]}>{category.title}</ThemedText>
        <ThemedText style={[styles.count, Typography.small, { color: theme.tabIconDefault }]}>
          {category.guideCount} guide{category.guideCount !== 1 ? "s" : ""}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={24} color={theme.tabIconDefault} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minHeight: 80,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  count: {},
});
