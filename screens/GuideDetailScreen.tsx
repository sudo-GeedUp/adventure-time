import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { guides } from "@/data/guides";
import { GuidesStackParamList } from "@/navigation/GuidesStackNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage } from "@/utils/storage";

type GuideDetailScreenRouteProp = RouteProp<GuidesStackParamList, "GuideDetail">;

export default function GuideDetailScreen() {
  const route = useRoute<GuideDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [isSaved, setIsSaved] = useState(false);

  const guide = guides.find((g) => g.id === route.params.guideId);

  useEffect(() => {
    if (guide) {
      checkIfSaved();
      navigation.setOptions({
        headerRight: () => (
          <Pressable onPress={toggleSave} style={styles.headerButton}>
            <Feather
              name={isSaved ? "bookmark" : "bookmark"}
              size={24}
              color={isSaved ? theme.primary : theme.tabIconDefault}
              style={{ opacity: isSaved ? 1 : 0.6 }}
            />
          </Pressable>
        ),
      });
    }
  }, [guide, isSaved]);

  const checkIfSaved = async () => {
    if (!guide) return;
    const savedGuides = await storage.getSavedGuides();
    setIsSaved(savedGuides.includes(guide.id));
  };

  const toggleSave = async () => {
    if (!guide) return;
    await storage.toggleSavedGuide(guide.id);
    setIsSaved(!isSaved);
  };

  if (!guide) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText>Guide not found</ThemedText>
      </View>
    );
  }

  const difficultyColor =
    guide.difficulty === "Easy"
      ? theme.success
      : guide.difficulty === "Moderate"
      ? theme.warning
      : theme.error;

  return (
    <ScreenScrollView>
      <View style={[styles.badge, { backgroundColor: difficultyColor + "20" }]}>
        <ThemedText style={[styles.badgeText, { color: difficultyColor }]}>
          {guide.difficulty}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Required Equipment
        </ThemedText>
        {guide.equipment.map((item, index) => (
          <View key={index} style={styles.equipmentItem}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText style={styles.equipmentText}>{item}</ThemedText>
          </View>
        ))}
      </View>

      {guide.safetyWarnings.length > 0 ? (
        <View
          style={[
            styles.warningSection,
            { backgroundColor: theme.warning + "15", borderColor: theme.warning },
          ]}
        >
          <View style={styles.warningHeader}>
            <Feather name="alert-triangle" size={24} color={theme.warning} />
            <ThemedText
              style={[Typography.h4, { marginLeft: Spacing.sm, color: theme.warning }]}
            >
              Safety Warnings
            </ThemedText>
          </View>
          {guide.safetyWarnings.map((warning, index) => (
            <ThemedText key={index} style={styles.warningText}>
              • {warning}
            </ThemedText>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>Procedure</ThemedText>
        {guide.steps.map((step) => (
          <View
            key={step.number}
            style={[styles.stepCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={[styles.stepNumberText, { color: theme.buttonText }]}>
                {step.number}
              </ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={[Typography.label, styles.stepTitle]}>
                {step.title}
              </ThemedText>
              <ThemedText style={styles.stepDescription}>{step.description}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    padding: Spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  equipmentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  equipmentText: {
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  warningSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing["2xl"],
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  stepCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
});
