import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function LoadingSkeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = BorderRadius.sm,
  style 
}: LoadingSkeletonProps) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function TrailCardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <LoadingSkeleton height={200} borderRadius={BorderRadius.lg} style={{ marginBottom: Spacing.md }} />
      <LoadingSkeleton width="70%" height={24} style={{ marginBottom: Spacing.sm }} />
      <LoadingSkeleton width="40%" height={16} style={{ marginBottom: Spacing.md }} />
      <View style={styles.row}>
        <LoadingSkeleton width={80} height={32} borderRadius={BorderRadius.full} style={{ marginRight: Spacing.sm }} />
        <LoadingSkeleton width={80} height={32} borderRadius={BorderRadius.full} />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <LoadingSkeleton width={60} height={60} borderRadius={BorderRadius.md} style={{ marginRight: Spacing.md }} />
      <View style={{ flex: 1 }}>
        <LoadingSkeleton width="80%" height={18} style={{ marginBottom: Spacing.sm }} />
        <LoadingSkeleton width="50%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  cardContainer: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
