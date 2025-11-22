import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NearbyScreen from "@/screens/NearbyScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

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
