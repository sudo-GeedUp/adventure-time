import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTheme } from "@/hooks/useTheme";
import { getOfferings } from "@/config/revenuecat";
import {
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from "@/constants/LegalUrls";
import {
  PACKAGE_TYPE,
  PurchasesIntroPrice,
  PurchasesPackage,
} from "react-native-purchases";

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

const PREMIUM_FEATURES = [
  "AI Recovery Scan",
  "Unlimited Adventures",
  "Trail Updates & Events",
  "Community Trail Data",
  "Rally Navigator",
  "Offline Maps",
  "Priority Support",
];

const PREMIUM_FEATURE_CARDS = [
  {
    icon: "scan" as const,
    title: "AI Recovery Scan",
    description: "Analyze recovery situations with AI-powered recommendations",
  },
  {
    icon: "map" as const,
    title: "Unlimited Adventures",
    description: "Track and save unlimited off-road adventures",
  },
  {
    icon: "notifications" as const,
    title: "Trail Updates",
    description: "Get real-time trail conditions and community warnings",
  },
  {
    icon: "speedometer" as const,
    title: "Rally Navigator",
    description: "Professional rally-style navigation with voice callouts",
  },
  {
    icon: "cloud-offline" as const,
    title: "Offline Maps",
    description: "Download maps for offline navigation in remote areas",
  },
  {
    icon: "people" as const,
    title: "Community Access",
    description: "View and post trail events, hazards, and updates",
  },
];

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

export default function PaywallScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { purchaseSubscription, restore } = useSubscription();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

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
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Unable to load subscription options.",
      );
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

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Unable to open link.");
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    try {
      const success = await purchaseSubscription(
        selectedPlan.package.product.identifier,
      );
      if (success) {
        Alert.alert(
          "Welcome to Premium!",
          "You now have access to all premium features.",
          [{ text: "Get Started", onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert(
          "Purchase Cancelled",
          "No worries! You can upgrade anytime.",
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Purchase Failed",
        error.message || "Please try again later.",
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert(
          "Purchases Restored!",
          "Your premium subscription has been restored.",
          [{ text: "Continue", onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases.",
        );
      }
    } catch (error: any) {
      Alert.alert("Restore Failed", error.message || "Please try again later.");
    } finally {
      setRestoring(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    closeButton: {
      padding: 8,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    heroSection: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 30,
      alignItems: "center",
    },
    heroIcon: {
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 18,
      color: theme.text,
      opacity: 0.7,
      textAlign: "center",
      lineHeight: 24,
    },
    featuresSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 20,
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
    },
    featureIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
      lineHeight: 20,
    },
    plansSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 16,
      textAlign: "center",
    },
    planCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: "transparent",
    },
    planCardSelected: {
      borderColor: theme.primary,
    },
    planCardPopular: {
      position: "relative",
    },
    popularBadge: {
      position: "absolute",
      top: -8,
      right: 20,
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
      alignItems: "center",
      marginBottom: 8,
    },
    planTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    planPricing: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    planPrice: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.primary,
    },
    planPeriod: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
      marginLeft: 4,
    },
    planIntro: {
      fontSize: 13,
      color: theme.success,
      fontWeight: "600",
      marginTop: 2,
    },
    planSavings: {
      fontSize: 12,
      color: theme.success,
      fontWeight: "600",
      marginTop: 2,
    },
    planPerUnit: {
      fontSize: 12,
      color: theme.text,
      opacity: 0.6,
      marginTop: 2,
    },
    planFeatures: {
      marginTop: 12,
    },
    planFeature: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    planFeatureText: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
      marginLeft: 8,
    },
    planHeaderLeft: {
      flex: 1,
      marginRight: 16,
    },
    planSubscriptionTitle: {
      fontSize: 13,
      color: theme.text,
      marginTop: 2,
    },
    planLength: {
      fontSize: 13,
      color: theme.text,
      marginTop: 2,
    },
    planFeaturesTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    includedText: {
      fontSize: 12,
      color: theme.text,
      opacity: 0.7,
      textAlign: "center",
      lineHeight: 18,
      marginTop: 8,
      marginBottom: 12,
    },
    legalLinksContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    legalLink: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primary,
      textDecorationLine: "underline",
    },
    legalLinkSeparator: {
      fontSize: 13,
      color: theme.text,
      opacity: 0.7,
    },
    ctaSection: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    disclosureText: {
      fontSize: 12,
      color: theme.text,
      opacity: 0.7,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 12,
    },
    subscribeButton: {
      borderRadius: 12,
      padding: 18,
      alignItems: "center",
      marginBottom: 12,
    },
    subscribeButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    restoreButton: {
      padding: 12,
      alignItems: "center",
    },
    restoreButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    footer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      alignItems: "center",
    },
    footerText: {
      fontSize: 12,
      color: theme.text,
      opacity: 0.7,
      textAlign: "center",
      lineHeight: 18,
    },
    footerLink: {
      color: theme.primary,
      textDecorationLine: "underline",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.backgroundDefault,
    },
  });

  if (loadingOfferings) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="star" size={64} color={theme.primary} />
          </View>
          <Text style={styles.heroTitle}>Unlock Premium</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited access to all features and take your off-road
            adventures to the next level
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {PREMIUM_FEATURE_CARDS.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon} size={24} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlanId === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlanId(plan.id)}
              activeOpacity={0.7}
            >
              {plan.popular && (
                <LinearGradient
                  colors={[theme.primary, theme.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.popularBadge}
                >
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </LinearGradient>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planHeaderLeft}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text
                    style={[
                      styles.planSubscriptionTitle,
                      { color: theme.tabIconDefault },
                    ]}
                  >
                    {plan.subscriptionTitle}
                  </Text>
                  <Text
                    style={[styles.planLength, { color: theme.tabIconDefault }]}
                  >
                    Length: {plan.length}
                  </Text>
                </View>
                <View>
                  <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>
                      {plan.package.product.priceString}
                    </Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                  {plan.introPrice && (
                    <Text style={styles.planIntro}>{plan.introPrice}</Text>
                  )}
                  {plan.savings && (
                    <Text style={styles.planSavings}>{plan.savings}</Text>
                  )}
                  {plan.pricePerUnit && (
                    <Text style={styles.planPerUnit}>{plan.pricePerUnit}</Text>
                  )}
                </View>
              </View>

              <View style={styles.planFeatures}>
                <Text
                  style={[
                    styles.planFeaturesTitle,
                    { color: theme.tabIconDefault },
                  ]}
                >
                  What&apos;s included:
                </Text>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.planFeature}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.success}
                    />
                    <Text style={styles.planFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.disclosureText}>{renewalDisclosure}</Text>
          <Text style={[styles.includedText, { color: theme.tabIconDefault }]}>
            What&apos;s included: {PREMIUM_FEATURES.join(", ")}
          </Text>
          <View style={styles.legalLinksContainer}>
            <TouchableOpacity onPress={() => openUrl(TERMS_OF_SERVICE_URL)}>
              <Text style={[styles.legalLink, { color: theme.primary }]}>
                Terms of Use (EULA)
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.legalLinkSeparator,
                { color: theme.tabIconDefault },
              ]}
            >
              {" "}
              •{" "}
            </Text>
            <TouchableOpacity onPress={() => openUrl(PRIVACY_POLICY_URL)}>
              <Text style={[styles.legalLink, { color: theme.primary }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handlePurchase}
            disabled={purchasing || restoring || !selectedPlan}
          >
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.subscribeButton, { margin: 0 }]}
            >
              {purchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {subscribeButtonText}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={purchasing || restoring}
          >
            {restoring ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
