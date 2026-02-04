import React from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NavigateScreen from "@/screens/NavigateScreen";
import ActiveAdventureScreen from "@/screens/ActiveAdventureScreen";
import ActiveAdventureScreenWeb from "@/screens/ActiveAdventureScreen.web";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTheme } from "@/hooks/useTheme";
import { Trail } from "@/utils/trails";

// Define navigation prop types
type NavigationProp = any; // Using any for now since StackScreenProps is not available

// Wrapper components to prevent remounting on every render
const ActiveAdventureScreenWithBoundary = (props: NavigationProp) => (
  <ErrorBoundary>
    <ActiveAdventureScreen {...props} />
  </ErrorBoundary>
);

const ActiveAdventureScreenWebWithBoundary = (props: NavigationProp) => (
  <ErrorBoundary>
    <ActiveAdventureScreenWeb />
  </ErrorBoundary>
);

// Conditionally import LiveMapScreen based on platform
const LiveMapScreen =
  Platform.OS !== "web" ? require("@/screens/LiveMapScreen").default : null;

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
          component={ActiveAdventureScreenWithBoundary}
          options={{
            title: "Adventure",
          }}
        />
      )}
      {Platform.OS === "web" && (
        <Stack.Screen
          name="ActiveAdventure"
          component={ActiveAdventureScreenWebWithBoundary}
          options={{
            title: "Adventure",
          }}
        />
      )}
    </Stack.Navigator>
  );
}
