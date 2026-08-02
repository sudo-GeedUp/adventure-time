import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  PACKAGE_TYPE,
  PurchasesIntroPrice,
  PurchasesPackage,
} from "react-native-purchases";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { getOfferings } from "@/config/revenuecat";
import {
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from "@/constants/LegalUrls";
import * as Linking from "expo-linking";

const PREMIUM_FEATURES = [
  "AI Recovery Scan",
  "Unlimited Adventures",
  "Trail Updates & Events",
  "Community Trail Data",
  "Rally Navigator",
  "Offline Maps",
  "Priority Support",
];

interface PlanOption {
  id: string;
  package: PurchasesPackage;
  title: string;
  period: string;
  subscriptionTitle: string;
  length: string;
  pricePerUnit?: string;
  savings?: string;
  introPrice?: string;
  popular?: boolean;
  features: string[];
}

function getPlanTitle(packageType: PACKAGE_TYPE): string {
  switch (packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return "Yearly";
    case PACKAGE_TYPE.MONTHLY:
      return "Monthly";
    case PACKAGE_TYPE.SIX_MONTH:
      return "6 Month";
    case PACKAGE_TYPE.THREE_MONTH:
      return "3 Month";
    case PACKAGE_TYPE.TWO_MONTH:
      return "2 Month";
    case PACKAGE_TYPE.WEEKLY:
      return "Weekly";
    case PACKAGE_TYPE.LIFETIME:
      return "Lifetime";
    default:
      return "Subscription";
  }
}

function getSubscriptionTitle(pkg: PurchasesPackage): string {
  const title = pkg.product.title?.trim();
  return title || getPlanTitle(pkg.packageType);
}

function getSubscriptionLength(
  packageType: PACKAGE_TYPE,
  isoPeriod: string | null,
): string {
  if (isoPeriod) {
    if (isoPeriod === "P1M") return "1 month";
    if (isoPeriod === "P1Y") return "1 year";
    if (isoPeriod === "P6M") return "6 months";
    if (isoPeriod === "P3M") return "3 months";
    if (isoPeriod === "P2M") return "2 months";
    if (isoPeriod === "P1W") return "1 week";
  }
  switch (packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return "1 year";
    case PACKAGE_TYPE.MONTHLY:
      return "1 month";
    case PACKAGE_TYPE.SIX_MONTH:
      return "6 months";
    case PACKAGE_TYPE.THREE_MONTH:
      return "3 months";
    case PACKAGE_TYPE.TWO_MONTH:
      return "2 months";
    case PACKAGE_TYPE.WEEKLY:
      return "1 week";
    default:
      return "subscription period";
  }
}

function getPeriodLabel(
  packageType: PACKAGE_TYPE,
  isoPeriod: string | null,
): string {
  if (isoPeriod) {
    if (isoPeriod === "P1M") return "/month";
    if (isoPeriod === "P1Y") return "/year";
    if (isoPeriod === "P6M") return "/6 months";
    if (isoPeriod === "P3M") return "/3 months";
    if (isoPeriod === "P2M") return "/2 months";
    if (isoPeriod === "P1W") return "/week";
  }
  switch (packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return "/year";
    case PACKAGE_TYPE.MONTHLY:
      return "/month";
    case PACKAGE_TYPE.SIX_MONTH:
      return "/6 months";
    case PACKAGE_TYPE.THREE_MONTH:
      return "/3 months";
    case PACKAGE_TYPE.TWO_MONTH:
      return "/2 months";
    case PACKAGE_TYPE.WEEKLY:
      return "/week";
    default:
      return "";
  }
}

function formatIntroPeriod(
  periodUnit: string,
  periodNumberOfUnits: number,
): string {
  const unit = periodUnit.toLowerCase();
  return periodNumberOfUnits === 1 ? unit : `${periodNumberOfUnits} ${unit}s`;
}

function getIntroPriceText(
  intro: PurchasesIntroPrice | null,
): string | undefined {
  if (!intro) return undefined;
  const period = formatIntroPeriod(intro.periodUnit, intro.periodNumberOfUnits);
  if (intro.price === 0) {
    return intro.cycles === 1
      ? `${period} free trial`
      : `${intro.cycles} ${period}s free`;
  }
  return `First ${intro.cycles} ${period}s at ${intro.priceString}`;
}

function getSavingsText(
  monthly: PurchasesPackage | undefined,
  yearly: PurchasesPackage | undefined,
): string | undefined {
  if (!monthly || !yearly) return undefined;
  const yearlyEquivalent = monthly.product.pricePerYear;
  if (yearlyEquivalent && yearlyEquivalent > yearly.product.price) {
    const savings = Math.round(
      ((yearlyEquivalent - yearly.product.price) / yearlyEquivalent) * 100,
    );
    if (savings > 0) return `Save ${savings}%`;
  }
  return undefined;
}

function getPricePerUnit(
  pkg: PurchasesPackage,
  otherPkg?: PurchasesPackage,
): string | undefined {
  const { packageType, product } = pkg;
  if (packageType === PACKAGE_TYPE.ANNUAL) {
    if (product.pricePerMonthString)
      return `that's ${product.pricePerMonthString}/month`;
    if (otherPkg?.product.priceString)
      return `vs ${otherPkg.product.priceString}/month`;
  }
  if (packageType === PACKAGE_TYPE.MONTHLY && product.pricePerYearString) {
    return `that's ${product.pricePerYearString}/year`;
  }
  if (packageType === PACKAGE_TYPE.SIX_MONTH && product.pricePerMonthString) {
    return `that's ${product.pricePerMonthString}/month`;
  }
  return undefined;
}

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { isPremium, purchaseSubscription, restore, isLoading } =
    useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoadingOfferings(true);
      const offering = await getOfferings();
      if (offering?.availablePackages?.length) {
        const relevantPackages = offering.availablePackages.filter((pkg) =>
          [
            PACKAGE_TYPE.ANNUAL,
            PACKAGE_TYPE.MONTHLY,
            PACKAGE_TYPE.SIX_MONTH,
            PACKAGE_TYPE.THREE_MONTH,
            PACKAGE_TYPE.TWO_MONTH,
            PACKAGE_TYPE.WEEKLY,
          ].includes(pkg.packageType),
        );
        setPackages(relevantPackages);
        const defaultPkg =
          relevantPackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ||
          relevantPackages[0];
        setSelectedPlanId(defaultPkg.identifier);
      }
    } catch (_error) {
      console.error("Error loading offerings:", _error);
    } finally {
      setLoadingOfferings(false);
    }
  };

  const plans: PlanOption[] = useMemo(() => {
    const monthly = packages.find(
      (p) => p.packageType === PACKAGE_TYPE.MONTHLY,
    );
    const yearly = packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
    return packages.map((pkg) => {
      const isYearly = pkg.packageType === PACKAGE_TYPE.ANNUAL;
      const title = getPlanTitle(pkg.packageType);
      const period = getPeriodLabel(
        pkg.packageType,
        pkg.product.subscriptionPeriod,
      );
      const subscriptionTitle = getSubscriptionTitle(pkg);
      const length = getSubscriptionLength(
        pkg.packageType,
        pkg.product.subscriptionPeriod,
      );
      const otherPkg = isYearly ? monthly : yearly;
      const pricePerUnit = getPricePerUnit(pkg, otherPkg);
      const introPrice = getIntroPriceText(pkg.product.introPrice);
      const savings = isYearly ? getSavingsText(monthly, yearly) : undefined;
      return {
        id: pkg.identifier,
        package: pkg,
        title,
        period,
        subscriptionTitle,
        length,
        pricePerUnit,
        savings,
        introPrice,
        popular: isYearly,
        features: PREMIUM_FEATURES,
      };
    });
  }, [packages]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId],
  );

  const handlePurchase = async () => {
    if (isProcessing || !selectedPlan) return;

    setIsProcessing(true);
    try {
      const productIdentifier = selectedPlan.package.product.identifier;
      const success = await purchaseSubscription(productIdentifier);
      if (success) {
        Alert.alert(
          "Welcome to Premium!",
          "You now have access to all premium features including AI Scan, trail updates, and more!",
        );
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error("Purchase failed:", error);
        Alert.alert(
          "Purchase Failed",
          "We couldn't complete your purchase. You have not been charged. Please try again later.",
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
          "Your premium subscription has been restored successfully.",
        );
      } else {
        Alert.alert(
          "No Subscription Found",
          "No active subscription found for this account.",
        );
      }
    } catch {
      Alert.alert(
        "Restore Failed",
        "Unable to restore purchases. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Unable to open link.");
    }
  };

  if (isLoading || loadingOfferings) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isPremium) {
    return (
      <ScreenScrollView style={{ backgroundColor: theme.backgroundDefault }}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.header}>
            <Feather name="star" size={48} color={theme.primary} />
            <ThemedText style={[Typography.h1, styles.title]}>
              Premium Member
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: theme.tabIconDefault }]}
            >
              Thank you for supporting Adventure Time!
            </ThemedText>
          </View>

          <View
            style={[
              styles.premiumCard,
              {
                backgroundColor: theme.primary + "10",
                borderColor: theme.primary,
              },
            ]}
          >
            <ThemedText style={[Typography.h3, styles.premiumTitle]}>
              Your Premium Benefits
            </ThemedText>
            <BenefitItem
              icon="camera"
              text="AI Recovery Scan"
              active
              theme={theme}
            />
            <BenefitItem
              icon="save"
              text="Save & View Past Adventures"
              active
              theme={theme}
            />
            <BenefitItem
              icon="map-pin"
              text="Trail Updates & Conditions"
              active
              theme={theme}
            />
            <BenefitItem
              icon="alert-circle"
              text="Post Trail Warnings & Events"
              active
              theme={theme}
            />
            <BenefitItem
              icon="users"
              text="Priority Support"
              active
              theme={theme}
            />
          </View>

          <Pressable
            style={[styles.manageButton, { borderColor: theme.primary }]}
            onPress={() =>
              Alert.alert(
                "Manage Subscription",
                "To manage your subscription, go to Settings > [Your Name] > Subscriptions on your device.",
              )
            }
          >
            <ThemedText
              style={[styles.manageButtonText, { color: theme.primary }]}
            >
              Manage Subscription
            </ThemedText>
          </Pressable>
        </View>
      </ScreenScrollView>
    );
  }

  const subscribeButtonText = selectedPlan?.introPrice
    ?.toLowerCase()
    .includes("free trial")
    ? "Start Free Trial"
    : "Subscribe Now";

  const renewalDisclosure = selectedPlan
    ? `${selectedPlan.subscriptionTitle} (${selectedPlan.length}) auto-renews at ${
        selectedPlan.package.product.priceString
      }${selectedPlan.period} unless cancelled at least 24 hours before the end of the current period. You can manage or cancel in Settings → Subscriptions.${
        selectedPlan.introPrice
          ? ` After the ${selectedPlan.introPrice}, the subscription auto-renews at ${selectedPlan.package.product.priceString}${selectedPlan.period}.`
          : ""
      }`
    : "Subscription auto-renews unless cancelled at least 24 hours before the end of the current period. You can manage or cancel in Settings → Subscriptions.";

  return (
    <ScreenScrollView style={{ backgroundColor: theme.backgroundDefault }}>
      <View
        style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.header}>
          <Feather name="star" size={48} color={theme.primary} />
          <ThemedText style={[Typography.h1, styles.title]}>
            Adventure Time Premium
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: theme.tabIconDefault }]}
          >
            Unlock all features and support development
          </ThemedText>
        </View>

        <View
          style={[
            styles.featuresCard,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
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

        <View style={styles.plansSection}>
          {plans.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.planCard,
                { backgroundColor: theme.backgroundSecondary },
                selectedPlanId === plan.id && {
                  borderColor: theme.primary,
                  borderWidth: 2,
                },
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlanId(plan.id)}
            >
              {plan.popular && (
                <View
                  style={[
                    styles.popularBadge,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <ThemedText style={styles.popularBadgeText}>
                    MOST POPULAR
                  </ThemedText>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planHeaderLeft}>
                  <ThemedText style={[Typography.h3, { color: theme.text }]}>
                    {plan.title}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.planSubscriptionTitle,
                      { color: theme.tabIconDefault },
                    ]}
                  >
                    {plan.subscriptionTitle}
                  </ThemedText>
                  <ThemedText
                    style={[styles.planLength, { color: theme.tabIconDefault }]}
                  >
                    Length: {plan.length}
                  </ThemedText>
                </View>
                <View>
                  <View style={styles.planPricing}>
                    <ThemedText
                      style={[Typography.h2, { color: theme.primary }]}
                    >
                      {plan.package.product.priceString}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.planPeriod,
                        { color: theme.tabIconDefault },
                      ]}
                    >
                      {plan.period}
                    </ThemedText>
                  </View>
                  {plan.introPrice && (
                    <ThemedText
                      style={[styles.planIntro, { color: theme.success }]}
                    >
                      {plan.introPrice}
                    </ThemedText>
                  )}
                  {plan.savings && (
                    <ThemedText
                      style={[styles.planSavings, { color: theme.success }]}
                    >
                      {plan.savings}
                    </ThemedText>
                  )}
                  {plan.pricePerUnit && (
                    <ThemedText
                      style={[
                        styles.planPerUnit,
                        { color: theme.tabIconDefault },
                      ]}
                    >
                      {plan.pricePerUnit}
                    </ThemedText>
                  )}
                </View>
              </View>

              <View style={styles.planFeatures}>
                <ThemedText
                  style={[
                    styles.planFeaturesTitle,
                    { color: theme.tabIconDefault },
                  ]}
                >
                  What&apos;s included:
                </ThemedText>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.planFeature}>
                    <Feather name="check" size={18} color={theme.success} />
                    <ThemedText
                      style={[
                        styles.planFeatureText,
                        { color: theme.tabIconDefault },
                      ]}
                    >
                      {feature}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.disclosureContainer}>
          <ThemedText
            style={[styles.disclosureText, { color: theme.tabIconDefault }]}
          >
            {renewalDisclosure}
          </ThemedText>
          <ThemedText
            style={[styles.includedText, { color: theme.tabIconDefault }]}
          >
            What&apos;s included: {PREMIUM_FEATURES.join(", ")}
          </ThemedText>
          <View style={styles.legalLinksContainer}>
            <Pressable onPress={() => openUrl(TERMS_OF_SERVICE_URL)}>
              <ThemedText style={[styles.legalLink, { color: theme.link }]}>
                Terms of Use (EULA)
              </ThemedText>
            </Pressable>
            <ThemedText
              style={[
                styles.legalLinkSeparator,
                { color: theme.tabIconDefault },
              ]}
            >
              {" "}
              •{" "}
            </ThemedText>
            <Pressable onPress={() => openUrl(PRIVACY_POLICY_URL)}>
              <ThemedText style={[styles.legalLink, { color: theme.link }]}>
                Privacy Policy
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[
            styles.subscribeButton,
            {
              backgroundColor: isProcessing
                ? theme.tabIconDefault
                : theme.primary,
              opacity: isProcessing || !selectedPlan ? 0.6 : 1,
            },
          ]}
          onPress={handlePurchase}
          disabled={isProcessing || !selectedPlan}
        >
          {isProcessing ? (
            <ActivityIndicator color={theme.backgroundDefault} />
          ) : (
            <>
              <Feather name="star" size={20} color={theme.backgroundDefault} />
              <ThemedText
                style={[
                  styles.subscribeButtonText,
                  { color: theme.backgroundDefault },
                ]}
              >
                {subscribeButtonText}
              </ThemedText>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.restoreButton]}
          onPress={handleRestore}
          disabled={isProcessing}
        >
          <ThemedText
            style={[styles.restoreButtonText, { color: theme.primary }]}
          >
            Restore Purchases
          </ThemedText>
        </Pressable>
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
      <View
        style={[
          styles.benefitIcon,
          { backgroundColor: active ? theme.primary : theme.primary + "20" },
        ]}
      >
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
          <ThemedText
            style={[styles.benefitDescription, { color: theme.tabIconDefault }]}
          >
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
  plansSection: {
    marginBottom: Spacing.xl,
  },
  planCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: Spacing.lg,
  },
  planCardPopular: {
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    right: Spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  planPricing: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  planPeriod: {
    fontSize: 14,
    marginLeft: 4,
  },
  planIntro: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  planSavings: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  planPerUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  planFeatures: {
    marginTop: Spacing.md,
  },
  planFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  planFeatureText: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  planHeaderLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  planSubscriptionTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  planLength: {
    fontSize: 13,
    marginTop: 2,
  },
  planFeaturesTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  disclosureContainer: {
    marginBottom: Spacing.xl,
  },
  disclosureText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  includedText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  legalLinksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  legalLink: {
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  legalLinkSeparator: {
    fontSize: 13,
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
  termsLink: {
    textDecorationLine: "underline",
  },
});
