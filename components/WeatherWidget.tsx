import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { WeatherService, WeatherData } from '@/utils/firebase';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  compact?: boolean;
}

export default function WeatherWidget({ latitude, longitude, compact = false }: WeatherWidgetProps) {
  const { theme } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadWeather();
  }, [latitude, longitude]);

  const loadWeather = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await WeatherService.getWeather(latitude, longitude);
      if (data) {
        setWeather(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading weather:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, compact ? styles.compactContainer : {}, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (error || !weather) {
    return (
      <View style={[styles.container, compact ? styles.compactContainer : {}, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="cloud-off" size={20} color={theme.tabIconDefault} />
        <ThemedText style={[styles.errorText, { color: theme.tabIconDefault }]}>
          Weather unavailable
        </ThemedText>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.container, styles.compactContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Image
          source={{ uri: WeatherService.getWeatherIconUrl(weather.icon) }}
          style={styles.compactIcon}
        />
        <ThemedText style={[Typography.h4, { color: theme.text }]}>
          {weather.temperature}°F
        </ThemedText>
        <ThemedText style={[styles.compactCondition, { color: theme.tabIconDefault }]}>
          {weather.condition}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <Feather name="cloud" size={20} color={theme.primary} />
        <ThemedText style={[Typography.h4, { marginLeft: Spacing.sm }]}>
          Current Weather
        </ThemedText>
      </View>

      <View style={styles.mainWeather}>
        <Image
          source={{ uri: WeatherService.getWeatherIconUrl(weather.icon) }}
          style={styles.weatherIcon}
        />
        <View style={styles.mainInfo}>
          <ThemedText style={[styles.temperature, { color: theme.text }]}>
            {weather.temperature}°F
          </ThemedText>
          <ThemedText style={[styles.condition, { color: theme.text }]}>
            {weather.condition}
          </ThemedText>
          <ThemedText style={[styles.description, { color: theme.tabIconDefault }]}>
            {weather.description}
          </ThemedText>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Feather name="droplet" size={16} color={theme.accent} />
          <ThemedText style={[styles.detailLabel, { color: theme.tabIconDefault }]}>
            Humidity
          </ThemedText>
          <ThemedText style={[styles.detailValue, { color: theme.text }]}>
            {weather.humidity}%
          </ThemedText>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailItem}>
          <Feather name="wind" size={16} color={theme.accent} />
          <ThemedText style={[styles.detailLabel, { color: theme.tabIconDefault }]}>
            Wind
          </ThemedText>
          <ThemedText style={[styles.detailValue, { color: theme.text }]}>
            {weather.windSpeed} mph
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  weatherIcon: {
    width: 80,
    height: 80,
    marginRight: Spacing.md,
  },
  compactIcon: {
    width: 40,
    height: 40,
  },
  mainInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  condition: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  compactCondition: {
    fontSize: 12,
  },
  details: {
    flexDirection: 'row',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
});
