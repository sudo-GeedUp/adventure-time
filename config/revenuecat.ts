import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  PACKAGE_TYPE,
} from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat API Keys
// WARNING: These are test keys only. Never use production keys in client-side code.
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

// Fallback test key for development only
const FALLBACK_TEST_KEY = __DEV__ ? "test_giauVpCRAVQIZDZJNmhNIhRDNaq" : "";

// Product IDs - must match what's configured in RevenueCat dashboard AND App Store Connect
export const PRODUCT_IDS = {
  MONTHLY_SUBSCRIPTION: "com.masongallegos.itsadventuretime.premium.monthly",
};

// Entitlement IDs (configured in RevenueCat dashboard)
export const ENTITLEMENT_IDS = {
  PREMIUM: "premium",
};

export const initializeRevenueCat = async () => {
  try {
    // Check for web browser environment more reliably
    const isWeb = typeof window !== 'undefined' && window.location;
    
    if (isWeb) {
      console.log("RevenueCat not available on web platform - using premium mode");
      return true;
    }

    // Configure RevenueCat for native platforms
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);

    const apiKey = Platform.select({
      ios: REVENUECAT_IOS_KEY || FALLBACK_TEST_KEY,
      android: REVENUECAT_ANDROID_KEY || FALLBACK_TEST_KEY,
    });

    if (!apiKey) {
      console.error("RevenueCat API key not configured");
      if (!__DEV__) {
        console.error(
          "Please set EXPO_PUBLIC_REVENUECAT_IOS_KEY and/or EXPO_PUBLIC_REVENUECAT_ANDROID_KEY in your environment",
        );
      }
      return false;
    }

    // Warn if using fallback key
    if (apiKey === FALLBACK_TEST_KEY && apiKey !== "") {
      console.warn(
        "WARNING: Using test RevenueCat key in development mode only!",
      );
    }

    await Purchases.configure({ apiKey });

    // For development, enable test mode
    if (__DEV__) {
      console.log("RevenueCat running in test mode");
    }

    return true;
  } catch (error) {
    console.error("Failed to initialize RevenueCat:", error);
    return false;
  }
};

export const OFFERING_ID = "com.masongallegos.itsadventuretime.premium.monthly";

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    // Try current offering first, then fall back to our specific offering by ID
    if (offerings.current !== null) {
      return offerings.current;
    }
    if (offerings.all[OFFERING_ID]) {
      return offerings.all[OFFERING_ID];
    }
    console.warn("No offering found in RevenueCat");
    return null;
  } catch (error) {
    console.error("Error fetching offerings:", error);
    return null;
  }
};

export const purchaseMonthlySubscription = async () => {
  try {
    const offerings = await getOfferings();
    if (!offerings) {
      throw new Error("No offerings available");
    }

    const monthlyPackage = offerings.availablePackages.find(
      (pkg) => pkg.packageType === PACKAGE_TYPE.MONTHLY,
    );

    if (!monthlyPackage) {
      throw new Error("Monthly subscription not available");
    }

    const { customerInfo } = await Purchases.purchasePackage(monthlyPackage);
    return (
      customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined
    );
  } catch (error: any) {
    if (error?.userCancelled !== true) {
      console.error("Purchase error:", error);
      throw error;
    }
    return false;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return (
      customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined
    );
  } catch (error) {
    console.error("Restore error:", error);
    throw error;
  }
};

export const checkPremiumStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return (
      customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined
    );
  } catch (error) {
    console.error("Error checking premium status:", error);
    return false;
  }
};
