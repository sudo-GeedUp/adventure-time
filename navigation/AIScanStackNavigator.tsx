import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AIScanScreen from "@/screens/AIScanScreen";
import AIResultsScreen from "@/screens/AIResultsScreen";
import GuidesScreen from "@/screens/GuidesScreen";
import GuideDetailScreen from "@/screens/GuideDetailScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type AIScanStackParamList = {
  AIScan: undefined;
  AIResults: { imageUri: string };
  Guides: undefined;
  GuideDetail: { guideId: string };
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
        options={{ headerTitle: "AI Recovery" }}
      />
      <Stack.Screen
        name="AIResults"
        component={AIResultsScreen}
        options={{ headerTitle: "Analysis Results" }}
      />
      <Stack.Screen
        name="Guides"
        component={GuidesScreen}
        options={{ headerTitle: "Recovery Guides" }}
      />
      <Stack.Screen
        name="GuideDetail"
        component={GuideDetailScreen}
        options={{ headerTitle: "Guide Details" }}
      />
    </Stack.Navigator>
  );
}
