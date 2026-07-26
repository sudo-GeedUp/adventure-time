import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initializeFirebase } from "@/config/firebase";
import { initializeAuth } from "@/utils/firebaseHelpers";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { sentryService } from "@/services/sentryService";
import { analyticsService } from "@/services/analyticsService";
import { notificationService } from "@/services/notificationService";

export default function App() {
  useEffect(() => {
    // Initialize services in background (non-blocking)
    const init = async () => {
      try {
        console.log("App initialization starting in background...");

        // Initialize Sentry for crash reporting (optional)
        try {
          sentryService.initialize();
        } catch {
          console.log("Sentry initialization skipped");
        }

        // Initialize Firebase (optional - app works without it)
        try {
          const firebaseServices = await initializeFirebase();
          if (firebaseServices && firebaseServices.auth) {
            initializeAuth(firebaseServices.auth);
          }
        } catch {
          console.log("Firebase initialization skipped");
        }

        // Initialize analytics
        analyticsService.initialize();

        // Initialize notifications
        notificationService.initialize();

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
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <NavigationContainer>
            <ErrorBoundary>
              <AuthProvider>
                <SubscriptionProvider>
                  <RootNavigator />
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
