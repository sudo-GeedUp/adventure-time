import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ThemedText from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { storage } from "@/utils/storage";

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { theme } = useTheme();

  const handleGetStarted = async () => {
    await storage.setFirstLaunchDone();
    navigation.replace("MainTabs");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <Feather name="compass" size={64} color={theme.primary} />
          <ThemedText style={[Typography.h1, styles.title]}>Adventure Time</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            Offroad Recovery Assistance
          </ThemedText>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="book"
            title="Recovery Guides"
            description="Step-by-step guides for stuck vehicles and recovery techniques"
            theme={theme}
          />
          <FeatureItem
            icon="camera"
            title="AI Photo Analysis"
            description="Upload photos for AI-powered recovery recommendations"
            theme={theme}
          />
          <FeatureItem
            icon="map"
            title="Nearby Offroaders"
            description="Find help from nearby community members on the trail"
            theme={theme}
          />
          <FeatureItem
            icon="users"
            title="Community"
            description="Share tips, trails, and connect with other adventurers"
            theme={theme}
          />
        </View>

        <View style={styles.thanks}>
          <Feather name="heart" size={28} color={theme.primary} />
          <ThemedText style={[styles.thanksTitle, { marginTop: Spacing.md }]}>
            Special Thanks
          </ThemedText>
          <ThemedText style={[styles.thanksText, { color: theme.tabIconDefault }]}>
            ChloeAnn for inspiring Adventure Time
          </ThemedText>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleGetStarted}
          android_ripple={{ color: theme.secondary }}
        >
          <ThemedText style={[styles.buttonText, { color: theme.backgroundDefault }]}>
            Get Started
          </ThemedText>
          <Feather name="arrow-right" size={20} color={theme.backgroundDefault} />
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  theme: any;
}

function FeatureItem({ icon, title, description, theme }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon} size={24} color={theme.primary} />
      </View>
      <View style={styles.featureContent}>
        <ThemedText style={[Typography.label, { fontWeight: "600" }]}>{title}</ThemedText>
        <ThemedText style={[styles.featureDescription, { color: theme.tabIconDefault }]}>
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing["2xl"],
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  features: {
    gap: Spacing.lg,
    marginBottom: Spacing["3xl"],
  },
  featureItem: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  featureContent: {
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  thanks: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
  },
  thanksTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  thanksText: {
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    minHeight: 56,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
