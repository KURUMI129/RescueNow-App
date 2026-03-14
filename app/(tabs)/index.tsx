import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { BrandLogo } from "@/components/brand/brand-logo";
import { NearbyTechnicians } from "@/components/home/nearby-technicians";
import { PanicButton } from "@/components/home/panic-button";
import { QuickActionCard } from "@/components/home/quick-action-card";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";

type TechnicianMarker = {
  id: string;
  name: string;
  specialty: string;
  eta: string;
  distance: string;
  latitude: number;
  longitude: number;
};

const TECHNICIAN_BASE: Omit<
  TechnicianMarker,
  "distance" | "latitude" | "longitude"
>[] = [
  { id: "1", name: "Luis Martinez", specialty: "Mecanico", eta: "8 min" },
  { id: "2", name: "Ana Gomez", specialty: "Grua", eta: "12 min" },
  { id: "3", name: "Carlos Rojas", specialty: "Plomero", eta: "9 min" },
];

const INITIAL_REGION: Region = {
  latitude: 19.7008,
  longitude: -101.1844,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

function toKmLabel(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
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

  return `${distance.toFixed(1)} km`;
}

function createNearbyTechnicians(
  latitude: number,
  longitude: number,
  jitter = 0,
): TechnicianMarker[] {
  const offsets = [
    { lat: 0.0042, lng: -0.0038 },
    { lat: -0.0035, lng: 0.0029 },
    { lat: 0.0028, lng: 0.0041 },
  ];

  return TECHNICIAN_BASE.map((tech, index) => {
    const offset = offsets[index];
    const lat = latitude + offset.lat + jitter;
    const lng = longitude + offset.lng - jitter;

    return {
      ...tech,
      latitude: lat,
      longitude: lng,
      distance: toKmLabel(latitude, longitude, lat, lng),
    };
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const [panicCount, setPanicCount] = useState<number>(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [technicians, setTechnicians] = useState<TechnicianMarker[]>([]);
  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(14), []);
  const sectionAnimValues = useMemo(
    () => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)],
    [],
  );

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const setupLiveLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(
          "Activa ubicacion para mostrar el mapa en tiempo real.",
        );
        setIsLocating(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const currentRegion: Region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setRegion(currentRegion);
      setTechnicians(
        createNearbyTechnicians(
          current.coords.latitude,
          current.coords.longitude,
        ),
      );
      setIsLocating(false);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3500,
          distanceInterval: 3,
        },
        (position) => {
          const jitter = (Math.random() - 0.5) * 0.0012;
          setRegion((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setTechnicians(
            createNearbyTechnicians(
              position.coords.latitude,
              position.coords.longitude,
              jitter,
            ),
          );
        },
      );
    };

    setupLiveLocation().catch(() => {
      setLocationError("No se pudo obtener tu ubicacion en este momento.");
      setIsLocating(false);
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (reduceMotionEnabled) {
      entranceOpacity.setValue(1);
      entranceTranslateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslateY, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entranceOpacity, entranceTranslateY, reduceMotionEnabled]);

  useEffect(() => {
    if (reduceMotionEnabled) {
      sectionAnimValues.forEach((value) => value.setValue(1));
      return;
    }

    Animated.stagger(
      90,
      sectionAnimValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [sectionAnimValues, reduceMotionEnabled]);

  const mapRegion = useMemo(() => region, [region]);

  const handlePanicPress = () => {
    setPanicCount((prev) => prev + 1);
    router.push("/modal");
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.entranceLayer,
            {
              opacity: entranceOpacity,
              transform: [{ translateY: entranceTranslateY }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.brandWrap}>
              <BrandLogo width={76} height={66} />
              <View style={styles.brandTextWrap}>
                <Text
                  style={[styles.greeting, { color: colors.textSecondary }]}
                >
                  Asistencia tecnica y vial en tiempo real
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.mapWrap,
              {
                borderColor: colors.cardBorder,
                backgroundColor: colors.surface,
              },
            ]}
          >
            {isLocating ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={[styles.mapInfoText, { color: colors.textSecondary }]}
                >
                  Ubicando...
                </Text>
              </View>
            ) : (
              <MapView
                style={styles.map}
                region={mapRegion}
                showsUserLocation
                followsUserLocation
                loadingEnabled
              >
                {technicians.map((tech) => (
                  <Marker
                    key={tech.id}
                    coordinate={{
                      latitude: tech.latitude,
                      longitude: tech.longitude,
                    }}
                    title={tech.name}
                    description={`${tech.specialty} · ETA ${tech.eta}`}
                    pinColor={colors.accent}
                  />
                ))}
              </MapView>
            )}
          </View>

          {locationError ? (
            <Text style={[styles.locationErrorText, { color: colors.danger }]}>
              {locationError}
            </Text>
          ) : null}

          <View style={styles.actionsRow}>
            <Animated.View
              style={[
                styles.staggerItem,
                {
                  opacity: sectionAnimValues[0],
                  transform: [
                    {
                      translateY: sectionAnimValues[0].interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <QuickActionCard
                title="Solicitar servicio"
                subtitle="Opciones normales de asistencia"
                icon="construct-outline"
                colors={colors}
                onPress={() => router.push("/(tabs)/services")}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.staggerItem,
                {
                  opacity: sectionAnimValues[1],
                  transform: [
                    {
                      translateY: sectionAnimValues[1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <QuickActionCard
                title="Seguimiento en vivo"
                subtitle="Visualiza avance y tiempo estimado"
                icon="navigate-outline"
                colors={colors}
                onPress={() => router.push("/(tabs)/tracking")}
              />
            </Animated.View>
          </View>

          <Animated.View
            style={{
              opacity: sectionAnimValues[2],
              transform: [
                {
                  translateY: sectionAnimValues[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            }}
          >
            <PanicButton colors={colors} onPress={handlePanicPress} />
          </Animated.View>

          <Text style={[styles.panicCounter, { color: colors.textSecondary }]}>
            Activaciones de panico (sesion): {panicCount}
          </Text>

          <NearbyTechnicians colors={colors} data={technicians} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
  },
  entranceLayer: {
    gap: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  brandTextWrap: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 4,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  actionsRow: {
    marginTop: 12,
    alignItems: "stretch",
    gap: 8,
  },
  staggerItem: {
    width: "100%",
  },
  mapWrap: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    height: 210,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationErrorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  panicCounter: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
});
