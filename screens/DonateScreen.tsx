import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

const STRIPE_PAYMENT_LINK = "https://donate.stripe.com/bJe5kDb4Dd1V8Ah273fMA01";

export default function DonateScreen() {
  const { theme } = useTheme();
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const openStripePaymentLink = async () => {
    if (!STRIPE_PAYMENT_LINK) {
      Alert.alert(
        "Stripe Setup Required",
        "To enable donations:\n\n1. Go to stripe.com/dashboard\n2. Create a Payment Link with 'Let customer choose price' enabled\n3. Add the URL to STRIPE_PAYMENT_LINK in DonateScreen.tsx",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setIsProcessing(true);
      await WebBrowser.openBrowserAsync(STRIPE_PAYMENT_LINK, {
        dismissButtonStyle: "close",
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to open payment page. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDonate = async () => {
    if (isProcessing) return;
    
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid donation amount");
      return;
    }
    
    await openStripePaymentLink();
  };

  return (
    <ScreenScrollView style={{ backgroundColor: theme.backgroundDefault }}>
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.header}>
          <Feather name="heart" size={48} color={theme.primary} />
          <ThemedText style={[Typography.h1, styles.title]}>
            Support Adventure Time
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            Help us build the ultimate offroad recovery companion
          </ThemedText>
        </View>

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

        <View style={styles.donationContainer}>
          <ThemedText style={[Typography.h2, styles.donationTitle]}>
            Enter Your Donation
          </ThemedText>
          <ThemedText style={[styles.donationSubtitle, { color: theme.tabIconDefault }]}>
            Every contribution helps keep Adventure Time running
          </ThemedText>
          
          <View
            style={[
              styles.amountInputWrapper,
              { borderColor: theme.primary, backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText style={[styles.currencySymbol, { color: theme.primary }]}>$</ThemedText>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              placeholder="0.00"
              placeholderTextColor={theme.tabIconDefault}
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={setCustomAmount}
            />
          </View>

          <Pressable
            style={[
              styles.donateButton,
              {
                backgroundColor: isProcessing || !customAmount ? theme.tabIconDefault : theme.primary,
                opacity: isProcessing ? 0.6 : 1,
              },
            ]}
            onPress={handleDonate}
            disabled={isProcessing || !customAmount}
          >
            {isProcessing ? (
              <ActivityIndicator color={theme.backgroundDefault} />
            ) : (
              <>
                <Feather name="heart" size={20} color={theme.backgroundDefault} />
                <ThemedText
                  style={[
                    styles.donateButtonText,
                    { color: theme.backgroundDefault },
                  ]}
                >
                  Donate Now
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>

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
  donationContainer: {
    marginBottom: Spacing["2xl"],
    alignItems: "center",
  },
  donationTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  donationSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    width: "100%",
    maxWidth: 280,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "700",
  },
  amountInput: {
    flex: 1,
    paddingVertical: Spacing.lg,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  donateButton: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    width: "100%",
    maxWidth: 280,
  },
  donateButtonText: {
    fontSize: 18,
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
  footer: {
    height: Spacing.xl,
  },
});
