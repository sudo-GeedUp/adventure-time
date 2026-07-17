import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SubscriptionScreen from "@/screens/SubscriptionScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type DonateStackParamList = {
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<DonateStackParamList>();

export default function DonateStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          title: "Premium Subscription",
        }}
      />
    </Stack.Navigator>
  );
}
