import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import VehicleMaintenanceScreen from "@/screens/VehicleMaintenanceScreen";
import FriendsScreen from "@/screens/FriendsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Subscription: undefined;
  VehicleMaintenance: undefined;
  Friends: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          title: "Premium Subscription",
        }}
      />
      <Stack.Screen
        name="VehicleMaintenance"
        component={VehicleMaintenanceScreen}
        options={{
          title: "Vehicle Maintenance",
        }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          title: "Friends & Community",
        }}
      />
    </Stack.Navigator>
  );
}
