import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { COLORS } from '../../config/constants';
import { Sidebar } from './Sidebar';

interface WebLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function WebLayout({ children, showSidebar = true }: WebLayoutProps) {
  const { isDesktop, isTablet, isWeb } = useResponsive();

  // On mobile or native, just render children directly
  if (!isWeb || (!isDesktop && !isTablet)) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {showSidebar && (isDesktop || isTablet) && <Sidebar collapsed={isTablet} />}
      <View style={styles.mainContent}>
        {children}
      </View>
    </View>
  );
}

interface ContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}

const MAX_WIDTHS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  full: '100%',
} as const;

export function Container({ children, maxWidth = 'lg', padding = true }: ContainerProps) {
  const { isWeb } = useResponsive();

  const containerStyle = [
    styles.contentContainer,
    {
      maxWidth: MAX_WIDTHS[maxWidth],
      paddingHorizontal: padding ? (isWeb ? 24 : 16) : 0,
    },
  ];

  return <View style={containerStyle}>{children}</View>;
}

interface CardGridProps {
  children: ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function CardGrid({ children, columns = { xs: 1, sm: 2, md: 3, lg: 4 } }: CardGridProps) {
  const { breakpoint, isWeb } = useResponsive();

  const getColumns = (): number => {
    switch (breakpoint) {
      case 'xl':
        return columns.xl ?? columns.lg ?? columns.md ?? 4;
      case 'lg':
        return columns.lg ?? columns.md ?? 3;
      case 'md':
        return columns.md ?? 2;
      case 'sm':
        return columns.sm ?? 2;
      default:
        return columns.xs ?? 1;
    }
  };

  const numColumns = getColumns();

  if (!isWeb || numColumns === 1) {
    return <View style={styles.cardGridSingle}>{children}</View>;
  }

  return (
    <View style={[styles.cardGrid, { gap: 16 }]}>
      {React.Children.map(children, (child, index) => (
        <View
          style={[
            styles.cardGridItem,
            {
              flexBasis: `${100 / numColumns}%`,
              maxWidth: `${100 / numColumns}%`,
            },
          ]}
          key={index}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { isDesktop } = useResponsive();

  return (
    <View style={[styles.pageHeader, isDesktop && styles.pageHeaderDesktop]}>
      <View style={styles.pageHeaderText}>
        <View style={styles.pageTitle}>
          {/* Title will be rendered by parent */}
        </View>
        {subtitle && (
          <View style={styles.pageSubtitle}>
            {/* Subtitle will be rendered by parent */}
          </View>
        )}
      </View>
      {actions && <View style={styles.pageHeaderActions}>{actions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  contentContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardGridSingle: {
    flexDirection: 'column',
  },
  cardGridItem: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  pageHeader: {
    flexDirection: 'column',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  pageHeaderDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pageHeaderText: {
    flex: 1,
  },
  pageTitle: {},
  pageSubtitle: {
    marginTop: 4,
  },
  pageHeaderActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
