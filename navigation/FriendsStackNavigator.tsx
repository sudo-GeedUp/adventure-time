import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FriendsScreen from "@/screens/FriendsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type FriendsStackParamList = {
  FriendsList: undefined;
};

const Stack = createNativeStackNavigator<FriendsStackParamList>();

export default function FriendsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="FriendsList"
        component={FriendsScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Friends" />,
        }}
      />
    </Stack.Navigator>
  );
}
