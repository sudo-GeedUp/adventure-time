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

export default function App() {
  const [showSpecialThanks, setShowSpecialThanks] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Initialize Firebase
      const firebaseServices = await initializeFirebase();
      if (firebaseServices && firebaseServices.auth) {
        await initializeAuth(firebaseServices.auth);
      }

      // Check if special thanks has been shown
      const hasSeenThanks = await storage.getSpecialThanksShown();
      if (!hasSeenThanks) {
        setShowSpecialThanks(true);
      }
    };
    init();
  }, []);

  const handleCloseThanks = async () => {
    await storage.setSpecialThanksShown();
    setShowSpecialThanks(false);
  };

  return (
  <ErrorBoundary>
    <SafeAreaProvider>
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
