import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'compact' | 'card';
}

export function EmptyState({
  icon = 'folder-open',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';
  const isCard = variant === 'card';

  return (
    <View
      style={[
        styles.container,
        isCompact && styles.containerCompact,
        isCard && styles.containerCard,
      ]}
    >
      <View style={[styles.iconContainer, isCompact && styles.iconContainerCompact]}>
        <MaterialCommunityIcons
          name={icon}
          size={isCompact ? 48 : 72}
          color={COLORS.gray300}
        />
      </View>

      <Text
        variant={isCompact ? 'titleMedium' : 'titleLarge'}
        style={styles.title}
      >
        {title}
      </Text>

      {description && (
        <Text
          variant="bodyMedium"
          style={[styles.description, isCompact && styles.descriptionCompact]}
        >
          {description}
        </Text>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <Button
              mode="contained"
              onPress={onAction}
              style={styles.actionButton}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              mode="outlined"
              onPress={onSecondaryAction}
              style={styles.actionButton}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  containerCompact: {
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  containerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainerCompact: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    color: COLORS.gray700,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
    lineHeight: 22,
  },
  descriptionCompact: {
    maxWidth: 260,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    minWidth: 120,
  },
});
