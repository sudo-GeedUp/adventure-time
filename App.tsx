import "expo-dev-client";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SpecialThanksModal from "@/components/SpecialThanksModal";
import { initializeFirebase } from "@/config/firebase";
import { initializeAuth } from "@/utils/firebaseHelpers";
import { storage } from "@/utils/storage";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { sentryService } from "@/services/sentryService";
import { analyticsService } from "@/services/analyticsService";
import { notificationService } from "@/services/notificationService";

export default function App() {
  const [showSpecialThanks, setShowSpecialThanks] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Render app immediately for testing
    setIsInitialized(true);
    
    // Initialize services in background (non-blocking)
    const init = async () => {
      try {
        console.log('App initialization starting in background...');
        
        // Initialize Sentry for crash reporting (optional)
        try {
          sentryService.initialize();
        } catch (error) {
          console.log('Sentry initialization skipped');
        }

        // Initialize Firebase (optional - app works without it)
        try {
          const firebaseServices = await initializeFirebase();
          if (firebaseServices && firebaseServices.auth) {
            await initializeAuth(firebaseServices.auth);
          }
        } catch (error) {
          console.log('Firebase initialization skipped - app will use local storage');
        }

        // Initialize Analytics (optional)
        try {
          analyticsService.initialize();
        } catch (error) {
          console.log('Analytics initialization skipped');
        }

        // Initialize Notifications (optional)
        try {
          await notificationService.initialize();
          notificationService.setupListeners(
            (notification) => {
              console.log('Notification received:', notification);
            },
            (response) => {
              console.log('Notification tapped:', response);
            }
          );
        } catch (error) {
          console.log('Notifications initialization skipped');
        }

        // Check if special thanks has been shown
        try {
          const hasSeenThanks = await storage.getSpecialThanksShown();
          if (!hasSeenThanks) {
            setShowSpecialThanks(true);
          }
        } catch (error) {
          console.log('Special thanks check skipped');
        }
        
        console.log('App initialization complete!');
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };
    
    init();

    return () => {
      try {
        notificationService.removeListeners();
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  const handleCloseThanks = async () => {
    await storage.setSpecialThanksShown();
    setShowSpecialThanks(false);
  };

  return (
  <ErrorBoundary>
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
              <StatusBar style="auto" />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
    <SpecialThanksModal visible={showSpecialThanks} onClose={handleCloseThanks} />
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
