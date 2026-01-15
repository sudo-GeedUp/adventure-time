import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Alert, 
  ActivityIndicator,
  ScrollView 
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { PurchasesPackage } from "react-native-purchases";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { getOfferings } from "@/config/revenuecat";

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { isPremium, purchaseSubscription, restore, isLoading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoadingOfferings(true);
      const offerings = await getOfferings();
      if (offerings) {
        const monthly = offerings.availablePackages.find(
          pkg => pkg.packageType === 'MONTHLY' || 
                 pkg.product.identifier === 'com.adventuretime.premium.monthly'
        );
        setMonthlyPackage(monthly || null);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handlePurchase = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const success = await purchaseSubscription();
      if (success) {
        Alert.alert(
          "Welcome to Premium!",
          "You now have access to all premium features including AI Scan, trail updates, and more!"
        );
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(
          "Purchase Failed",
          error.message || "Unable to complete purchase. Please try again."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert(
          "Subscription Restored!",
          "Your premium subscription has been restored successfully."
        );
      } else {
        Alert.alert(
          "No Subscription Found",
          "No active subscription found for this account."
        );
      }
    } catch (error) {
      Alert.alert(
        "Restore Failed",
        "Unable to restore purchases. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || loadingOfferings) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isPremium) {
    return (
      <ScreenScrollView style={{ backgroundColor: theme.backgroundDefault }}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <Feather name="star" size={48} color={theme.primary} />
            <ThemedText style={[Typography.h1, styles.title]}>
              Premium Member
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
              Thank you for supporting Adventure Time!
            </ThemedText>
          </View>

          <View style={[styles.premiumCard, { backgroundColor: theme.primary + "10", borderColor: theme.primary }]}>
            <ThemedText style={[Typography.h3, styles.premiumTitle]}>
              Your Premium Benefits
            </ThemedText>
            <BenefitItem icon="camera" text="AI Recovery Scan" active theme={theme} />
            <BenefitItem icon="save" text="Save & View Past Adventures" active theme={theme} />
            <BenefitItem icon="map-pin" text="Trail Updates & Conditions" active theme={theme} />
            <BenefitItem icon="alert-circle" text="Post Trail Warnings & Events" active theme={theme} />
            <BenefitItem icon="users" text="Priority Support" active theme={theme} />
          </View>

          <Pressable
            style={[styles.manageButton, { borderColor: theme.primary }]}
            onPress={() => Alert.alert(
              "Manage Subscription",
              "To manage your subscription, go to Settings > [Your Name] > Subscriptions on your device."
            )}
          >
            <ThemedText style={[styles.manageButtonText, { color: theme.primary }]}>
              Manage Subscription
            </ThemedText>
          </Pressable>
        </View>
      </ScreenScrollView>
    );
  }

  const priceString = monthlyPackage?.product.priceString || "$4.99/month";

  return (
    <ScreenScrollView style={{ backgroundColor: theme.backgroundDefault }}>
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.header}>
          <Feather name="star" size={48} color={theme.primary} />
          <ThemedText style={[Typography.h1, styles.title]}>
            Adventure Time Premium
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            Unlock all features and support development
          </ThemedText>
        </View>

        <View style={[styles.featuresCard, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[Typography.h3, styles.featuresTitle]}>
            Premium Features
          </ThemedText>
          
          <BenefitItem 
            icon="camera" 
            text="AI Recovery Scan" 
            description="Analyze recovery points and get equipment suggestions"
            theme={theme} 
          />
          <BenefitItem 
            icon="save" 
            text="Save Adventures" 
            description="Store and review your past trail adventures"
            theme={theme} 
          />
          <BenefitItem 
            icon="map-pin" 
            text="Trail Updates" 
            description="Real-time trail conditions and updates"
            theme={theme} 
          />
          <BenefitItem 
            icon="alert-circle" 
            text="Trail Events" 
            description="View and post warnings, hazards, and events"
            theme={theme} 
          />
          <BenefitItem 
            icon="users" 
            text="Community Features" 
            description="Connect with other offroaders"
            theme={theme} 
          />
        </View>

        <View style={styles.priceContainer}>
          <ThemedText style={[Typography.h2, styles.priceText]}>
            {priceString}
          </ThemedText>
          <ThemedText style={[styles.priceSubtext, { color: theme.tabIconDefault }]}>
            Cancel anytime in Settings
          </ThemedText>
        </View>

        <Pressable
          style={[
            styles.subscribeButton,
            {
              backgroundColor: isProcessing ? theme.tabIconDefault : theme.primary,
              opacity: isProcessing ? 0.6 : 1,
            },
          ]}
          onPress={handlePurchase}
          disabled={isProcessing || !monthlyPackage}
        >
          {isProcessing ? (
            <ActivityIndicator color={theme.backgroundDefault} />
          ) : (
            <>
              <Feather name="star" size={20} color={theme.backgroundDefault} />
              <ThemedText style={[styles.subscribeButtonText, { color: theme.backgroundDefault }]}>
                Subscribe Now
              </ThemedText>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.restoreButton]}
          onPress={handleRestore}
          disabled={isProcessing}
        >
          <ThemedText style={[styles.restoreButtonText, { color: theme.primary }]}>
            Restore Purchases
          </ThemedText>
        </Pressable>

        <View style={styles.termsContainer}>
          <ThemedText style={[styles.termsText, { color: theme.tabIconDefault }]}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            {'\n\n'}
            Subscription automatically renews monthly unless cancelled at least 24 hours before the end of the current period. 
            Your account will be charged for renewal within 24 hours prior to the end of the current period. 
            You can manage and cancel your subscriptions in your device's Settings.
          </ThemedText>
        </View>
      </View>
    </ScreenScrollView>
  );
}

function BenefitItem({
  icon,
  text,
  description,
  active,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  description?: string;
  active?: boolean;
  theme: any;
}) {
  return (
    <View style={styles.benefitItem}>
      <View style={[
        styles.benefitIcon, 
        { backgroundColor: active ? theme.primary : theme.primary + "20" }
      ]}>
        <Feather 
          name={icon} 
          size={20} 
          color={active ? theme.backgroundDefault : theme.primary} 
        />
      </View>
      <View style={styles.benefitContent}>
        <ThemedText style={[Typography.label, { fontWeight: "600" }]}>
          {text}
        </ThemedText>
        {description && (
          <ThemedText style={[styles.benefitDescription, { color: theme.tabIconDefault }]}>
            {description}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  featuresCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
  },
  featuresTitle: {
    marginBottom: Spacing.lg,
  },
  premiumCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
  },
  premiumTitle: {
    marginBottom: Spacing.lg,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  priceText: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  priceSubtext: {
    fontSize: 14,
  },
  subscribeButton: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  restoreButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  manageButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
  termsContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
