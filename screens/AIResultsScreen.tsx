import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, ActivityIndicator, Pressable } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AIScanStackParamList } from "@/navigation/AIScanStackNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { analyzeRecoverySituation, RecoveryAnalysis } from "@/services/openai";

type AIResultsScreenRouteProp = RouteProp<AIScanStackParamList, "AIResults">;

export default function AIResultsScreen() {
  const route = useRoute<AIResultsScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);

  const { imageUri } = route.params;

  useEffect(() => {
    performAnalysis();
  }, []);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeRecoverySituation(imageUri);
      
      // Transform the new API response to match the existing UI format
      const transformedResult = {
        situationType: result.situation,
        difficulty: result.estimatedDifficulty,
        equipment: result.requiredEquipment,
        steps: result.recommendations.map((rec, index) => ({
          title: `Step ${index + 1}`,
          description: rec,
        })),
        tips: result.safetyWarnings,
        warning: result.severity === "critical" || result.severity === "high" 
          ? "This is a high-risk situation. Consider requesting professional assistance."
          : undefined,
        recoverability: result.severity === "low" ? 0.9 : result.severity === "moderate" ? 0.7 : result.severity === "high" ? 0.5 : 0.3,
        confidence: 0.85,
      };
      
      setAnalysis(transformedResult);

      await storage.addScanHistory({
        id: Date.now().toString(),
        imageUri,
        timestamp: Date.now(),
        situationType: result.situation,
        analysis: JSON.stringify(result),
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      setAnalysis({
        situationType: "Analysis Error",
        difficulty: "Moderate",
        steps: [
          {
            title: "Assess Safely",
            description: "Exit the vehicle and carefully assess the terrain and vehicle position."
          }
        ],
        warning: error.message || "Unable to complete analysis. Please check your API key configuration.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestHelp = () => {
    navigation.navigate("RequestHelp");
  };

  if (isAnalyzing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[Typography.h4, styles.loadingText]}>
          Analyzing your situation...
        </ThemedText>
        <ThemedText style={[styles.loadingDescription, { color: theme.tabIconDefault }]}>
          Our AI is examining the photo and generating recovery recommendations
        </ThemedText>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText>Unable to analyze image</ThemedText>
      </View>
    );
  }

  const difficultyColor =
    analysis.difficulty === "Easy"
      ? theme.success
      : analysis.difficulty === "Moderate"
      ? theme.warning
      : theme.error;

  const confidencePercent = analysis.confidence
    ? Math.round(analysis.confidence * 100)
    : "N/A";

  const recoverabilityPercent = analysis.recoverability
    ? Math.round(analysis.recoverability * 100)
    : "N/A";

  const recoverabilityColor =
    analysis.recoverability !== undefined
      ? analysis.recoverability >= 0.85
        ? theme.success
        : analysis.recoverability >= 0.65
        ? theme.warning
        : theme.error
      : theme.tabIconDefault;

  return (
    <ScreenScrollView>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

      <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.summaryHeader}>
          <View style={styles.titleSection}>
            <ThemedText style={[Typography.h3, styles.situationType]}>
              {analysis.situationType}
            </ThemedText>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: difficultyColor + "20" }]}>
                <ThemedText style={[styles.badgeText, { color: difficultyColor }]}>
                  {analysis.difficulty}
                </ThemedText>
              </View>
              {analysis.confidence !== undefined && (
                <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
                  <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                    {confidencePercent}% Confident
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
          <Feather name="alert-circle" size={48} color={theme.warning} />
        </View>
        {analysis.recoverability !== undefined && (
          <View style={[styles.recoverabilityBar, { marginTop: Spacing.lg }]}>
            <View style={styles.recoverabilityLabel}>
              <ThemedText style={[Typography.label, { color: recoverabilityColor }]}>
                Recoverability Score
              </ThemedText>
              <ThemedText style={[Typography.h3, { color: recoverabilityColor }]}>
                {recoverabilityPercent}%
              </ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${typeof recoverabilityPercent === "number" ? recoverabilityPercent : 0}%`,
                    backgroundColor: recoverabilityColor,
                  },
                ]}
              />
            </View>
            <ThemedText
              style={[
                styles.recoverabilityText,
                { color: theme.tabIconDefault, marginTop: Spacing.md },
              ]}
            >
              {analysis.recoverability >= 0.85
                ? "Vehicle is likely recoverable with proper technique"
                : analysis.recoverability >= 0.65
                ? "Vehicle may be recoverable, professional help recommended"
                : "Professional recovery equipment/service strongly recommended"}
            </ThemedText>
          </View>
        )}
      </View>

      {analysis.equipment && analysis.equipment.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[Typography.h4, styles.sectionTitle]}>
            Recommended Equipment
          </ThemedText>
          <View style={[styles.equipmentGrid, { backgroundColor: theme.backgroundDefault }]}>
            {analysis.equipment.map((item: string, index: number) => (
              <View key={index} style={styles.equipmentItem}>
                <Feather name="check-circle" size={16} color={theme.success} />
                <ThemedText style={[styles.equipmentText, { marginLeft: Spacing.sm }]}>
                  {item}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Recovery Steps
        </ThemedText>
        {analysis.steps.map((step: any, index: number) => (
          <View
            key={index}
            style={[styles.stepCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText style={[styles.stepNumberText, { color: theme.buttonText }]}>
                {index + 1}
              </ThemedText>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <ThemedText style={[Typography.label, styles.stepTitle]}>
                  {step.title}
                </ThemedText>
                {step.timeEstimate && (
                  <ThemedText style={[styles.timeEstimate, { color: theme.tabIconDefault }]}>
                    ~{step.timeEstimate}
                  </ThemedText>
                )}
              </View>
              <ThemedText style={styles.stepDescription}>{step.description}</ThemedText>
            </View>
          </View>
        ))}
      </View>

      {analysis.tips && analysis.tips.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[Typography.h4, styles.sectionTitle]}>
            Pro Tips
          </ThemedText>
          {analysis.tips.map((tip: string, index: number) => (
            <View
              key={index}
              style={[styles.tipCard, { backgroundColor: theme.backgroundDefault }]}
            >
              <Feather name="zap" size={20} color={theme.primary} />
              <ThemedText style={[styles.tipText, { marginLeft: Spacing.md }]}>
                {tip}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {analysis.warning ? (
        <View
          style={[
            styles.warningSection,
            { backgroundColor: theme.error + "15", borderColor: theme.error },
          ]}
        >
          <View style={styles.warningHeader}>
            <Feather name="alert-triangle" size={24} color={theme.error} />
            <ThemedText
              style={[Typography.h4, { marginLeft: Spacing.sm, color: theme.error }]}
            >
              Warning
            </ThemedText>
          </View>
          <ThemedText style={styles.warningText}>{analysis.warning}</ThemedText>
        </View>
      ) : null}

      <View
        style={[styles.disclaimerSection, { backgroundColor: theme.backgroundSecondary }]}
      >
        <Feather name="info" size={20} color={theme.tabIconDefault} />
        <ThemedText style={[styles.disclaimerText, { color: theme.tabIconDefault }]}>
          AI suggestions are for guidance only. Always use professional judgment and
          prioritize safety. If unsure, request professional assistance.
        </ThemedText>
      </View>

      <Pressable
        style={[styles.helpButton, { backgroundColor: theme.error }]}
        onPress={handleRequestHelp}
        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      >
        <Feather name="alert-circle" size={24} color={theme.buttonText} />
        <ThemedText style={[Typography.button, { color: theme.buttonText, marginLeft: Spacing.md }]}>
          Request Help Now
        </ThemedText>
      </Pressable>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
  },
  loadingText: {
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  loadingDescription: {
    marginTop: Spacing.md,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSection: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  situationType: {
    marginBottom: Spacing.md,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  equipmentGrid: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  equipmentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  equipmentText: {
    fontSize: 15,
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
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  stepTitle: {
    flex: 1,
  },
  timeEstimate: {
    fontSize: 13,
    fontWeight: "500",
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  tipCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    alignItems: "flex-start",
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  recoverabilityBar: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  recoverabilityLabel: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 12,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  recoverabilityText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  warningSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.xl,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
  },
  disclaimerSection: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
});
