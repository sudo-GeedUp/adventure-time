import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import ChatScreen from "@/screens/ChatScreen";
import WelcomeScreen from "@/screens/WelcomeScreen";
import PaywallScreen from "@/screens/PaywallScreen";
import { storage } from "@/utils/storage";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  MainTabs: undefined;
  Chat: {
    participantId: string;
    participantName: string;
    participantVehicle: string;
  };
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { theme } = useTheme();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await storage.getFirstLaunchDone();
      console.log("RootNavigator: First launch check:", !hasLaunched);
      setIsFirstLaunch(!hasLaunched);
    };
    checkFirstLaunch();
  }, []);

  console.log("RootNavigator: Rendering with state:", {
    isFirstLaunch,
    authLoading,
    isAuthenticated,
  });

  if (authLoading) {
    console.log("RootNavigator: Showing loading indicator");
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

  console.log(
    "RootNavigator: Rendering navigator - going directly to MainTabs",
  );

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          headerTitle: "",
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
