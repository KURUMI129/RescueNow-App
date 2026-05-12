import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import MapView, { Callout, Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";


import { getAppPreferences, updateAppPreferences } from "@/constants/app-preferences";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useUserLocation } from "@/hooks/use-user-location";
import { saveIncident } from "@/lib/emergency-service";
import { useCrashDetection } from "@/hooks/use-crash-detection";
import { useAuth } from "@/lib/auth-context";
import { fetchNearbyPOIs, distanceKm, type POIResult } from "@/lib/overpass-service";
import { AppEvents, EVENT_SELECT_SERVICE_FILTER } from "@/lib/app-events";
import { BottomSheetServices } from "@/components/home/bottom-sheet-services";
import { RexAvatar } from "@/components/chatbot/rex-avatar";
import { BatteryWarning } from "@/components/features/BatteryWarning";
import { ContactShortcut } from "@/components/features/ContactShortcut";
import { WeatherWidget } from "@/components/features/WeatherWidget";
import { MAP_SERVICES } from "@/constants/services";

// Mapa en escala de azules oscuros tipo radar/sonar de rescate
const RESCUE_DARK_MAP_STYLE: any[] = [
  { "elementType": "geometry", "stylers": [{ "color": "#0B1120" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] },
  { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#64779e" }] },
  { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#151b2c" }] },
  { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#080c16" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#1a2233" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6f9ba5" }] },
  { "featureType": "poi", "elementType": "labels.text.stroke", "stylers": [{ "color": "#0B1120" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1d273a" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] },
  { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#0B1120" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c6675" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#255763" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#b0d5ce" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#4e6d70" }] }
]

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Medidas Bottom Sheet
const SHEET_MIN_HEIGHT = 160; 
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.65;
const SHEET_SNAP_THRESHOLD = SCREEN_HEIGHT * 0.4;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const language = useAppLanguage();
  
  const { location, locationAllowed, askLocationPermission } = useUserLocation();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Listen for service filter events from services.tsx
  useEffect(() => {
    const unsubscribe = AppEvents.on(EVENT_SELECT_SERVICE_FILTER, (serviceId: string) => {
      console.log(`[Home] Received filter event: ${serviceId}`);
      setSelectedService(serviceId);
    });
    return unsubscribe;
  }, []);
  const [poiMarkers, setPoiMarkers] = useState<POIResult[]>([]);
  const [loadingPOIs, setLoadingPOIs] = useState(false);

  // Map reference for centering
  const mapRef = useRef<MapView>(null);

  // Track if SOS was triggered by crash detection (different UI)
  const [crashTriggered, setCrashTriggered] = useState(false);

  // Crash detection — auto-triggers SOS for ALL users
  const handleCrashDetected = useCallback(() => {
    setCrashTriggered(true);
    setShowSOSModal(true);
  }, []);
  useCrashDetection({ onCrashDetected: handleCrashDetected });

  // Bottom Sheet Físicas
  const sheetAnim = useRef(new RNAnimated.Value(SHEET_MIN_HEIGHT)).current;
  const isExpandedRef = useRef(false);

  // State para Modales y Emergencia
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // SOS Mechanic states
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(10);
  const sosPulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (showSOSModal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      sosPulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 500 }),
          withTiming(0.2, { duration: 500 }),
        ),
        -1,
        true,
      );
    } else {
      sosPulseOpacity.value = 0;
    }
  }, [showSOSModal, sosPulseOpacity]);

  const sosPulseAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(225, 29, 72, ${sosPulseOpacity.value})`,
  }));

  const [showMedicalID, setShowMedicalID] = useState(false);
  
  // Referencia para la alarma de audio
  const alarmSoundRef = useRef<Audio.Sound | null>(null);

  // Medical Data para Offline
  const [medicalData, setMedicalData] = useState({ bloodType: "", allergies: "", conditions: "", contact: "" });

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inicializar Preferencias y Prompts
  useEffect(() => {
    void askLocationPermission();

    const checkPreferences = async () => {
      const prefs = await getAppPreferences();
      if (!prefs.hasPromptedTheme) {
        setShowThemeModal(true);
      } else if (!prefs.hasPromptedContact) {
        setShowContactModal(true);
      }
      
      setMedicalData({
         bloodType: prefs.bloodType || "No especificado",
         allergies: prefs.allergies || "No especificadas",
         conditions: prefs.medicalConditions || "No especificadas",
         contact: prefs.trustedContactName ? `${prefs.trustedContactName} (${prefs.trustedContactPhone})` : "No registrado"
      });
    };
    void checkPreferences();
  }, [askLocationPermission]);

  // Crash detection is handled by useCrashDetection() hook above (Accelerometer > 4G)

  // SOS Countdown Mechanism y Alarma
  useEffect(() => {
    let internalInterval: ReturnType<typeof setInterval> | null = null;
    
    const playAlarm = async () => {
      try {
        // Obliga al celular a ignorar el modo silencio/vibrar (Especial para emergencias)
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        if (!alarmSoundRef.current) {
          const { sound } = await Audio.Sound.createAsync(
            require("../../assets/audio/alarm.mp3"),
            { isLooping: true, volume: 1.0 }
          );
          alarmSoundRef.current = sound;
        }
        // Volumen al máximo del reproductor (1.0)
        await alarmSoundRef.current.setVolumeAsync(1.0);
        await alarmSoundRef.current.playAsync();
      } catch (e) {
        console.warn("No se pudo reproducir la alarma:", e);
      }
    };
    
    const stopAlarm = async () => {
      if (alarmSoundRef.current) {
        await alarmSoundRef.current.stopAsync();
      }
    };

    if (showSOSModal) {
      setSosCountdown(10);
      
      // Solo hacer sonar la sirena si fue un accidente detectado automáticamente
      if (crashTriggered) {
        void playAlarm();
      }
      
      internalInterval = setInterval(() => {
        setSosCountdown((prev) => {
          if (prev <= 1) {
             if (internalInterval) clearInterval(internalInterval);
             void stopAlarm();
             triggerEmergency();
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
      countdownIntervalRef.current = internalInterval;
    } else {
      if (internalInterval) clearInterval(internalInterval);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      void stopAlarm();
    }
    
    return () => {
      if (internalInterval) clearInterval(internalInterval);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      void stopAlarm();
    }
  }, [showSOSModal, crashTriggered]);

  const triggerEmergency = async () => {
    setShowSOSModal(false);
    setCrashTriggered(false);

    const emergencyLocation = location ? {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    } : { latitude: 0, longitude: 0 };

    const prefs = await getAppPreferences();
    const wasCrash = crashTriggered;

    // 1. Save incident to Firestore (fire-and-forget — don't block navigation)
    if (user) {
      void saveIncident(
        user.uid,
        emergencyLocation,
        wasCrash ? "crash_detection" : "manual",
        {
          bloodType: prefs.bloodType,
          allergies: prefs.allergies,
          medicalConditions: prefs.medicalConditions,
        },
        prefs.trustedContactPhone || undefined,
      );
    }

    // 2. Navigate IMMEDIATELY to 911 call screen
    //    The call screen will handle sending the message during the "dialing" phase
    router.push({
      pathname: "/(tabs)/emergency-call",
      params: {
        userName: user?.displayName ?? "Paciente",
        latitude: emergencyLocation.latitude.toString(),
        longitude: emergencyLocation.longitude.toString(),
        bloodType: prefs.bloodType,
        allergies: prefs.allergies,
        medicalConditions: prefs.medicalConditions,
        contactPhone: prefs.trustedContactPhone,
        contactName: prefs.trustedContactName,
      },
    });
  };

  // Pulse animation for FAB (Reanimated native thread)
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.15, { duration: 900 }),
      -1,
      true,
    );
  }, [pulseScale]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Floating animation for Rex FAB
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-8, { duration: 1500 }),
      -1,
      true
    );
  }, [floatY]);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // PanResponder para Bottom Sheet
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Solo atrapar el gesto si el arrastre es vertical significativo
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const startHeight = isExpandedRef.current ? SHEET_MAX_HEIGHT : SHEET_MIN_HEIGHT;
        let newHeight = startHeight - gestureState.dy;

        // Limites
        if (newHeight < SHEET_MIN_HEIGHT) newHeight = SHEET_MIN_HEIGHT;
        if (newHeight > SHEET_MAX_HEIGHT) newHeight = SHEET_MAX_HEIGHT;

        sheetAnim.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const startHeight = isExpandedRef.current ? SHEET_MAX_HEIGHT : SHEET_MIN_HEIGHT;
        const releaseHeight = startHeight - gestureState.dy;

        const shouldExpand = releaseHeight > SHEET_SNAP_THRESHOLD;
        
        isExpandedRef.current = shouldExpand;
        RNAnimated.spring(sheetAnim, {
          toValue: shouldExpand ? SHEET_MAX_HEIGHT : SHEET_MIN_HEIGHT,
          friction: 8,
          tension: 40,
          useNativeDriver: false, // height requires false
        }).start();
      },
    })
  ).current;

  // Manejar selección de servicio
  const toggleService = (id: string) => {
    if (selectedService === id) {
      setSelectedService(null);
    } else {
      setSelectedService(id);
      // Contraer automáticamente si está expandido
      if (isExpandedRef.current) {
        isExpandedRef.current = false;
        RNAnimated.spring(sheetAnim, {
          toValue: SHEET_MIN_HEIGHT,
          friction: 8,
          tension: 40,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  // Fetch POI markers when service is selected
  useEffect(() => {
    if (!selectedService || !location) {
      setPoiMarkers([]);
      return;
    }

    let cancelled = false;
    setLoadingPOIs(true);

    fetchNearbyPOIs(
      location.coords.latitude,
      location.coords.longitude,
      selectedService,
      5000,
    ).then((results) => {
      if (!cancelled) {
        setPoiMarkers(results);
        setLoadingPOIs(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setPoiMarkers([]);
        setLoadingPOIs(false);
      }
    });

    return () => { cancelled = true; };
  }, [selectedService, location]);

  // Center map on user location
  const handleCenterOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 600);
    }
  };

  const mapRegion: Region = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 19.4326,
        longitude: -99.1332,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* MAPA ABSOLUTO */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        region={mapRegion}
        showsUserLocation={locationAllowed}
        followsUserLocation={false}
        showsMyLocationButton={false}
        customMapStyle={activeTheme === "dark" ? RESCUE_DARK_MAP_STYLE : undefined}
      >
        {/* // TODO: Copilot - Renderizar Markers aquí */}
        {poiMarkers.map((poi) => {
          const svc = MAP_SERVICES.find((s) => s.id === selectedService);
          const dist = location
            ? distanceKm(location.coords.latitude, location.coords.longitude, poi.latitude, poi.longitude)
            : null;
          return (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              pinColor={svc?.colorHex ?? "#E11D48"}
            >
              <Callout onPress={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
                Linking.openURL(url);
              }}>
                <View style={{ maxWidth: 200, padding: 4 }}>
                  <Text style={{ fontWeight: "800", fontSize: 14 }}>{poi.name}</Text>
                  {poi.address ? <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{poi.address}</Text> : null}
                  {dist !== null ? <Text style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{dist.toFixed(1)} km</Text> : null}
                  <Text style={{ fontSize: 12, color: svc?.colorHex ?? "#0EA5E9", fontWeight: "700", marginTop: 4 }}>Navegar →</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* HEADER FLOTANTE */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]} pointerEvents="box-none">
        <BlurView intensity={activeTheme === "dark" ? 40 : 80} tint={activeTheme} style={[styles.headerBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === "es" ? "Ubicación Actual" : "Current Location"}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {location ? `Satélites Conectados` : "Buscando satélites..."}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <ContactShortcut />
            <WeatherWidget/>
            <BatteryWarning />
            <Pressable style={[styles.profileBtn, { backgroundColor: colors.surface }]} onPress={() => router.push("/(tabs)/options")}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileInitials, { backgroundColor: colors.primary }]}>
                <Text style={styles.profileInitialsText}>
                  {(user?.displayName ?? "U").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>

      {/* FAB: Rex (Chatbot) */}
      <RNAnimated.View style={[
          styles.aiFabContainer, 
          { bottom: RNAnimated.add(sheetAnim, 24) }
        ]}
      >
        <Animated.View style={floatStyle}>
          <Pressable onPress={() => router.push("/(tabs)/chatbot")} style={styles.aiFab}>
            <RexAvatar size={56} />
          </Pressable>
        </Animated.View>
      </RNAnimated.View>

      {/* BOTÓN: CENTRAR EN MI UBICACIÓN */}
      <RNAnimated.View style={[
          styles.centerBtnContainer, 
          { bottom: RNAnimated.add(sheetAnim, 100) }
        ]}
      >
        <Pressable onPress={handleCenterOnUser}>
          <BlurView
            intensity={activeTheme === "dark" ? 40 : 80}
            tint={activeTheme}
            style={[styles.centerBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.cardBorder }]}
          >
            <Ionicons name="locate" size={22} color={colors.primary} />
          </BlurView>
        </Pressable>
      </RNAnimated.View>

      {/* FAB (SOS Button) - MOVES WITH BOTTOM SHEET */}
      <RNAnimated.View style={[
          styles.fabContainer, 
          { 
            bottom: RNAnimated.add(sheetAnim, 24),
          }
        ]}
      >
        <Animated.View style={pulseStyle}>
          <Pressable 
            onPress={() => setShowSOSModal(true)}
            style={[styles.sosFab, { shadowColor: '#E11D48', elevation: 12 }]} 
          >
            <MaterialCommunityIcons name="alert" size={34} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </RNAnimated.View>

      {/* BOTTOM SHEET INTERACTIVO */}
      <BottomSheetServices
        sheetAnim={sheetAnim}
        activeTheme={activeTheme}
        colors={colors}
        language={language}
        panResponder={panResponder}
        selectedService={selectedService}
        loadingPOIs={loadingPOIs}
        poiCount={poiMarkers.length}
        onToggleService={toggleService}
      />

      {/* CUSTOM THEME MODAL */}
      <Modal transparent visible={showThemeModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: colors.mapBackground }]}>
              <Ionicons name="color-palette-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {language === "es" ? "Tema Recomendado" : "Recommended Theme"}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              {language === "es" 
                ? "RescueNow utiliza colores vibrantes de día y oscuros de noche para proteger tu vista. ¿Deseas usar esta recomendación o prefieres el tema de tu teléfono?"
                : "RescueNow uses vibrant colors during the day and dark colors at night to reduce eye strain. Would you like to use this recommendation or your device's theme?"
              }
            </Text>
            
            <View style={styles.modalButtons}>
              <Pressable 
                onPress={() => {
                  void updateAppPreferences({ themeMode: "time", hasPromptedTheme: true });
                  setShowThemeModal(false);
                }}
                style={[styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {language === "es" ? "Usar recomendación de la aplicación" : "Use app recommendation"}
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => {
                  void updateAppPreferences({ themeMode: "system", hasPromptedTheme: true });
                  setShowThemeModal(false);
                }}
                style={[styles.modalBtnSecondary, { borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.modalBtnSecondaryText, { color: colors.textPrimary }]}>
                  {language === "es" ? "Usar el tema del teléfono" : "Use device theme"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM CONTACT PROMPT MODAL */}
      <Modal transparent visible={showContactModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: colors.mapBackground }]}>
              <Ionicons name="shield-checkmark" size={36} color={colors.success} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
               Contacto de Confianza
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
               Te sugerimos añadir un número de teléfono de emergencia y establecer tus datos médicos (Tipo de Sangre, Alergias) desde tu Perfil para usar el sistema S.O.S.
            </Text>
            
            <View style={styles.modalButtons}>
              <Pressable 
                onPress={() => {
                  void updateAppPreferences({ hasPromptedContact: true });
                  setShowContactModal(false);
                  router.push("/(tabs)/options");
                }}
                style={[styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalBtnPrimaryText}>Ir a Configurar</Text>
              </Pressable>

              <Pressable 
                onPress={() => {
                  void updateAppPreferences({ hasPromptedContact: false });
                  setShowContactModal(false);
                }}
                style={[styles.modalBtnSecondary, { borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.modalBtnSecondaryText, { color: colors.textPrimary }]}>
                  Recordarme más tarde
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* SOS COUNTDOWN MODAL — MANUAL PRESS */}
      <Modal transparent visible={showSOSModal && !crashTriggered} animationType="fade">
<Animated.View style={[styles.sosModalOverlay, sosPulseAnimatedStyle]}>
            <Text style={styles.sosAlertTitle}>¡EMERGENCIA INICIADA!</Text>
            <Text style={styles.sosAlertDesc}>En breve se mandará un mensaje y tu ubicación exacta al contacto predeterminado y a los sistemas de emergencia.</Text>

            <View style={styles.countdownContainer}>
              <Text style={styles.countdownNumber}>{sosCountdown}</Text>
              <Text style={styles.countdownLabel}>segundos</Text>
            </View>

            <Pressable 
               onPress={() => setShowSOSModal(false)}
               style={styles.sosCancelBtn}
            >
               <Text style={styles.sosCancelText}>CANCELAR ALERTA</Text>
            </Pressable>
        </Animated.View>
      </Modal>

      {/* CRASH DETECTION FULLSCREEN */}
      <Modal transparent visible={showSOSModal && crashTriggered} animationType="fade">
        <View style={styles.crashFullscreen}>
          <View style={styles.crashPulseRing3} />
          <View style={styles.crashPulseRing2} />
          <View style={styles.crashPulseRing1} />

          <View style={styles.crashIconContainer}>
            <MaterialCommunityIcons name="car-emergency" size={56} color="#FFFFFF" />
          </View>

          <Text style={styles.crashTitle}>{"¿ESTÁS BIEN?"}</Text>
          <Text style={styles.crashSubtitle}>
            {"Detectamos un posible accidente.\nSi no respondes, enviaremos ayuda automáticamente."}
          </Text>

          <View style={styles.crashCountdownCircle}>
            <Text style={styles.crashCountdownNumber}>{sosCountdown}</Text>
          </View>
          <Text style={styles.crashCountdownLabel}>segundos para enviar alerta</Text>

          <Pressable
            onPress={() => {
              setShowSOSModal(false);
              setCrashTriggered(false);
            }}
            style={styles.crashOkButton}
          >
            <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
            <Text style={styles.crashOkText}>ESTOY BIEN</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setShowSOSModal(false);
              setCrashTriggered(false);
            }}
            style={styles.crashCancelLink}
          >
            <Text style={styles.crashCancelText}>Fue una falsa alarma</Text>
          </Pressable>
        </View>
      </Modal>

      {/* MEDICAL ID FULLSCREEN OVERLAY (OFFLINE SAFE) */}
      <Modal transparent visible={showMedicalID} animationType="fade">
        <View style={[styles.medicalOverlay, { backgroundColor: colors.background }]}>
           <View style={[styles.medicalHeader, { backgroundColor: colors.danger }]}>
             <MaterialCommunityIcons name="medical-bag" size={48} color="#FFF" style={{marginBottom: 8}} />
             <Text style={styles.medicalHeaderTitle}>FICHA MÉDICA S.O.S</Text>
             <Text style={styles.medicalHeaderSubtitle}>Esta persona ha solicitado ayuda de emergencia.</Text>
           </View>
           
           <ScrollView contentContainerStyle={styles.medicalScroll} showsVerticalScrollIndicator={false}>
             <View style={[styles.medicalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Text style={[styles.medicalLabel, { color: colors.textSecondary }]}>TIPO DE SANGRE</Text>
                <Text style={[styles.medicalValue, { color: colors.danger, fontSize: 32 }]}>{medicalData.bloodType}</Text>
             </View>

             <View style={[styles.medicalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Text style={[styles.medicalLabel, { color: colors.textSecondary }]}>ALERGIAS</Text>
                <Text style={[styles.medicalValue, { color: colors.textPrimary }]}>{medicalData.allergies}</Text>
             </View>

             <View style={[styles.medicalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Text style={[styles.medicalLabel, { color: colors.textSecondary }]}>CONDICIONES MÉDICAS</Text>
                <Text style={[styles.medicalValue, { color: colors.textPrimary, lineHeight: 24 }]}>{medicalData.conditions}</Text>
             </View>

             <View style={[styles.medicalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Text style={[styles.medicalLabel, { color: colors.textSecondary }]}>CONTACTO DE EMERGENCIA</Text>
                <Text style={[styles.medicalValue, { color: colors.textPrimary }]}>{medicalData.contact}</Text>
             </View>

             <View style={{ height: 100 }} />
           </ScrollView>

           <Pressable style={styles.medicalDismissBtn} onPress={() => setShowMedicalID(false)}>
             <Text style={styles.medicalDismissText}>X CERRAR FICHA MÉDICA</Text>
           </Pressable>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: 'absolute', top: 0, width: '100%', paddingHorizontal: 16, zIndex: 10 },
  headerBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 20, borderWidth: 1, shadowColor: "#0B1120", shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 0 },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerRight: { alignItems: "center", gap: 8 },
  headerSubtitle: { fontSize: 12, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  profileBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  profileAvatar: { width: 40, height: 40, borderRadius: 20 },
  profileInitials: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileInitialsText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  aiFabContainer: { position: 'absolute', left: 20, zIndex: 30 },
  aiFab: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  fabContainer: { position: 'absolute', right: 20, zIndex: 30 },
  sosFab: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E11D48', alignItems: 'center', justifyContent: 'center', shadowColor: '#E11D48', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  centerBtnContainer: { position: 'absolute', right: 20, zIndex: 25 },
  centerBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#0B1120', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 17, 32, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', borderRadius: 24, padding: 28, alignItems: 'center', shadowColor: '#0B1120', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 32, elevation: 15 },
  modalIconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  modalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500', marginBottom: 28 },
  modalButtons: { width: '100%', gap: 12 },
  modalBtnPrimary: { width: '100%', paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  modalBtnPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  modalBtnSecondary: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 14, fontWeight: '700' },
  
  // === Manual SOS Modal Styles ===
  sosModalOverlay: { flex: 1, backgroundColor: 'rgba(11, 17, 32, 0.97)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  sosAlertTitle: { color: '#E11D48', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  sosAlertDesc: { color: '#F8FAFC', fontSize: 16, textAlign: 'center', opacity: 0.9, lineHeight: 24, marginBottom: 40 },
  countdownContainer: { width: 220, height: 220, borderRadius: 110, borderWidth: 6, borderColor: '#E11D48', justifyContent: 'center', alignItems: 'center', marginBottom: 48, backgroundColor: 'rgba(225, 29, 72, 0.1)' },
  countdownNumber: { color: '#F8FAFC', fontSize: 80, fontWeight: '900' },
  countdownLabel: { color: '#F8FAFC', fontSize: 16, fontWeight: '600', opacity: 0.8 },
  sosCancelBtn: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#F8FAFC', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  sosCancelText: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  // === Crash Detection Fullscreen Styles ===
  crashFullscreen: {
    flex: 1,
    backgroundColor: '#7F1D1D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  crashPulseRing3: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  crashPulseRing2: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  crashPulseRing1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(220, 38, 38, 0.18)',
  },
  crashIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  crashTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  crashSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: 16,
  },
  crashCountdownCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  crashCountdownNumber: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '900',
  },
  crashCountdownLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 40,
  },
  crashOkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#16A34A',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 48,
    width: '100%',
    shadowColor: '#16A34A',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    marginBottom: 16,
  },
  crashOkText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  crashCancelLink: {
    paddingVertical: 12,
  },
  crashCancelText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  medicalOverlay: { flex: 1 },
  medicalHeader: { alignItems: 'center', justifyContent: 'center', paddingTop: 64, paddingBottom: 32, paddingHorizontal: 24 },
  medicalHeaderTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },
  medicalHeaderSubtitle: { color: '#FFF', fontSize: 15, fontWeight: '500', textAlign: 'center', opacity: 0.9, marginTop: 8 },
  medicalScroll: { padding: 24, paddingBottom: 100 },
  medicalCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
  medicalLabel: { fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  medicalValue: { fontSize: 18, fontWeight: '700' },
  medicalDismissBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#0B1120', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, shadowColor: '#0B1120', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  medicalDismissText: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
});
