import * as Location from "expo-location";
import { useCallback, useState } from "react";

export function useUserLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationAllowed, setLocationAllowed] = useState(false);

  const askLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLocationAllowed(false);
        return false;
      }

      setLocationAllowed(true);
      
      // Start watching or get current immediately
      const currLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currLocation);
      
      return true;
    } catch (error: any) {
      setErrorMsg(error.message);
      return false;
    }
  }, []);

  return { locationAllowed, askLocationPermission, location, errorMsg };
}
