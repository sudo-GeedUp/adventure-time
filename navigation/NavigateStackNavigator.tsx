import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NavigateScreen from "@/screens/NavigateScreen";
import { useTheme } from "@/hooks/useTheme";

export type NavigateStackParamList = {
  NavigateMain: undefined;
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
    </Stack.Navigator>
  );
}
