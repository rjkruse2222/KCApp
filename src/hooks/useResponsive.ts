import { useState, useEffect } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Breakpoints (similar to Tailwind CSS)
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

interface WindowDimensions {
  width: number;
  height: number;
}

interface ResponsiveInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  breakpoint: Breakpoint;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Get the current breakpoint based on window width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Get the device type based on window width
 */
function getDeviceType(width: number): DeviceType {
  if (width >= BREAKPOINTS.lg) return 'desktop';
  if (width >= BREAKPOINTS.md) return 'tablet';
  return 'mobile';
}

/**
 * Hook to get responsive information about the current window
 */
export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState<WindowDimensions>(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const deviceType = getDeviceType(width);
  const breakpoint = getBreakpoint(width);
  const isWeb = Platform.OS === 'web';

  return {
    width,
    height,
    deviceType,
    breakpoint,
    isWeb,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isPortrait: height > width,
    isLandscape: width > height,
  };
}

/**
 * Hook to check if the current breakpoint matches or is larger than the specified breakpoint
 */
export function useBreakpoint(minBreakpoint: Breakpoint): boolean {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[minBreakpoint];
}

/**
 * Hook to get platform-specific values
 */
export function usePlatformValue<T>(values: {
  web?: T;
  native?: T;
  ios?: T;
  android?: T;
  default: T;
}): T {
  if (Platform.OS === 'web' && values.web !== undefined) {
    return values.web;
  }
  if (Platform.OS === 'ios' && values.ios !== undefined) {
    return values.ios;
  }
  if (Platform.OS === 'android' && values.android !== undefined) {
    return values.android;
  }
  if (Platform.OS !== 'web' && values.native !== undefined) {
    return values.native;
  }
  return values.default;
}

/**
 * Get responsive value based on breakpoint
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  default: T;
}): T {
  const { breakpoint } = useResponsive();

  // Check from current breakpoint down to xs
  const breakpointOrder: Breakpoint[] = ['xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }

  return values.default;
}

/**
 * Check if we're running in a browser (SSR-safe)
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && Platform.OS === 'web';
}

/**
 * Get window dimensions (SSR-safe)
 */
export function getWindowDimensions(): WindowDimensions {
  if (isBrowser()) {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  const { width, height } = Dimensions.get('window');
  return { width, height };
}
