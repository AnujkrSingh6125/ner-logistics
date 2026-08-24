'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';

export type PermissionStatusType = 'granted' | 'prompt' | 'denied' | 'unavailable';

const STORAGE_KEY = 'ner_gps_tracking_enabled';

export interface UserLocationManagerState {
  isGpsEnabled: boolean;
  hasUserGrantedPermission: PermissionStatusType;
  userCoordinates: [number, number] | null; // [latitude, longitude]
  accuracy: number; // in meters
  heading: number | null; // in degrees (0-360)
  speed: number | null; // in km/h
  isNavigating: boolean;
  followMode: boolean;
  isSimulated: boolean;
  simulatedProgress: number; // 0 to 1
  error: string | null;
  statusMessage: string | null;
}

export function useUserLocationManager() {
  const [isGpsEnabled, setIsGpsEnabled] = useState<boolean>(false);
  const [hasUserGrantedPermission, setHasUserGrantedPermission] =
    useState<PermissionStatusType>('prompt');
  const [userCoordinates, setUserCoordinates] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(15);
  const [heading, setHeading] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(0);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [followMode, setFollowMode] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [simulatedProgress, setSimulatedProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevPositionRef = useRef<[number, number] | null>(null);

  // Compute bearing between two coordinates
  const calculateBearing = (start: [number, number], end: [number, number]): number => {
    const startPt = turf.point([start[1], start[0]]);
    const endPt = turf.point([end[1], end[0]]);
    const b = turf.bearing(startPt, endPt);
    return (b + 360) % 360;
  };

  // Helper to show temporary status message
  const triggerStatusNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Internal function to initiate browser geolocation watch
  const startBrowserWatch = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setHasUserGrantedPermission('unavailable');
      setError('HTML5 Geolocation is not supported by your device browser.');
      return;
    }

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulated(false);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const acc = position.coords.accuracy || 15;
      const spd = position.coords.speed !== null ? Math.round(position.coords.speed * 3.6) : null;

      let computedHeading = position.coords.heading;
      if (computedHeading === null || isNaN(computedHeading)) {
        if (prevPositionRef.current) {
          const dist = turf.distance(
            turf.point([prevPositionRef.current[1], prevPositionRef.current[0]]),
            turf.point([lng, lat]),
            { units: 'meters' }
          );
          if (dist > 3) {
            computedHeading = calculateBearing(prevPositionRef.current, [lat, lng]);
          }
        }
      }

      prevPositionRef.current = [lat, lng];
      setUserCoordinates([lat, lng]);
      setAccuracy(acc);
      setHeading(
        computedHeading !== null && !isNaN(computedHeading) ? Math.round(computedHeading) : null
      );
      setSpeed(spd);
      setHasUserGrantedPermission('granted');
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('[GPS MANAGER WARNING]:', err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setHasUserGrantedPermission('denied');
        setIsGpsEnabled(false);
        setError('Location permission was denied in browser settings.');
        triggerStatusNotice('GPS permission denied. Using manual origin selection.');
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError('GPS position is currently unavailable.');
      } else if (err.code === err.TIMEOUT) {
        setError('GPS signal acquisition timed out. Retrying...');
      }
    };

    // Single immediate fix + continuous watch
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
  }, []);

  // 1. Enable GPS Tracking
  const enableGpsTracking = useCallback(() => {
    setIsGpsEnabled(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (e) {
        // Storage notice
      }
    }
    startBrowserWatch();
    triggerStatusNotice('🛰️ Live GPS tracking enabled. Connected to telemetry.');
  }, [startBrowserWatch]);

  // 2. Disable GPS Tracking (Privacy Opt-Out)
  const disableGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    setIsGpsEnabled(false);
    setUserCoordinates(null);
    setIsNavigating(false);
    setIsSimulated(false);
    setSpeed(0);
    setError(null);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, 'false');
      } catch (e) {
        // Storage notice
      }
    }

    triggerStatusNotice('🔒 Live GPS tracking paused. Manual origin selection active.');
  }, []);

  // 3. Toggle GPS Tracking
  const toggleGpsTracking = useCallback(() => {
    if (isGpsEnabled) {
      disableGpsTracking();
    } else {
      enableGpsTracking();
    }
  }, [isGpsEnabled, disableGpsTracking, enableGpsTracking]);

  // 4. Start Live Turn-by-Turn Navigation
  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setFollowMode(true);
    if (!isGpsEnabled && !isSimulated) {
      enableGpsTracking();
    }
  }, [isGpsEnabled, isSimulated, enableGpsTracking]);

  // 5. Stop Navigation
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    if (isSimulated) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      setIsSimulated(false);
    }
  }, [isSimulated]);

  // 6. Camera Follow-Mode Toggle
  const toggleFollowMode = useCallback(() => {
    setFollowMode((prev) => !prev);
  }, []);

  // 7. Convoy Simulation Mode
  const startSimulation = useCallback(
    (routeCoordinates: [number, number][], simulatedSpeedKmh: number = 65) => {
      if (!routeCoordinates || routeCoordinates.length < 2) return;

      if (watchIdRef.current !== null && typeof window !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }

      setIsGpsEnabled(true);
      setIsSimulated(true);
      setIsNavigating(true);
      setFollowMode(true);
      setError(null);
      setAccuracy(5);
      setSpeed(simulatedSpeedKmh);

      const line = turf.lineString(routeCoordinates);
      const totalLengthKm = turf.length(line, { units: 'kilometers' });

      const intervalMs = 750;
      const speedKmPerMs = simulatedSpeedKmh / 3600000;
      const stepDistanceKm = speedKmPerMs * intervalMs * 2.0;

      let currentDistKm = 0;
      const initialPt = turf.along(line, 0, { units: 'kilometers' });
      const initialLat = initialPt.geometry.coordinates[1];
      const initialLng = initialPt.geometry.coordinates[0];
      setUserCoordinates([initialLat, initialLng]);
      prevPositionRef.current = [initialLat, initialLng];

      simulationIntervalRef.current = setInterval(() => {
        currentDistKm += stepDistanceKm;

        if (currentDistKm >= totalLengthKm) {
          currentDistKm = totalLengthKm;
          const finalPt = turf.along(line, totalLengthKm, { units: 'kilometers' });
          const finalLat = finalPt.geometry.coordinates[1];
          const finalLng = finalPt.geometry.coordinates[0];
          setUserCoordinates([finalLat, finalLng]);
          setSimulatedProgress(1);
          setSpeed(0);
          if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
          }
          return;
        }

        const currentPt = turf.along(line, currentDistKm, { units: 'kilometers' });
        const lat = currentPt.geometry.coordinates[1];
        const lng = currentPt.geometry.coordinates[0];

        const lookaheadDist = Math.min(totalLengthKm, currentDistKm + 0.1);
        const lookaheadPt = turf.along(line, lookaheadDist, { units: 'kilometers' });
        const b = turf.bearing(currentPt, lookaheadPt);
        const deg = (b + 360) % 360;

        setUserCoordinates([lat, lng]);
        setHeading(Math.round(deg));
        setSimulatedProgress(currentDistKm / totalLengthKm);
        prevPositionRef.current = [lat, lng];
      }, intervalMs);
    },
    []
  );

  // Initialize preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem(STORAGE_KEY);
      if (savedPref === 'true') {
        setIsGpsEnabled(true);
        startBrowserWatch();
      }
    }
  }, [startBrowserWatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  return {
    isGpsEnabled,
    hasUserGrantedPermission,
    userCoordinates,
    accuracy,
    heading,
    speed,
    isNavigating,
    followMode,
    isSimulated,
    simulatedProgress,
    error,
    statusMessage,
    enableGpsTracking,
    disableGpsTracking,
    toggleGpsTracking,
    startNavigation,
    stopNavigation,
    setFollowMode,
    toggleFollowMode,
    startSimulation,
  };
}
