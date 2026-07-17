import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

export default function NearbyScreen() {
  const { theme } = useTheme();

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <Feather name="compass" size={64} color={theme.tabIconDefault} style={styles.icon} />
        <ThemedText style={[Typography.h3, styles.title]}>
          Nearby Features Unavailable
        </ThemedText>
        <ThemedText style={[Typography.body, styles.message, { color: theme.text }]}>
          Location-based features require GPS and are only available on mobile devices.
          {'\n\n'}
          Use the iOS or Android app to discover nearby trails and adventures.
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
