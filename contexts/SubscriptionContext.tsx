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
  purchaseSubscription as purchaseSubscriptionFromRevenueCat,
  restorePurchases,
  ENTITLEMENT_IDS,
  PRODUCT_IDS,
  getRevenueCatInitError,
} from "@/config/revenuecat";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  purchaseSubscription: (productIdentifier?: string) => Promise<boolean>;
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
      const hasPremium = !!info.entitlements.active[ENTITLEMENT_IDS.PREMIUM];
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
          const initError = getRevenueCatInitError();
          console.warn(
            "RevenueCat not initialized:",
            initError || "Unknown initialization failure",
          );
          setIsPremium(false);
        }
      } catch (error) {
        console.error("Error initializing subscriptions:", error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    initSubscriptions();
  }, []);

  const purchaseSubscription = async (
    productIdentifier: string = PRODUCT_IDS.MONTHLY_SUBSCRIPTION,
  ): Promise<boolean> => {
    const success = await purchaseSubscriptionFromRevenueCat(productIdentifier);
    if (success) {
      await refreshStatus();
    }
    return success;
  };

  const restore = async (): Promise<boolean> => {
    const success = await restorePurchases();
    if (success) {
      await refreshStatus();
    }
    return success;
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
