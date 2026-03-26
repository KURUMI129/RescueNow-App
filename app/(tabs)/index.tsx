import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { PanicButton } from "@/components/home/panic-button";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

type PoiFilter = "fuel" | "mechanic" | "tow" | "hospital";

type PoiMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  filter: PoiFilter;
  source: "real" | "fallback";
};

const RESCUE_DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#111111" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111111" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1F2937" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4B5563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#141414" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#222222" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#2A2A2A" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2F2F2F" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1A1A1A" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0B0F14" }],
  },
];

const FILTER_CHIPS: Array<{
  id: PoiFilter;
  label: string;
  emoji: string;
  markerColor: string;
}> = [
  { id: "fuel", label: "Gasolineras", emoji: "⛽", markerColor: "#EAB308" },
  {
    id: "mechanic",
    label: "Mecánicos",
    emoji: "🔧",
    markerColor: "#3B82F6",
  },
  { id: "tow", label: "Grúas", emoji: "🏗️", markerColor: "#DC2626" },
  {
    id: "hospital",
    label: "Hospitales",
    emoji: "🏥",
    markerColor: "#22C55E",
  },
];

const FALLBACK_REGION: Region = {
  latitude: 19.7008,
  longitude: -101.1844,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

const POI_CACHE_TTL_MS = 45_000;
const AUTO_REFRESH_MS = 30_000;
const MAP_MOVE_REFRESH_THRESHOLD_METERS = 500;

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

function buildOverpassQuery(
  filter: PoiFilter,
  latitude: number,
  longitude: number,
) {
  const around = 6000;

  if (filter === "fuel") {
    return `[out:json][timeout:20];(nwr["amenity"="fuel"](around:${around},${latitude},${longitude}););out center 40;`;
  }

  if (filter === "mechanic") {
    return `[out:json][timeout:20];(nwr["shop"="car_repair"](around:${around},${latitude},${longitude});nwr["craft"="mechanic"](around:${around},${latitude},${longitude}););out center 40;`;
  }

  if (filter === "tow") {
    return `[out:json][timeout:20];(nwr["name"~"grua|grúa|tow|towing",i](around:${around},${latitude},${longitude});nwr["service"~"tow|towing",i](around:${around},${latitude},${longitude}););out center 40;`;
  }

  return `[out:json][timeout:20];(nwr["amenity"="hospital"](around:${around},${latitude},${longitude}););out center 40;`;
}

function buildFallbackPois(
  filter: PoiFilter,
  latitude: number,
  longitude: number,
): PoiMarker[] {
  const offsetByFilter: Record<
    PoiFilter,
    Array<{ lat: number; lng: number; title: string }>
  > = {
    fuel: [
      { lat: 0.0034, lng: -0.004, title: "Gasolinera cercana" },
      { lat: -0.0029, lng: 0.0038, title: "Servicio 24h" },
    ],
    mechanic: [
      { lat: 0.0048, lng: 0.0023, title: "Taller Express" },
      { lat: -0.0038, lng: -0.0031, title: "Mecánico Móvil" },
    ],
    tow: [
      { lat: 0.0021, lng: 0.0046, title: "Base de Grúas" },
      { lat: -0.0044, lng: 0.0019, title: "Grúa de Rescate" },
    ],
    hospital: [
      { lat: 0.0051, lng: -0.0018, title: "Hospital General" },
      { lat: -0.0024, lng: -0.0042, title: "Clínica de Urgencias" },
    ],
  };

  return offsetByFilter[filter].map((point, index) => ({
    id: `fallback-${filter}-${index}`,
    latitude: latitude + point.lat,
    longitude: longitude + point.lng,
    title: point.title,
    filter,
    source: "fallback",
  }));
}

function getMarkerColor(filter: PoiFilter): string {
  const chip = FILTER_CHIPS.find((item) => item.id === filter);
  return chip?.markerColor ?? "#EAB308";
}

function getCacheKey(
  filter: PoiFilter,
  latitude: number,
  longitude: number,
): string {
  const latBucket = latitude.toFixed(3);
  const lngBucket = longitude.toFixed(3);
  return `${filter}:${latBucket}:${lngBucket}`;
}

async function fetchOverpassWithFallback(query: string) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(
        `${endpoint}?data=${encodeURIComponent(query)}`,
      );

      if (response.ok) {
        return response;
      }
    } catch {
      // Continue with the next free endpoint.
    }
  }

  throw new Error("overpass-all-endpoints-failed");
}

export default function HomeScreen() {
  const mapRef = useRef<MapView | null>(null);
  const colors = HOME_THEME_COLORS.dark;
  const requestIdRef = useRef(0);
  const debounceFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryCenterRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const poiCacheRef = useRef(
    new Map<string, { timestamp: number; data: PoiMarker[] }>(),
  );
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const [region, setRegion] = useState<Region>(FALLBACK_REGION);
  const [selectedFilter, setSelectedFilter] = useState<PoiFilter>("fuel");
  const [poiMarkers, setPoiMarkers] = useState<PoiMarker[]>([]);
  const [isLoadingPois, setIsLoadingPois] = useState(false);
  const [locationStateText, setLocationStateText] = useState(
    "Buscando ubicación...",
  );
  const [isPanicVisible, setIsPanicVisible] = useState(false);

  const fetchPois = useCallback(
    async (filter: PoiFilter, latitude: number, longitude: number) => {
      setIsLoadingPois(true);
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const cacheKey = getCacheKey(filter, latitude, longitude);
      const now = Date.now();
      const cached = poiCacheRef.current.get(cacheKey);

      if (cached && now - cached.timestamp < POI_CACHE_TTL_MS) {
        setPoiMarkers(cached.data);
        setIsLoadingPois(false);
        setLocationStateText(
          "Ubicación lista · Datos recientes (OSM/Overpass)",
        );
        lastQueryCenterRef.current = { latitude, longitude };
        return;
      }

      try {
        const query = buildOverpassQuery(filter, latitude, longitude);
        const response = await fetchOverpassWithFallback(query);

        const payload = (await response.json()) as {
          elements?: Array<{
            id: number;
            lat?: number;
            lon?: number;
            center?: { lat: number; lon: number };
            tags?: Record<string, string>;
          }>;
        };

        const realPois = (payload.elements ?? [])
          .map((element) => {
            const lat = element.lat ?? element.center?.lat;
            const lon = element.lon ?? element.center?.lon;

            if (typeof lat !== "number" || typeof lon !== "number") {
              return null;
            }

            return {
              id: `real-${filter}-${element.id}`,
              latitude: lat,
              longitude: lon,
              title: element.tags?.name?.trim() || "Punto de interés",
              filter,
              source: "real" as const,
            };
          })
          .filter((item): item is PoiMarker => item !== null)
          .slice(0, 30);

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (realPois.length > 0) {
          setPoiMarkers(realPois);
          poiCacheRef.current.set(cacheKey, { timestamp: now, data: realPois });
          setLocationStateText(
            "Ubicación lista · POIs en tiempo real (gratis)",
          );
          lastQueryCenterRef.current = { latitude, longitude };
          return;
        }

        const fallbackPois = buildFallbackPois(filter, latitude, longitude);
        setPoiMarkers(fallbackPois);
        poiCacheRef.current.set(cacheKey, {
          timestamp: now,
          data: fallbackPois,
        });
        setLocationStateText(
          "Sin resultados cercanos · Mostrando puntos de apoyo",
        );
        lastQueryCenterRef.current = { latitude, longitude };
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const fallbackPois = buildFallbackPois(filter, latitude, longitude);
        setPoiMarkers(fallbackPois);
        poiCacheRef.current.set(cacheKey, {
          timestamp: now,
          data: fallbackPois,
        });
        setLocationStateText("Sin internet · Mostrando puntos de apoyo");
        lastQueryCenterRef.current = { latitude, longitude };
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoadingPois(false);
        }
      }
    },
    [],
  );

  const centerMapToUser = useCallback((nextRegion: Region) => {
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 450);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setupLocation = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationStateText("Permiso denegado · Activa ubicación");
        const { latitude, longitude } = FALLBACK_REGION;
        await fetchPois(selectedFilter, latitude, longitude);
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!isMounted) {
        return;
      }

      const nextRegion: Region = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        latitudeDelta: 0.028,
        longitudeDelta: 0.028,
      };

      centerMapToUser(nextRegion);
      await fetchPois(
        selectedFilter,
        currentPosition.coords.latitude,
        currentPosition.coords.longitude,
      );

      watchSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 12000,
          distanceInterval: 20,
        },
        (position) => {
          const updatedRegion: Region = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.028,
            longitudeDelta: 0.028,
          };

          setRegion(updatedRegion);
        },
      );
    };

    setupLocation().catch(() => {
      setLocationStateText("Error al obtener ubicación");
      const { latitude, longitude } = FALLBACK_REGION;
      void fetchPois(selectedFilter, latitude, longitude);
    });

    return () => {
      isMounted = false;
      watchSubscriptionRef.current?.remove();
      watchSubscriptionRef.current = null;
    };
  }, [centerMapToUser, fetchPois]);

  useEffect(() => {
    void fetchPois(selectedFilter, region.latitude, region.longitude);
  }, [fetchPois, region.latitude, region.longitude, selectedFilter]);

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      void fetchPois(selectedFilter, region.latitude, region.longitude);
    }, AUTO_REFRESH_MS);

    return () => {
      clearInterval(refreshTimer);
    };
  }, [fetchPois, region.latitude, region.longitude, selectedFilter]);

  useEffect(() => {
    return () => {
      if (debounceFetchRef.current) {
        clearTimeout(debounceFetchRef.current);
      }
    };
  }, []);

  const visibleMarkers = useMemo(
    () => poiMarkers.filter((poi) => poi.filter === selectedFilter),
    [poiMarkers, selectedFilter],
  );

  const handleEmergencyTypeSelect = useCallback(
    (type: "accident" | "mechanical" | "fuel") => {
      if (type === "fuel") {
        setSelectedFilter("fuel");
        return;
      }

      if (type === "mechanical") {
        setSelectedFilter("mechanic");
        return;
      }

      setSelectedFilter("tow");
    },
    [],
  );

  const handleRegionChangeComplete = useCallback(
    (nextRegion: Region) => {
      setRegion(nextRegion);

      const lastQueryCenter = lastQueryCenterRef.current;
      if (!lastQueryCenter) {
        return;
      }

      const movedMeters = distanceMeters(
        lastQueryCenter.latitude,
        lastQueryCenter.longitude,
        nextRegion.latitude,
        nextRegion.longitude,
      );

      if (movedMeters < MAP_MOVE_REFRESH_THRESHOLD_METERS) {
        return;
      }

      if (debounceFetchRef.current) {
        clearTimeout(debounceFetchRef.current);
      }

      debounceFetchRef.current = setTimeout(() => {
        void fetchPois(
          selectedFilter,
          nextRegion.latitude,
          nextRegion.longitude,
        );
      }, 700);
    },
    [fetchPois, selectedFilter],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={RESCUE_DARK_MAP_STYLE}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        loadingEnabled
      >
        {visibleMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={
              marker.source === "real"
                ? "Dato en tiempo real"
                : "Punto sugerido sin conexión"
            }
            pinColor={getMarkerColor(marker.filter)}
          />
        ))}
      </MapView>

      <View style={styles.headerFloat}>
        <Text style={styles.brandTitle}>RescueNow</Text>
        <Text style={styles.locationStatus}>
          {isLoadingPois ? "Actualizando POIs..." : locationStateText}
        </Text>
      </View>

      <View style={styles.bottomLayer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          {FILTER_CHIPS.map((chip) => {
            const isSelected = selectedFilter === chip.id;

            return (
              <Pressable
                key={chip.id}
                onPress={() => setSelectedFilter(chip.id)}
                style={[
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipUnselected,
                ]}
              >
                <Text style={styles.chipText}>
                  {chip.emoji} {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={styles.sosFab}
          onPress={() => setIsPanicVisible(true)}
        >
          <MaterialCommunityIcons
            name="alarm-lightning"
            size={26}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={isPanicVisible}
        animationType="slide"
        onRequestClose={() => setIsPanicVisible(false)}
      >
        <View style={styles.panicBackdrop}>
          <Pressable
            style={styles.panicBackdropTouch}
            onPress={() => setIsPanicVisible(false)}
          />

          <View style={styles.panicSheet}>
            <View style={styles.panicSheetHandle} />
            <PanicButton
              colors={colors}
              onPress={() => setIsPanicVisible(false)}
              onEmergencyTypeSelect={handleEmergencyTypeSelect}
            />
            <Pressable
              style={styles.closePanicButton}
              onPress={() => setIsPanicVisible(false)}
            >
              <Text style={styles.closePanicText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  map: {
    flex: 1,
  },
  headerFloat: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(30, 30, 30, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  locationStatus: {
    marginTop: 4,
    color: "#D1D5DB",
    fontWeight: "600",
    fontSize: 12,
  },
  bottomLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    paddingHorizontal: 14,
  },
  chipsContent: {
    paddingRight: 84,
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: "#EAB308",
    borderColor: "#EAB308",
  },
  chipUnselected: {
    backgroundColor: "rgba(20, 20, 20, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  chipText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },
  sosFab: {
    position: "absolute",
    right: 14,
    bottom: 4,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  panicBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.58)",
  },
  panicBackdropTouch: {
    flex: 1,
  },
  panicSheet: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.24)",
    paddingHorizontal: 14,
    paddingBottom: 20,
    paddingTop: 10,
  },
  panicSheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#424242",
    marginBottom: 8,
  },
  closePanicButton: {
    marginTop: 6,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  closePanicText: {
    color: "#EAB308",
    fontSize: 14,
    fontWeight: "700",
  },
});
