import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import ChatScreen from "@/screens/ChatScreen";
import WelcomeScreen from "@/screens/WelcomeScreen";
import { storage } from "@/utils/storage";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
  Chat: {
    participantId: string;
    participantName: string;
    participantVehicle: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await storage.getFirstLaunchDone();
      setIsFirstLaunch(!hasLaunched);
    };
    checkFirstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch ? (
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ gestureEnabled: false }}
        />
      ) : null}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          headerTitle: "",
        }}
      />
    </Stack.Navigator>
  );
}
