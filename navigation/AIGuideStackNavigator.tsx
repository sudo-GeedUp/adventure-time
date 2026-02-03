import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AIGuideScreen from "@/screens/AIGuideScreen";

export type AIGuideStackParamList = {
  AIGuideChat: undefined;
};

const Stack = createNativeStackNavigator<AIGuideStackParamList>();

export default function AIGuideStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AIGuideChat" component={AIGuideScreen} />
    </Stack.Navigator>
  );
}
