import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { TrailEvent } from '@/utils/firebase';

interface TrailEventCardProps {
  event: TrailEvent;
  onUpvote?: () => void;
  onDownvote?: () => void;
  onPress?: () => void;
}

export default function TrailEventCard({ event, onUpvote, onDownvote, onPress }: TrailEventCardProps) {
  const { theme } = useTheme();

  const getSeverityColor = () => {
    switch (event.severity) {
      case 'critical': return theme.error;
      case 'high': return theme.warning;
      case 'medium': return theme.accent;
      case 'low': return theme.tabIconDefault;
      default: return theme.tabIconDefault;
    }
  };

  const getEventIcon = () => {
    switch (event.type) {
      case 'warning': return 'alert-triangle';
      case 'closure': return 'x-circle';
      case 'condition': return 'cloud';
      case 'event': return 'calendar';
      default: return 'info';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getSeverityColor() + '20' }]}>
          <Feather name={getEventIcon() as any} size={20} color={getSeverityColor()} />
        </View>
        <View style={styles.headerText}>
          <ThemedText style={[Typography.h4, styles.title]}>{event.title}</ThemedText>
          <ThemedText style={[styles.meta, { color: theme.tabIconDefault }]}>
            {event.reportedByName} • {formatTimestamp(event.timestamp)}
          </ThemedText>
        </View>
        {event.verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
            <Feather name="check" size={12} color="white" />
          </View>
        )}
      </View>

      {/* Description */}
      <ThemedText style={[styles.description, { color: theme.text }]}>
        {event.description}
      </ThemedText>

      {/* Tags */}
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: getSeverityColor() + '20' }]}>
          <ThemedText style={[styles.tagText, { color: getSeverityColor() }]}>
            {event.severity.toUpperCase()}
          </ThemedText>
        </View>
        <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.tagText, { color: theme.tabIconDefault }]}>
            {event.type.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={onUpvote}
        >
          <Feather name="thumbs-up" size={16} color={theme.success} />
          <ThemedText style={[styles.actionText, { color: theme.success }]}>
            {event.upvotes}
          </ThemedText>
        </Pressable>
        
        <Pressable
          style={styles.actionButton}
          onPress={onDownvote}
        >
          <Feather name="thumbs-down" size={16} color={theme.error} />
          <ThemedText style={[styles.actionText, { color: theme.error }]}>
            {event.downvotes}
          </ThemedText>
        </Pressable>

        <View style={styles.spacer} />

        <Feather name="map-pin" size={16} color={theme.primary} />
        <ThemedText style={[styles.actionText, { color: theme.primary }]}>
          View on Map
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  meta: {
    fontSize: 12,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
});
