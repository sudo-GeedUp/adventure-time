import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
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
  const [isPremium, setIsPremium] = useState(true); // Always premium for testing
  const [isLoading, setIsLoading] = useState(false); // No loading needed
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const refreshStatus = async () => {
    try {
      if (Platform.OS === 'web') {
        setIsPremium(true);
        return;
      }
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
    // Always set premium to true for testing - no subscription checks needed
    console.log('Subscriptions: Premium access enabled for testing');
    setIsPremium(true);
    setIsLoading(false);
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
