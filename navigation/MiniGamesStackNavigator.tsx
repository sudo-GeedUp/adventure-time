import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MiniGamesScreen from '@/screens/MiniGamesScreen';
import AntGameScreen from '@/screens/AntGameScreen';
import { useTheme } from '@/hooks/useTheme';
import { getCommonScreenOptions } from './screenOptions';

export type MiniGamesStackParamList = {
  MiniGamesHome: undefined;
  AntGame: undefined;
};

const Stack = createNativeStackNavigator<MiniGamesStackParamList>();

export default function MiniGamesStackNavigator() {
  const { theme, isDark } = useTheme();
  
  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="MiniGamesHome"
        component={MiniGamesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AntGame"
        component={AntGameScreen}
        options={{
          title: 'Ant Smasher',
          headerBackTitle: 'Games',
        }}
      />
    </Stack.Navigator>
  );
}
