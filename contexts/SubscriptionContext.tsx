import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
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
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const initializationPromiseRef = useRef<Promise<boolean> | null>(null);
  const identifiedUserIdRef = useRef<string | null>(null);
  const identityOperationRef = useRef(Promise.resolve());
  const userRef = useRef(user);
  userRef.current = user;

  const ensureInitialized = useCallback(() => {
    if (!initializationPromiseRef.current) {
      initializationPromiseRef.current = initializeRevenueCat();
    }
    return initializationPromiseRef.current;
  }, []);

  const refreshStatus = useCallback(async () => {
    const requestGeneration = ++generationRef.current;

    if (Platform.OS === "web") {
      // Web users get free access (no IAP on web)
      if (mountedRef.current && requestGeneration === generationRef.current) {
        setIsPremium(true);
      }
      return;
    }

    try {
      const info = await Purchases.getCustomerInfo();
      if (!mountedRef.current || requestGeneration !== generationRef.current) {
        return;
      }
      setCustomerInfo(info);
      const hasPremium = !!info.entitlements.active[ENTITLEMENT_IDS.PREMIUM];
      setIsPremium(hasPremium);
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
      // Don't clobber premium state on error; the SDK listener or a later refresh will update it.
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let customerInfoUpdateListener: ((info: CustomerInfo) => void) | null =
      null;

    const initSubscriptions = async () => {
      try {
        if (Platform.OS === "web") {
          // Web platform - no RevenueCat, grant free access
          if (mountedRef.current) {
            setIsPremium(true);
            setIsLoading(false);
          }
          return;
        }

        // Initialize RevenueCat for mobile platforms
        const initialized = await ensureInitialized();
        if (!mountedRef.current) return;
        if (initialized) {
          // Listen for background customer-info updates (pushes, restores, renewals)
          customerInfoUpdateListener = (info: CustomerInfo) => {
            generationRef.current += 1;
            if (!mountedRef.current) return;
            setCustomerInfo(info);
            setIsPremium(!!info.entitlements.active[ENTITLEMENT_IDS.PREMIUM]);
          };
          Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

          await refreshStatus();
        } else {
          const initError = getRevenueCatInitError();
          console.warn(
            "RevenueCat not initialized:",
            initError || "Unknown initialization failure",
          );
        }
      } catch (error) {
        console.error("Error initializing subscriptions:", error);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initSubscriptions();

    return () => {
      mountedRef.current = false;
      if (customerInfoUpdateListener) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
      }
    };
  }, [ensureInitialized, refreshStatus]);

  useEffect(() => {
    const syncRevenueCatIdentity = identityOperationRef.current.then(
      async () => {
        if (Platform.OS === "web" || !mountedRef.current) return;

        const initialized = await ensureInitialized();
        if (!initialized || !mountedRef.current) return;

        const nextUserId = userRef.current?.uid ?? null;
        if (nextUserId === identifiedUserIdRef.current) return;

        generationRef.current += 1;
        try {
          if (nextUserId) {
            await Purchases.logIn(nextUserId);
          } else {
            await Purchases.logOut();
          }

          if (!mountedRef.current) return;
          identifiedUserIdRef.current = nextUserId;
          await refreshStatus();
        } catch (error) {
          console.error("Error synchronizing RevenueCat user identity:", error);
        }
      },
    );
    identityOperationRef.current = syncRevenueCatIdentity.catch(() => {});
  }, [ensureInitialized, refreshStatus, user]);

  const updatePremiumFromCustomerInfo = useCallback(
    (info: CustomerInfo | null): boolean => {
      generationRef.current += 1;
      const activeEntitlements = Object.keys(info?.entitlements?.active ?? {});
      const hasPremium = !!info?.entitlements.active[ENTITLEMENT_IDS.PREMIUM];
      console.warn(
        "[SubscriptionContext] active entitlements:",
        activeEntitlements,
        "expected premium key:",
        ENTITLEMENT_IDS.PREMIUM,
        "hasPremium:",
        hasPremium,
      );
      if (mountedRef.current) {
        setIsPremium(hasPremium);
        setCustomerInfo(info);
      }
      return hasPremium;
    },
    [],
  );

  // Sync RevenueCat premium state to the local auth profile so AuthContext stays consistent
  useEffect(() => {
    const syncAuthPremium = async () => {
      try {
        if (!user) return;

        const entitlement =
          customerInfo?.entitlements.active[ENTITLEMENT_IDS.PREMIUM];
        const expiresAt = entitlement?.expirationDateMillis ?? undefined;
        await authService.setPremiumStatus(isPremium, expiresAt);
      } catch (error) {
        console.error("Error syncing premium status to auth profile:", error);
      }
    };

    syncAuthPremium();
  }, [isPremium, customerInfo, user]);

  const purchaseSubscription = async (
    productIdentifier: string = PRODUCT_IDS.MONTHLY_SUBSCRIPTION,
  ): Promise<boolean> => {
    const customerInfo =
      await purchaseSubscriptionFromRevenueCat(productIdentifier);
    const hasPremium = updatePremiumFromCustomerInfo(customerInfo);
    if (customerInfo) {
      // Background refresh for any additional metadata; don't block or clobber the purchase result
      refreshStatus().catch((error) => {
        console.warn("Background subscription refresh failed:", error);
      });
    }
    return hasPremium;
  };

  const restore = async (): Promise<boolean> => {
    const customerInfo = await restorePurchases();
    const hasPremium = updatePremiumFromCustomerInfo(customerInfo);
    if (customerInfo) {
      refreshStatus().catch((error) => {
        console.warn("Background subscription refresh failed:", error);
      });
    }
    return hasPremium;
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
