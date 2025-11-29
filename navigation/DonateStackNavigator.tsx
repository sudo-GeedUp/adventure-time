import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DonateScreen from "@/screens/DonateScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type DonateStackParamList = {
  Donate: undefined;
};

const Stack = createNativeStackNavigator<DonateStackParamList>();

export default function DonateStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Donate"
        component={DonateScreen}
        options={{
          title: "Support Adventure Time",
        }}
      />
    </Stack.Navigator>
  );
}
