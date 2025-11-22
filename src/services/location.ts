import * as ExpoLocation from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Location } from '../types';
import { APP_CONFIG } from '../config/constants';

const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationPermissionStatus {
  foreground: boolean;
  background: boolean;
}

class LocationServiceClass {
  private locationSubscription: ExpoLocation.LocationSubscription | null = null;
  private onLocationUpdate: ((location: Location) => void) | null = null;

  // Request location permissions
  async requestPermissions(): Promise<LocationPermissionStatus> {
    const { status: foregroundStatus } =
      await ExpoLocation.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      return { foreground: false, background: false };
    }

    const { status: backgroundStatus } =
      await ExpoLocation.requestBackgroundPermissionsAsync();

    return {
      foreground: foregroundStatus === 'granted',
      background: backgroundStatus === 'granted',
    };
  }

  // Check current permission status
  async checkPermissions(): Promise<LocationPermissionStatus> {
    const foreground = await ExpoLocation.getForegroundPermissionsAsync();
    const background = await ExpoLocation.getBackgroundPermissionsAsync();

    return {
      foreground: foreground.status === 'granted',
      background: background.status === 'granted',
    };
  }

  // Get current location
  async getCurrentLocation(): Promise<Location> {
    const location = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.High,
    });

    const address = await this.reverseGeocode(
      location.coords.latitude,
      location.coords.longitude
    );

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
      timestamp: new Date(location.timestamp).toISOString(),
    };
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
    try {
      const results = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        const parts = [
          result.streetNumber,
          result.street,
          result.city,
          result.region,
          result.postalCode,
        ].filter(Boolean);
        return parts.join(', ');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    return undefined;
  }

  // Start foreground location tracking
  async startForegroundTracking(
    onUpdate: (location: Location) => void
  ): Promise<void> {
    this.onLocationUpdate = onUpdate;

    this.locationSubscription = await ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: APP_CONFIG.locationTracking.timeInterval,
        distanceInterval: APP_CONFIG.locationTracking.distanceInterval,
      },
      async (location) => {
        const formattedLocation: Location = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date(location.timestamp).toISOString(),
        };

        this.onLocationUpdate?.(formattedLocation);
      }
    );
  }

  // Stop foreground location tracking
  stopForegroundTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.onLocationUpdate = null;
  }

  // Start background location tracking
  async startBackgroundTracking(): Promise<void> {
    const permissions = await this.checkPermissions();
    if (!permissions.background) {
      throw new Error('Background location permission not granted');
    }

    await ExpoLocation.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: ExpoLocation.Accuracy.High,
      timeInterval: APP_CONFIG.locationTracking.timeInterval,
      distanceInterval: APP_CONFIG.locationTracking.distanceInterval,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'KCApp Mileage Tracking',
        notificationBody: 'Tracking your trip in the background',
        notificationColor: '#1a365d',
      },
    });
  }

  // Stop background location tracking
  async stopBackgroundTracking(): Promise<void> {
    const isTracking = await ExpoLocation.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    if (isTracking) {
      await ExpoLocation.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  }

  // Check if background tracking is active
  async isBackgroundTrackingActive(): Promise<boolean> {
    return await ExpoLocation.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  }

  // Calculate distance between two points in miles
  calculateDistance(loc1: Location, loc2: Location): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    const lat1 = this.toRad(loc1.latitude);
    const lat2 = this.toRad(loc2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const LocationService = new LocationServiceClass();

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: ExpoLocation.LocationObject[] };
    // Process background locations
    // This would typically update the mileage store through a global event or storage
    console.log('Background locations:', locations);
  }
});
