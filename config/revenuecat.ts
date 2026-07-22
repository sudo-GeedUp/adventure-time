import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  CustomerInfo,
} from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat API Keys
// Use platform-specific public SDK keys from the RevenueCat dashboard.
// iOS production keys start with `appl_`; Android keys start with `goog_`.
// Test Store keys (`test_`) will crash in release builds and must not be used.
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "";
const REVENUECAT_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "";

const isTestApiKey = (key: string | undefined) =>
  !!key && key.startsWith("test_");

let revenueCatConfigured = false;

export const isRevenueCatConfigured = () => revenueCatConfigured;

export const getRevenueCatInitError = () => {
  if (Platform.OS === "web") return null;
  const apiKey = Platform.select({
    ios: REVENUECAT_IOS_KEY,
    android: REVENUECAT_ANDROID_KEY,
  });
  if (!apiKey) return "RevenueCat API key is not configured.";
  if (isTestApiKey(apiKey))
    return "RevenueCat Test Store key is not allowed in release builds.";
  return null;
};

// Product IDs
// These must exactly match product identifiers in App Store Connect / RevenueCat.
export const PRODUCT_IDS = {
  MONTHLY_SUBSCRIPTION: "com.masongallegos.itsadventuretime.premium.monthly.v2",
  YEARLY_SUBSCRIPTION: "com.masongallegos.itsadventuretime.premium.yearly.v2",
};

// Entitlement IDs (configured in RevenueCat dashboard)
export const ENTITLEMENT_IDS = {
  PREMIUM: "It's Adventure Time Pro",
};

export const initializeRevenueCat = async () => {
  try {
    // RevenueCat is not supported on web
    if (Platform.OS === "web") {
      console.log("RevenueCat not available on web platform");
      return false;
    }

    const apiKey = Platform.select({
      ios: REVENUECAT_IOS_KEY,
      android: REVENUECAT_ANDROID_KEY,
    });

    if (!apiKey) {
      console.warn(
        "RevenueCat API key not configured; subscription features disabled.",
      );
      return false;
    }

    if (isTestApiKey(apiKey)) {
      console.warn(
        "RevenueCat Test Store API key detected in a release build. Skipping RevenueCat to prevent a crash. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY to your iOS public SDK key (appl_...).",
      );
      return false;
    }

    // Configure RevenueCat
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);

    await Purchases.configure({ apiKey });
    revenueCatConfigured = true;

    // Optional: Set user ID if you have your own user system
    // await Purchases.logIn(userId);

    return true;
  } catch (error) {
    console.error("Failed to initialize RevenueCat:", error);
    return false;
  }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current;
    }
    return null;
  } catch (error) {
    console.error("Error fetching offerings:", error);
    return null;
  }
};

export const purchaseSubscription = async (
  productIdentifier: string = PRODUCT_IDS.MONTHLY_SUBSCRIPTION,
): Promise<CustomerInfo | null> => {
  try {
    if (!revenueCatConfigured) {
      throw new Error(
        getRevenueCatInitError() || "RevenueCat is not configured.",
      );
    }
    const offerings = await getOfferings();
    if (!offerings) {
      throw new Error(
        "No subscription offerings available. " +
          "Verify your RevenueCat offering is linked to products in App Store Connect.",
      );
    }

    const packageToBuy = offerings.availablePackages.find(
      (pkg) => pkg.product.identifier === productIdentifier,
    );

    if (!packageToBuy) {
      throw new Error(
        `Subscription product "${productIdentifier}" was not found in the current offering. ` +
          "Check that the product ID matches App Store Connect / RevenueCat and is approved.",
      );
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    return customerInfo;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error("Purchase error:", error);
      throw error;
    }
    return null;
  }
};

export const purchaseMonthlySubscription = async () =>
  purchaseSubscription(PRODUCT_IDS.MONTHLY_SUBSCRIPTION);

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    if (!revenueCatConfigured) {
      throw new Error(
        getRevenueCatInitError() || "RevenueCat is not configured.",
      );
    }
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error("Restore error:", error);
    throw error;
  }
};

export const checkPremiumStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM];
  } catch (error) {
    console.error("Error checking premium status:", error);
    return false;
  }
};
