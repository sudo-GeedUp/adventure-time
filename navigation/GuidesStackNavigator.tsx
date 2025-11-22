import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GuidesScreen from "@/screens/GuidesScreen";
import GuideDetailScreen from "@/screens/GuideDetailScreen";
import CommunityTipsScreen from "@/screens/CommunityTipsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type GuidesStackParamList = {
  Guides: undefined;
  GuideDetail: { guideId: string };
  CommunityTips: undefined;
};

const Stack = createNativeStackNavigator<GuidesStackParamList>();

export default function GuidesStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Guides"
        component={GuidesScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Adventure Time" />,
        }}
      />
      <Stack.Screen
        name="GuideDetail"
        component={GuideDetailScreen}
        options={{ headerTitle: "Guide" }}
      />
      <Stack.Screen
        name="CommunityTips"
        component={CommunityTipsScreen}
        options={{ headerTitle: "Community Tips" }}
      />
    </Stack.Navigator>
  );
}
