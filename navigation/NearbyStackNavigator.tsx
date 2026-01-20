import React from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

// Conditionally import NearbyScreen only on native platforms
const NearbyScreen = Platform.OS !== "web" 
  ? require("@/screens/NearbyScreen").default 
  : null;

export type NearbyStackParamList = {
  Nearby: undefined;
};

const Stack = createNativeStackNavigator<NearbyStackParamList>();

export default function NearbyStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Nearby"
        component={NearbyScreen}
        options={{ headerTitle: "Nearby Offroaders" }}
      />
    </Stack.Navigator>
  );
}
