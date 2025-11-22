import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'large';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = COLORS.primary,
  trend,
  onPress,
  variant = 'default',
}: StatCardProps) {
  const Container = onPress ? Pressable : View;

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          card: styles.cardCompact,
          content: styles.contentCompact,
          value: styles.valueCompact,
          title: styles.titleCompact,
        };
      case 'large':
        return {
          card: styles.cardLarge,
          content: styles.contentLarge,
          value: styles.valueLarge,
          title: styles.titleLarge,
        };
      default:
        return {
          card: styles.cardDefault,
          content: styles.contentDefault,
          value: styles.valueDefault,
          title: styles.titleDefault,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Card style={[styles.card, variantStyles.card]}>
      <Container
        style={[styles.container, variantStyles.content]}
        onPress={onPress}
        disabled={!onPress}
      >
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <MaterialCommunityIcons name={icon} size={variant === 'large' ? 32 : 24} color={iconColor} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text variant="bodySmall" style={[styles.title, variantStyles.title]}>
            {title}
          </Text>
          <Text variant="headlineMedium" style={[styles.value, variantStyles.value]}>
            {value}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
          {trend && (
            <View style={styles.trendContainer}>
              <MaterialCommunityIcons
                name={trend.isPositive ? 'trending-up' : 'trending-down'}
                size={16}
                color={trend.isPositive ? COLORS.success : COLORS.error}
              />
              <Text
                style={[
                  styles.trendText,
                  { color: trend.isPositive ? COLORS.success : COLORS.error },
                ]}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </Text>
            </View>
          )}
        </View>
        {onPress && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={COLORS.gray400}
            style={styles.chevron}
          />
        )}
      </Container>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
  },
  cardDefault: {},
  cardCompact: {},
  cardLarge: {},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contentDefault: {},
  contentCompact: {
    padding: 12,
  },
  contentLarge: {
    padding: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  titleDefault: {
    fontSize: 11,
  },
  titleCompact: {
    fontSize: 10,
  },
  titleLarge: {
    fontSize: 12,
  },
  value: {
    fontWeight: '700',
    color: COLORS.gray900,
    marginTop: 4,
  },
  valueDefault: {
    fontSize: 24,
  },
  valueCompact: {
    fontSize: 20,
  },
  valueLarge: {
    fontSize: 32,
  },
  subtitle: {
    color: COLORS.gray500,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 8,
  },
});
