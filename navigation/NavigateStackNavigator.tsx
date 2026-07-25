import React from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NavigateScreen from "@/screens/NavigateScreen";
import ActiveAdventureScreen from "@/screens/ActiveAdventureScreen";
import { useTheme } from "@/hooks/useTheme";
import { CompletedAdventure } from "@/utils/storage";
import { Trail } from "@/utils/trails";

// Conditionally import LiveMapScreen only on native platforms
const LiveMapScreen =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Platform.OS !== "web" ? require("@/screens/LiveMapScreen").default : null;

export type NavigateStackParamList = {
  LiveMap: undefined;
  NavigateMain: undefined;
  ActiveAdventure: {
    trail: Trail;
    completedAdventure?: CompletedAdventure;
    targetRoute?: { latitude: number; longitude: number }[];
  };
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
        name="NavigateMain"
        component={NavigateScreen}
        options={{
          title: "Navigate",
        }}
      />
      {Platform.OS !== "web" && LiveMapScreen && (
        <Stack.Screen
          name="LiveMap"
          component={LiveMapScreen}
          options={{
            title: "Live Map",
          }}
        />
      )}
      {Platform.OS !== "web" && (
        <Stack.Screen
          name="ActiveAdventure"
          component={ActiveAdventureScreen}
          options={{
            title: "Adventure",
          }}
        />
      )}
    </Stack.Navigator>
  );
}
