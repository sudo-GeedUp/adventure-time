import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AIScanScreen from "@/screens/AIScanScreen";
import AIResultsScreen from "@/screens/AIResultsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type AIScanStackParamList = {
  AIScan: undefined;
  AIResults: { imageUri: string };
};

const Stack = createNativeStackNavigator<AIScanStackParamList>();

export default function AIScanStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="AIScan"
        component={AIScanScreen}
        options={{ headerTitle: "AI Recovery Scan" }}
      />
      <Stack.Screen
        name="AIResults"
        component={AIResultsScreen}
        options={{ headerTitle: "Analysis Results" }}
      />
    </Stack.Navigator>
  );
}
