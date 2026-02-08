import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import Purchases, { CustomerInfo } from "react-native-purchases";
import {
  initializeRevenueCat,
  checkPremiumStatus,
  purchaseMonthlySubscription,
  restorePurchases,
  ENTITLEMENT_IDS,
} from "@/config/revenuecat";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  purchaseSubscription: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const refreshStatus = async () => {
    try {
      if (Platform.OS === "web") {
        // Web users get free access (no IAP on web)
        setIsPremium(true);
        return;
      }
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      const hasPremium =
        info.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined;
      setIsPremium(hasPremium);
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
      setIsPremium(false);
    }
  };

  useEffect(() => {
    const initSubscriptions = async () => {
      try {
        if (Platform.OS === "web") {
          // Web platform - no RevenueCat, grant free access
          setIsPremium(true);
          setIsLoading(false);
          return;
        }

        // Initialize RevenueCat for mobile platforms
        const initialized = await initializeRevenueCat();
        if (initialized) {
          await refreshStatus();
        } else {
          // If RevenueCat fails to initialize on mobile, default to non-premium
          console.warn("RevenueCat not initialized, defaulting to non-premium");
          setIsPremium(false);
        }
      } catch (error) {
        console.error("Error initializing subscriptions:", error);
        // On error, default to non-premium on mobile
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    initSubscriptions();
  }, []);

  const purchaseSubscription = async (): Promise<boolean> => {
    try {
      const success = await purchaseMonthlySubscription();
      if (success) {
        await refreshStatus();
      }
      return success;
    } catch (error) {
      console.error("Purchase failed:", error);
      return false;
    }
  };

  const restore = async (): Promise<boolean> => {
    try {
      const success = await restorePurchases();
      if (success) {
        await refreshStatus();
      }
      return success;
    } catch (error) {
      console.error("Restore failed:", error);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        customerInfo,
        purchaseSubscription,
        restore,
        refreshStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};
