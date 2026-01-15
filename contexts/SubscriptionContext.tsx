import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { 
  initializeRevenueCat, 
  checkPremiumStatus,
  purchaseMonthlySubscription,
  restorePurchases,
  ENTITLEMENT_IDS 
} from '@/config/revenuecat';

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  purchaseSubscription: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const refreshStatus = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      const hasPremium = info.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined;
      setIsPremium(hasPremium);
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      setIsPremium(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      const initialized = await initializeRevenueCat();
      
      if (initialized) {
        await refreshStatus();
        
        // Set up listener for customer info updates
        Purchases.addCustomerInfoUpdateListener((info) => {
          setCustomerInfo(info);
          const hasPremium = info.entitlements.active[ENTITLEMENT_IDS.PREMIUM] !== undefined;
          setIsPremium(hasPremium);
        });
      }
      
      setIsLoading(false);
    };

    initialize();

    return () => {
      // Clean up listener
      Purchases.removeCustomerInfoUpdateListener(() => {});
    };
  }, []);

  const purchaseSubscription = async (): Promise<boolean> => {
    try {
      const success = await purchaseMonthlySubscription();
      if (success) {
        await refreshStatus();
      }
      return success;
    } catch (error) {
      console.error('Purchase failed:', error);
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
      console.error('Restore failed:', error);
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
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
