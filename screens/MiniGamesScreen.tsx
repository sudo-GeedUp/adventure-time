import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type MiniGamesStackParamList = {
  MiniGamesHome: undefined;
  AntGame: undefined;
};

type NavigationProp = NativeStackNavigationProp<MiniGamesStackParamList>;

interface GameCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  screen: keyof MiniGamesStackParamList;
}

const games: GameCard[] = [
  {
    id: 'ant-game',
    title: 'Ant Smasher',
    description: 'Help your dog catch the running ants!',
    icon: 'target',
    screen: 'AntGame',
  },
];

export default function MiniGamesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Mini Games</Text>
        <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>
          Fun games for you and your pets
        </Text>
      </View>

      <View style={styles.gamesGrid}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => navigation.navigate(game.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Feather name={game.icon} size={32} color={theme.primary} />
            </View>
            <Text style={[styles.gameTitle, { color: theme.text }]}>{game.title}</Text>
            <Text style={[styles.gameDescription, { color: theme.tabIconDefault }]}>
              {game.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  gamesGrid: {
    padding: 16,
    gap: 16,
  },
  gameCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});
