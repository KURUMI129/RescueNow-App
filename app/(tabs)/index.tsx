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
import { getAppCopy } from "@/constants/app-copy";
import { AppLanguage } from "@/constants/app-preferences";
import { formatDistanceKm, formatEtaMinutes } from "@/constants/display-format";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { ServiceCategory } from "@/constants/service-flow";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { useAppLanguage } from "@/hooks/use-app-language";

type TechnicianMarker = {
  id: string;
  name: string;
  category: ServiceCategory;
  specialty: string;
  eta: string;
  distance: string;
  latitude: number;
  longitude: number;
};

type TechnicianSeed = {
  id: string;
  name: string;
  category: ServiceCategory;
  etaMin: number;
};

const TECHNICIAN_BASE: TechnicianSeed[] = [
  { id: "1", name: "Luis Martinez", category: "mech", etaMin: 8 },
  { id: "2", name: "Ana Gomez", category: "tow", etaMin: 12 },
  { id: "3", name: "Carlos Rojas", category: "plumb", etaMin: 9 },
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
      specialty: categories[tech.category],
      eta: formatEtaMinutes(tech.etaMin, language),
      latitude: lat,
      longitude: lng,
      distance: toKmLabel(latitude, longitude, lat, lng, language),
    };
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const language = useAppLanguage();
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

  const copy = getAppCopy(language as AppLanguage);
  const t = copy.tabs.home;

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const setupLiveLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(t.locationPermissionError);
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
      setTechnicians(
        createNearbyTechnicians(
          current.coords.latitude,
          current.coords.longitude,
          copy.categories,
          language as AppLanguage,
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
              copy.categories,
              language as AppLanguage,
              jitter,
            ),
          );
        },
      );
    };

    setupLiveLocation().catch(() => {
      setLocationError(t.locationError);
      setIsLocating(false);
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [copy.categories, language, t.locationError, t.locationPermissionError]);

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
                  {t.tagline}
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
                  {t.locating}
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
                    description={`${tech.specialty} · ${t.etaPrefix} ${tech.eta}`}
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
                title={t.requestService}
                subtitle={t.requestServiceSub}
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
                title={t.tracking}
                subtitle={t.trackingSub}
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
            {t.panicCounter(panicCount)}
          </Text>

          <NearbyTechnicians
            colors={colors}
            data={technicians}
            title={t.nearbyTitle}
            etaPrefix={t.etaPrefix}
          />
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
