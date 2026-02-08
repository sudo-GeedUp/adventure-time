import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTheme } from "@/hooks/useTheme";

interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  period: string;
  savings?: string;
  popular?: boolean;
  features: string[];
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    title: "Monthly",
    price: "$9.99",
    period: "/month",
    features: [
      "AI Recovery Scan",
      "Unlimited Adventures",
      "Trail Updates & Events",
      "Community Trail Data",
      "Rally Navigator",
      "Offline Maps",
      "Priority Support",
    ],
  },
  {
    id: "yearly",
    title: "Yearly",
    price: "$79.99",
    period: "/year",
    savings: "Save 33%",
    popular: true,
    features: [
      "Everything in Monthly",
      "Advanced Analytics",
      "Custom Trail Routes",
      "Export Adventure Data",
      "Early Access to Features",
      "Ad-Free Experience",
      "Exclusive Community Badge",
    ],
  },
];

const PREMIUM_FEATURES = [
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

export default function PaywallScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { purchaseSubscription, restore, isLoading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>("yearly");
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const success = await purchaseSubscription();
      if (success) {
        Alert.alert(
          "Welcome to Premium! 🎉",
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
          "Purchases Restored! ✅",
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
      marginBottom: 12,
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
    planSavings: {
      fontSize: 12,
      color: theme.success,
      fontWeight: "600",
      marginTop: 4,
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
    ctaSection: {
      paddingHorizontal: 20,
      marginBottom: 20,
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
  });

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
          {PREMIUM_FEATURES.map((feature, index) => (
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

          {SUBSCRIPTION_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
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
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View>
                  <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                  {plan.savings && (
                    <Text style={styles.planSavings}>{plan.savings}</Text>
                  )}
                </View>
              </View>

              <View style={styles.planFeatures}>
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
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handlePurchase}
            disabled={purchasing || restoring}
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
                <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            7-day free trial, then{" "}
            {selectedPlan === "yearly" ? "$79.99/year" : "$9.99/month"}.{"\n"}
            Cancel anytime. Auto-renews unless cancelled.{"\n"}
            <Text style={styles.footerLink}>Terms of Service</Text> •{" "}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
