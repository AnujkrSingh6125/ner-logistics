'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';

export type PermissionStatusType = 'granted' | 'prompt' | 'denied' | 'unavailable';

export interface LiveTrackingState {
  userLocation: [number, number] | null; // [latitude, longitude]
  accuracy: number; // in meters
  heading: number | null; // in degrees (0-360)
  speed: number | null; // in km/h
  isTracking: boolean;
  isNavigating: boolean;
  followMode: boolean;
  permissionStatus: PermissionStatusType;
  error: string | null;
  isSimulated: boolean;
  simulatedProgress: number; // 0 to 1
}

export function useLiveTracking() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(15);
  const [heading, setHeading] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [followMode, setFollowMode] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatusType>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [simulatedProgress, setSimulatedProgress] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevPositionRef = useRef<[number, number] | null>(null);

  // Check initial permission status if available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setPermissionStatus(result.state as PermissionStatusType);
          result.onchange = () => {
            setPermissionStatus(result.state as PermissionStatusType);
          };
        })
        .catch(() => {
          // Ignore if permission query not supported
        });
    }
  }, []);

  // Compute bearing between two coordinates
  const calculateBearing = (start: [number, number], end: [number, number]): number => {
    const startPt = turf.point([start[1], start[0]]);
    const endPt = turf.point([end[1], end[0]]);
    const b = turf.bearing(startPt, endPt);
    return (b + 360) % 360;
  };

  // Start Real HTML5 Continuous Geolocation Tracking
  const startTracking = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setPermissionStatus('unavailable');
      setError('HTML5 Geolocation is not supported by your browser.');
      return;
    }

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulated(false);

    setError(null);
    setIsTracking(true);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const acc = position.coords.accuracy || 15;
      const spd = position.coords.speed !== null ? Math.round(position.coords.speed * 3.6) : null; // m/s to km/h

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
      setUserLocation([lat, lng]);
      setAccuracy(acc);
      setHeading(computedHeading !== null && !isNaN(computedHeading) ? Math.round(computedHeading) : null);
      setSpeed(spd);
      setPermissionStatus('granted');
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('[GEOLOCATION WARNING]:', err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setPermissionStatus('denied');
        setError('Location permission denied. Please enable location access or use simulation mode.');
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError('GPS position unavailable. Check device location services.');
      } else if (err.code === err.TIMEOUT) {
        setError('GPS signal acquisition timed out. Retrying...');
      }
    };

    // Initial immediate single fix
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Continuous watchPosition
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
  }, []);

  // Stop Real Geolocation Tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsTracking(false);
    setIsNavigating(false);
    setIsSimulated(false);
  }, []);

  // Start Navigation Mode
  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setFollowMode(true);
    if (!isTracking && !isSimulated) {
      startTracking();
    }
  }, [isTracking, isSimulated, startTracking]);

  // Stop Navigation Mode
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    if (isSimulated) {
      stopTracking();
    }
  }, [isSimulated, stopTracking]);

  // Toggle Camera Follow Mode
  const toggleFollowMode = useCallback(() => {
    setFollowMode((prev) => !prev);
  }, []);

  // Set Manual Location Override
  const setUserLocationManual = useCallback((coords: [number, number]) => {
    if (prevPositionRef.current) {
      const b = calculateBearing(prevPositionRef.current, coords);
      setHeading(Math.round(b));
    }
    prevPositionRef.current = coords;
    setUserLocation(coords);
    setAccuracy(10);
    setError(null);
  }, []);

  // Simulated Vehicle Motion along an OSRM polyline
  const startSimulation = useCallback(
    (routeCoordinates: [number, number][], simulatedSpeedKmh: number = 60) => {
      if (!routeCoordinates || routeCoordinates.length < 2) return;

      if (watchIdRef.current !== null && typeof window !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }

      setIsTracking(true);
      setIsSimulated(true);
      setIsNavigating(true);
      setFollowMode(true);
      setError(null);
      setAccuracy(5);
      setSpeed(simulatedSpeedKmh);

      // Convert [[lon, lat], ...] coordinates to line
      const line = turf.lineString(routeCoordinates);
      const totalLengthKm = turf.length(line, { units: 'kilometers' });

      // Step interval: update every 800ms
      const intervalMs = 800;
      const speedKmPerMs = simulatedSpeedKmh / 3600000;
      const stepDistanceKm = speedKmPerMs * intervalMs * 1.8; // subtle speed multiplier for responsive demo

      let currentDistKm = 0;

      const initialPt = turf.along(line, 0, { units: 'kilometers' });
      const initialLat = initialPt.geometry.coordinates[1];
      const initialLng = initialPt.geometry.coordinates[0];
      setUserLocation([initialLat, initialLng]);
      prevPositionRef.current = [initialLat, initialLng];

      simulationIntervalRef.current = setInterval(() => {
        currentDistKm += stepDistanceKm;

        if (currentDistKm >= totalLengthKm) {
          // Reached destination
          currentDistKm = totalLengthKm;
          const finalPt = turf.along(line, totalLengthKm, { units: 'kilometers' });
          const finalLat = finalPt.geometry.coordinates[1];
          const finalLng = finalPt.geometry.coordinates[0];
          setUserLocation([finalLat, finalLng]);
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

        // Lookahead point for bearing
        const lookaheadDist = Math.min(totalLengthKm, currentDistKm + 0.1);
        const lookaheadPt = turf.along(line, lookaheadDist, { units: 'kilometers' });
        const b = turf.bearing(currentPt, lookaheadPt);
        const deg = (b + 360) % 360;

        setUserLocation([lat, lng]);
        setHeading(Math.round(deg));
        setSimulatedProgress(currentDistKm / totalLengthKm);
        prevPositionRef.current = [lat, lng];
      }, intervalMs);
    },
    []
  );

  // Cleanup on component unmount
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
    userLocation,
    accuracy,
    heading,
    speed,
    isTracking,
    isNavigating,
    followMode,
    permissionStatus,
    error,
    isSimulated,
    simulatedProgress,
    startTracking,
    stopTracking,
    startNavigation,
    stopNavigation,
    setFollowMode,
    toggleFollowMode,
    startSimulation,
    setUserLocationManual,
  };
}
