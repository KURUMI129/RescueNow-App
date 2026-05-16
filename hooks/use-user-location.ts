import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

export function useUserLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);

  const askLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLocationAllowed(false);
        return false;
      }

      setLocationAllowed(true);

      // Initial position (fast, no wait for watcher)
      const currLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currLocation);
      lastLocationRef.current = currLocation;

      return true;
    } catch (error: any) {
      setErrorMsg(error.message);
      return false;
    }
  }, []);

  // Continuous location updates — critical for SOS to have fresh coordinates
  useEffect(() => {
    if (!locationAllowed) return;

    let cancelled = false;

    const startWatching = async () => {
      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // update every 10s
            distanceInterval: 30, // or every 30m of movement
          },
          (loc) => {
            if (cancelled) return;
            setLocation(loc);
            lastLocationRef.current = loc;
          },
        );
        if (cancelled) {
          subscription.remove();
        } else {
          watchSubscriptionRef.current = subscription;
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorMsg(error.message);
        }
      }
    };

    void startWatching();

    return () => {
      cancelled = true;
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    };
  }, [locationAllowed]);

  return {
    locationAllowed,
    askLocationPermission,
    location: location ?? lastLocationRef.current,
    errorMsg,
  };
}
