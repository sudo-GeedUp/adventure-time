import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NavigateScreen from "@/screens/NavigateScreen";
import LiveMapScreen from "@/screens/LiveMapScreen";
import ActiveAdventureScreen from "@/screens/ActiveAdventureScreen";
import { useTheme } from "@/hooks/useTheme";
import { Trail } from "@/utils/trails";

export type NavigateStackParamList = {
  LiveMap: undefined;
  NavigateMain: undefined;
  ActiveAdventure: { trail: Trail };
};

const Stack = createNativeStackNavigator<NavigateStackParamList>();

export default function NavigateStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.backgroundRoot,
        },
      }}
    >
      <Stack.Screen
        name="LiveMap"
        component={LiveMapScreen}
        options={{
          title: "Live Map",
        }}
      />
      <Stack.Screen
        name="NavigateMain"
        component={NavigateScreen}
        options={{
          title: "Navigate",
        }}
      />
      <Stack.Screen
        name="ActiveAdventure"
        component={ActiveAdventureScreen}
        options={{
          title: "Adventure",
        }}
      />
    </Stack.Navigator>
  );
}
