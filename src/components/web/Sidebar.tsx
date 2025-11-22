import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../config/constants';

interface SidebarProps {
  collapsed?: boolean;
}

interface NavItem {
  name: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: 'view-dashboard', route: 'Dashboard' },
  { name: 'TimeTracking', label: 'Time Tracking', icon: 'clock-outline', route: 'TimeTracking' },
  { name: 'Mileage', label: 'Mileage', icon: 'car', route: 'Mileage' },
  { name: 'Clients', label: 'Clients', icon: 'account-group', route: 'Clients' },
];

const bottomNavItems: NavItem[] = [
  { name: 'Settings', label: 'Settings', icon: 'cog', route: 'Settings' },
];

export function Sidebar({ collapsed = false }: SidebarProps) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, logout } = useAuthStore();

  const handleNavigation = (routeName: string) => {
    if (routeName === 'Settings') {
      navigation.navigate('Settings');
    } else {
      navigation.navigate('Main', { screen: routeName });
    }
  };

  const isActive = (routeName: string): boolean => {
    // Check if current route matches
    const state = navigation.getState();
    if (state?.routes) {
      const mainRoute = state.routes.find((r: any) => r.name === 'Main');
      if (mainRoute?.state?.routes) {
        const currentRoute = mainRoute.state.routes[mainRoute.state.index || 0];
        return currentRoute?.name === routeName;
      }
    }
    return route.name === routeName;
  };

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
      {/* Logo / Brand */}
      <View style={styles.brand}>
        <MaterialCommunityIcons name="calculator-variant" size={32} color={COLORS.primary} />
        {!collapsed && (
          <Text variant="titleLarge" style={styles.brandText}>
            KCApp
          </Text>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Main Navigation */}
      <View style={styles.nav}>
        {navItems.map((item) => (
          <Pressable
            key={item.name}
            style={[
              styles.navItem,
              isActive(item.route) && styles.navItemActive,
              collapsed && styles.navItemCollapsed,
            ]}
            onPress={() => handleNavigation(item.route)}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={isActive(item.route) ? COLORS.primary : COLORS.gray600}
            />
            {!collapsed && (
              <Text
                style={[
                  styles.navItemText,
                  isActive(item.route) && styles.navItemTextActive,
                ]}
              >
                {item.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Bottom Navigation */}
      <View style={styles.nav}>
        {bottomNavItems.map((item) => (
          <Pressable
            key={item.name}
            style={[
              styles.navItem,
              isActive(item.route) && styles.navItemActive,
              collapsed && styles.navItemCollapsed,
            ]}
            onPress={() => handleNavigation(item.route)}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={isActive(item.route) ? COLORS.primary : COLORS.gray600}
            />
            {!collapsed && (
              <Text
                style={[
                  styles.navItemText,
                  isActive(item.route) && styles.navItemTextActive,
                ]}
              >
                {item.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      <Divider style={styles.divider} />

      {/* User Profile */}
      <Pressable style={[styles.userSection, collapsed && styles.userSectionCollapsed]}>
        {user?.photoUrl ? (
          <Avatar.Image size={collapsed ? 32 : 40} source={{ uri: user.photoUrl }} />
        ) : (
          <Avatar.Text
            size={collapsed ? 32 : 40}
            label={initials}
            style={{ backgroundColor: COLORS.primary }}
          />
        )}
        {!collapsed && (
          <View style={styles.userInfo}>
            <Text variant="bodyMedium" numberOfLines={1} style={styles.userName}>
              {user?.displayName || 'User'}
            </Text>
            <Text variant="bodySmall" numberOfLines={1} style={styles.userEmail}>
              {user?.email}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Logout Button */}
      <Pressable
        style={[styles.logoutButton, collapsed && styles.logoutButtonCollapsed]}
        onPress={logout}
      >
        <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
        {!collapsed && (
          <Text style={styles.logoutText}>Sign Out</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
    paddingVertical: 16,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      position: 'sticky' as any,
      top: 0,
    }),
  },
  sidebarCollapsed: {
    width: 72,
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  brandText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  divider: {
    marginVertical: 16,
  },
  nav: {
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  navItemText: {
    fontSize: 15,
    color: COLORS.gray700,
  },
  navItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  userSectionCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: COLORS.gray800,
  },
  userEmail: {
    color: COLORS.gray500,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  logoutButtonCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 14,
  },
});
