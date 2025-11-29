import React, { useState } from "react";
import { View, StyleSheet, Pressable, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

const DONATION_TIERS = [
  {
    id: "coffee",
    amount: 5,
    emoji: "☕",
    label: "Coffee",
    description: "Buy the team a coffee",
  },
  {
    id: "lunch",
    amount: 25,
    emoji: "🍔",
    label: "Trail Lunch",
    description: "Support trail maintenance",
  },
  {
    id: "adventure",
    amount: 50,
    emoji: "🗻",
    label: "Adventure",
    description: "Help build new features",
  },
  {
    id: "expedition",
    amount: 100,
    emoji: "🚀",
    label: "Expedition",
    description: "Major feature sponsor",
  },
];

export default function DonateScreen() {
  const { theme } = useTheme();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleDonate = async (amount: number) => {
    // For now, show a message. In production, integrate Stripe payment
    // Open donation link or show payment option
    alert(
      `Thank you for supporting Adventure Time!\n\nDonation: $${amount}\n\nPayment processing coming soon!`
    );
  };

  return (
    <ScreenScrollView
      style={{ backgroundColor: theme.backgroundDefault }}
      scrollViewProps={{ showsVerticalScrollIndicator: false }}
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        {/* Header */}
        <View style={styles.header}>
          <Feather name="heart" size={48} color={theme.primary} />
          <ThemedText style={[Typography.h1, styles.title]}>
            Support Adventure Time
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            Help us build the ultimate offroad recovery companion
          </ThemedText>
        </View>

        {/* Mission */}
        <View
          style={[
            styles.missionCard,
            { backgroundColor: theme.primary + "10", borderColor: theme.primary },
          ]}
        >
          <ThemedText style={[Typography.h3, styles.missionTitle]}>
            Our Mission
          </ThemedText>
          <ThemedText style={[styles.missionText, { color: theme.text }]}>
            Adventure Time is dedicated to helping offroaders stay safe and recover quickly when things go wrong on the trail. Your support enables us to build better features and improve the app.
          </ThemedText>
        </View>

        {/* Donation Tiers */}
        <View style={styles.tiersContainer}>
          <ThemedText style={[Typography.h2, styles.tiersTitle]}>
            Choose Your Support Level
          </ThemedText>

          <View style={styles.tiers}>
            {DONATION_TIERS.map((tier) => (
              <Pressable
                key={tier.id}
                style={[
                  styles.tierCard,
                  {
                    backgroundColor:
                      selectedTier === tier.id
                        ? theme.primary + "20"
                        : theme.backgroundSecondary,
                    borderColor:
                      selectedTier === tier.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedTier(tier.id)}
              >
                <ThemedText style={styles.tierEmoji}>{tier.emoji}</ThemedText>
                <ThemedText style={[Typography.label, styles.tierAmount]}>
                  ${tier.amount}
                </ThemedText>
                <ThemedText style={styles.tierLabel}>{tier.label}</ThemedText>
                <ThemedText
                  style={[styles.tierDescription, { color: theme.tabIconDefault }]}
                >
                  {tier.description}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* CTA Button */}
        {selectedTier && (
          <Pressable
            style={[styles.donateButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              const tier = DONATION_TIERS.find((t) => t.id === selectedTier);
              if (tier) {
                handleDonate(tier.amount);
              }
            }}
          >
            <Feather name="heart" size={20} color={theme.backgroundDefault} />
            <ThemedText
              style={[
                styles.donateButtonText,
                { color: theme.backgroundDefault },
              ]}
            >
              Donate Now
            </ThemedText>
          </Pressable>
        )}

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <ThemedText style={[Typography.h3, styles.benefitsTitle]}>
            What Your Support Enables
          </ThemedText>

          <BenefitItem
            icon="zap"
            title="Faster Development"
            description="New features and improvements prioritized"
            theme={theme}
          />
          <BenefitItem
            icon="cloud"
            title="Cloud Infrastructure"
            description="Reliable servers for real-time features"
            theme={theme}
          />
          <BenefitItem
            icon="shield"
            title="Better Safety"
            description="More trail data and emergency integrations"
            theme={theme}
          />
          <BenefitItem
            icon="users"
            title="Community"
            description="Sponsor badge and community recognition"
            theme={theme}
          />
        </View>

        {/* FAQ */}
        <View style={styles.faqContainer}>
          <ThemedText style={[Typography.h3, styles.faqTitle]}>
            Questions?
          </ThemedText>
          <Pressable
            style={styles.faqItem}
            onPress={() =>
              Linking.openURL("mailto:contact@adventure-time.app")
            }
          >
            <Feather name="mail" size={18} color={theme.primary} />
            <ThemedText style={[styles.faqText, { color: theme.primary }]}>
              Email us: contact@adventure-time.app
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.footer} />
      </View>
    </ScreenScrollView>
  );
}

function BenefitItem({
  icon,
  title,
  description,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  theme: any;
}) {
  return (
    <View style={styles.benefitItem}>
      <View style={[styles.benefitIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.benefitContent}>
        <ThemedText style={[Typography.label, { fontWeight: "600" }]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.benefitDescription, { color: theme.tabIconDefault }]}>
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["2xl"],
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
    marginTop: Spacing.md,
  },
  missionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
  },
  missionTitle: {
    marginBottom: Spacing.md,
  },
  missionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tiersContainer: {
    marginBottom: Spacing["2xl"],
  },
  tiersTitle: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  tiers: {
    gap: Spacing.md,
  },
  tierCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
    gap: Spacing.xs,
  },
  tierEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  tierAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  tierDescription: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  donateButton: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  benefitsContainer: {
    marginBottom: Spacing["2xl"],
  },
  benefitsTitle: {
    marginBottom: Spacing.lg,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  benefitContent: {
    flex: 1,
  },
  benefitDescription: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  faqContainer: {
    marginBottom: Spacing["2xl"],
  },
  faqTitle: {
    marginBottom: Spacing.lg,
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  faqText: {
    fontSize: 14,
  },
  footer: {
    height: Spacing.xl,
  },
});
