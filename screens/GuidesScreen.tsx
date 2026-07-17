import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import CategoryCard from "@/components/CategoryCard";
import GuideListItem from "@/components/GuideListItem";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { categories, guides, Guide } from "@/data/guides";
import { GuidesStackParamList } from "@/navigation/GuidesStackNavigator";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage } from "@/utils/storage";

type GuidesScreenNavigationProp = NativeStackNavigationProp<GuidesStackParamList, "Guides">;

export default function GuidesScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedGuides, setSavedGuides] = useState<string[]>([]);

  useEffect(() => {
    loadSavedGuides();
  }, []);

  const loadSavedGuides = async () => {
    const saved = await storage.getSavedGuides();
    setSavedGuides(saved);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleGuidePress = (guideId: string) => {
    navigation.navigate("GuideDetail", { guideId });
  };

  const filteredGuides = selectedCategory
    ? guides.filter((guide) => guide.category === selectedCategory)
    : guides;

  const searchedGuides = searchQuery
    ? filteredGuides.filter((guide) =>
        guide.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredGuides;

  return (
    <ScreenScrollView>
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="search" size={20} color={theme.tabIconDefault} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search guides..."
          placeholderTextColor={theme.tabIconDefault}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Pressable
        style={[styles.communityTipsCard, { backgroundColor: theme.primary + "15" }]}
        onPress={() => navigation.navigate("CommunityTips")}
      >
        <View style={styles.communityTipsContent}>
          <View style={[styles.communityTipsIcon, { backgroundColor: theme.primary }]}>
            <Feather name="users" size={24} color="white" />
          </View>
          <View style={styles.communityTipsText}>
            <ThemedText style={styles.communityTipsTitle}>Community Tips</ThemedText>
            <ThemedText style={styles.communityTipsSubtitle}>
              Share recovery tips and trail conditions
            </ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={24} color={theme.primary} />
      </Pressable>

      {selectedCategory ? (
        <View style={styles.section}>
          <View style={styles.backHeader}>
            <Feather
              name="arrow-left"
              size={24}
              color={theme.primary}
              onPress={() => setSelectedCategory(null)}
              style={styles.backButton}
            />
            <ThemedText style={[Typography.h3, styles.sectionTitle]}>
              {categories.find((c) => c.id === selectedCategory)?.title}
            </ThemedText>
          </View>
          {searchedGuides.map((guide) => (
            <GuideListItem
              key={guide.id}
              guide={guide}
              onPress={() => handleGuidePress(guide.id)}
              isSaved={savedGuides.includes(guide.id)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.section}>
          <ThemedText style={[Typography.h3, styles.sectionTitle]}>
            Browse by Category
          </ThemedText>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => handleCategoryPress(category.id)}
            />
          ))}
        </View>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  backHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  communityTipsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  communityTipsContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  communityTipsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  communityTipsText: {
    flex: 1,
  },
  communityTipsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  communityTipsSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
});
