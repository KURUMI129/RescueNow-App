import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Region } from "react-native-maps";

import { AppLanguage } from "@/constants/app-preferences";
import { formatDistanceKm, formatEtaMinutes } from "@/constants/display-format";
import { ServiceCategory } from "@/constants/service-flow";

export type TechnicianMarker = {
  id: string;
  name: string;
  category: ServiceCategory;
  specialty: string;
  eta: string;
  distance: string;
  latitude: number;
  longitude: number;
};

type UseLiveMapParams = {
  categories: Record<ServiceCategory, string>;
  language: AppLanguage;
  locationPermissionError: string;
  locationErrorMessage: string;
};

const TECHNICIAN_BASE = [
  { id: "1", name: "Luis Martinez", category: "mech" as const, etaMin: 8 },
  { id: "2", name: "Ana Gomez", category: "tow" as const, etaMin: 12 },
  { id: "3", name: "Carlos Rojas", category: "plumb" as const, etaMin: 9 },
];

const INITIAL_REGION: Region = {
  latitude: 19.7008,
  longitude: -101.1844,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

async function getBestAvailablePosition() {
  try {
    return await Location.getCurrentPositionAsync({});
  } catch {
    const lastKnownPosition = await Location.getLastKnownPositionAsync();

    if (lastKnownPosition) {
      return lastKnownPosition;
    }

    throw new Error("location-unavailable");
  }
}

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function toKmLabel(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  language: AppLanguage,
): string {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c;

  return formatDistanceKm(distance, language);
}

function createNearbyTechnicians(
  latitude: number,
  longitude: number,
  categories: Record<ServiceCategory, string>,
  language: AppLanguage,
): TechnicianMarker[] {
  const offsets = [
    { lat: 0.0042, lng: -0.0038 },
    { lat: -0.0035, lng: 0.0029 },
    { lat: 0.0028, lng: 0.0041 },
  ];

  return TECHNICIAN_BASE.map((tech, index) => {
    const offset = offsets[index];
    const lat = latitude + offset.lat;
    const lng = longitude + offset.lng;

    return {
      ...tech,
      specialty: categories[tech.category],
      eta: formatEtaMinutes(tech.etaMin, language),
      latitude: lat,
      longitude: lng,
      distance: toKmLabel(latitude, longitude, lat, lng, language),
    };
  });
}

export function useLiveMap({
  categories,
  language,
  locationPermissionError,
  locationErrorMessage,
}: UseLiveMapParams) {
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianMarker[]>([]);
  const lastStableCoordsRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const setupLiveLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(locationPermissionError);
        setIsLocating(false);
        return;
      }

      const current = await getBestAvailablePosition();
      const currentRegion: Region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setRegion(currentRegion);
      lastStableCoordsRef.current = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setTechnicians(
        createNearbyTechnicians(
          current.coords.latitude,
          current.coords.longitude,
          categories,
          language,
        ),
      );
      setLocationError(null);
      setIsLocating(false);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 8000,
          distanceInterval: 12,
        },
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          if (typeof accuracy === "number" && accuracy > 60) {
            return;
          }

          const lastStable = lastStableCoordsRef.current;
          if (lastStable) {
            const movedMeters = distanceMeters(
              lastStable.latitude,
              lastStable.longitude,
              latitude,
              longitude,
            );

            if (movedMeters < 10) {
              return;
            }
          }

          lastStableCoordsRef.current = { latitude, longitude };

          setRegion((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
          setTechnicians(
            createNearbyTechnicians(latitude, longitude, categories, language),
          );
        },
      );
    };

    setupLiveLocation().catch(() => {
      setLocationError(locationErrorMessage);
      setIsLocating(false);
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [categories, language, locationErrorMessage, locationPermissionError]);

  return { region, isLocating, locationError, technicians };
}
