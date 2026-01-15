import Purchases, { LOG_LEVEL, PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'test_VuKiYKHZIagZNWUqTtxfCQColuV';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Product IDs
export const PRODUCT_IDS = {
  MONTHLY_SUBSCRIPTION: 'com.adventuretime.premium.monthly',
};

// Entitlement IDs (configured in RevenueCat dashboard)
export const ENTITLEMENT_IDS = {
  PREMIUM: 'premium',
};

export const initializeRevenueCat = async () => {
  try {
    // Configure RevenueCat
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE); // Set to INFO in production
    
    const apiKey = Platform.select({
      ios: REVENUECAT_IOS_KEY,
      android: REVENUECAT_ANDROID_KEY,
    });

    if (!apiKey) {
      console.error('RevenueCat API key not configured');
      return false;
    }

    await Purchases.configure({ apiKey });
    
    // Optional: Set user ID if you have your own user system
    // await Purchases.logIn(userId);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
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
    console.error('Error fetching offerings:', error);
    return null;
  }
};

export const purchaseMonthlySubscription = async () => {
  try {
    const offerings = await getOfferings();
    if (!offerings) {
      throw new Error('No offerings available');
    }
    
    // Find the monthly package
    const monthlyPackage = offerings.availablePackages.find(
      pkg => pkg.product.identifier === PRODUCT_IDS.MONTHLY_SUBSCRIPTION
    );
    
    if (!monthlyPackage) {
      throw new Error('Monthly subscription not available');
    }
    
    const { customerInfo } = await Purchases.purchasePackage(monthlyPackage);
    return customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Purchase error:', error);
      throw error;
    }
    return false;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined;
  } catch (error) {
    console.error('Restore error:', error);
    throw error;
  }
};

export const checkPremiumStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};
