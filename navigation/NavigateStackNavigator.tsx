import React from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NavigateScreen from "@/screens/NavigateScreen";
import ActiveAdventureScreen from "@/screens/ActiveAdventureScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTheme } from "@/hooks/useTheme";
import { Trail } from "@/utils/trails";

// Conditionally import screens based on platform
const LiveMapScreen =
  Platform.OS !== "web" ? require("@/screens/LiveMapScreen").default : null;
const ActiveAdventureScreenWeb =
  Platform.OS === "web" ? require("@/screens/ActiveAdventureScreen.web").default : null;

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
          component={(props: any) => (
            <ErrorBoundary>
              <ActiveAdventureScreen {...props} />
            </ErrorBoundary>
          )}
          options={{
            title: "Adventure",
          }}
        />
      )}
      {Platform.OS === "web" && ActiveAdventureScreenWeb && (
        <Stack.Screen
          name="ActiveAdventure"
          component={ActiveAdventureScreenWeb}
          options={{
            title: "Adventure",
          }}
        />
      )}
    </Stack.Navigator>
  );
}
