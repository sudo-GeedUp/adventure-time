import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { NavigatorScreenParams } from "@react-navigation/native";
import MainTabNavigator, {
  MainTabParamList,
} from "@/navigation/MainTabNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import WelcomeScreen from "@/screens/WelcomeScreen";
import PaywallScreen from "@/screens/PaywallScreen";
import { storage } from "@/utils/storage";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { theme } = useTheme();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await storage.getFirstLaunchDone();
      setIsFirstLaunch(!hasLaunched);
    };
    checkFirstLaunch();
  }, []);

  if (authLoading || isFirstLaunch === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.backgroundDefault,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isFirstLaunch ? "Welcome" : "MainTabs"}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      {/* Presented on demand rather than gating the app. Guests keep full
          access to the local features; signing in is what unlocks the shared
          ones, so this is a modal the user can back out of. */}
      <Stack.Screen
        name="Auth"
        component={AuthStackNavigator}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
