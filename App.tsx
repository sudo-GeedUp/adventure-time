import React, { useEffect, useState } from "react";
import { StyleSheet, Platform } from "react-native";
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

import Purchases from "react-native-purchases";

export default function App() {
  const [showSpecialThanks, setShowSpecialThanks] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Render app immediately for testing
    setIsInitialized(true);

    // Initialize RevenueCat
    try {
      Purchases.configure({
        apiKey: Platform.select({
          ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
          android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
        }),
      });
      console.log("RevenueCat initialized");
    } catch (error) {
      console.log("RevenueCat failed to initialize:", error);
    }

    // Initialize services in background (non-blocking)
    const init = async () => {
      try {
        console.log("App initialization starting in background...");

        // Initialize Sentry for crash reporting (optional)
        try {
          sentryService.initialize();
        } catch (error) {
          console.log("Sentry initialization skipped");
        }

        // Initialize Firebase (optional - app works without it)
        try {
          const firebaseServices = await initializeFirebase();
          if (firebaseServices && firebaseServices.auth) {
            initializeAuth(firebaseServices.auth);
          }
        } catch (error) {
          console.log("Firebase initialization skipped");
        }

        // Initialize analytics
        analyticsService.initialize();

        // Initialize notifications
        notificationService.initialize();

        // Show special thanks modal once
        const hasSeenThanks = storage.getBoolean("hasSeenSpecialThanks");
        if (!hasSeenThanks) {
          setShowSpecialThanks(true);
          storage.set("hasSeenSpecialThanks", true);
        }

        console.log("Background initialization complete");
      } catch (error) {
        console.log("Background initialization failed:", error);
      }
    };

    init();

    // Cleanup
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <NavigationContainer>
            <ErrorBoundary>
              <AuthProvider>
                <SubscriptionProvider>
                  <RootNavigator />
                  <SpecialThanksModal
                    visible={showSpecialThanks}
                    onClose={handleCloseThanks}
                  />
                </SubscriptionProvider>
              </AuthProvider>
            </ErrorBoundary>
          </NavigationContainer>
          <StatusBar style="light" />
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});

