import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/brand/brand-logo";
import { getAppPreferences, updateAppPreferences } from "@/constants/app-preferences";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useUserLocation } from "@/hooks/use-user-location";

// TODO: Copilot - Inserta aquí el JSON de tu mapa oscuro
const RESCUE_DARK_MAP_STYLE: any[] = []; 

type ServiceOption = {
  id: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  colorHex: string;
};

// 6 Servicios Base
const SERVICES: ServiceOption[] = [
  { id: "accident", titleEs: "Accidente", titleEn: "Accident", descEs: "Choque o volcadura severa", descEn: "Severe crash or rollover", icon: "car-emergency", colorHex: "#DC2626" },
  { id: "tow", titleEs: "Grúa", titleEn: "Tow", descEs: "Vehículo inmovilizado", descEn: "Immobilized vehicle", icon: "tow-truck", colorHex: "#FFB800" },
  { id: "mechanic", titleEs: "Mecánico", titleEn: "Mechanic", descEs: "Falla de motor o batería", descEn: "Engine or battery failure", icon: "wrench", colorHex: "#3B82F6" },
  { id: "gas", titleEs: "Gasolina", titleEn: "Gas", descEs: "Sin combustible", descEn: "Out of fuel", icon: "gas-station", colorHex: "#10B981" },
  { id: "tire", titleEs: "Llantera", titleEn: "Tire", descEs: "Ponchadura o presión baja", descEn: "Puncture or low pressure", icon: "tire", colorHex: "#F97316" },
  { id: "locksmith", titleEs: "Cerrajero", titleEn: "Locksmith", descEs: "Llaves atascadas", descEn: "Lost or stuck keys", icon: "key", colorHex: "#8B5CF6" },
];

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
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Bottom Sheet Físicas
  const sheetAnim = useRef(new Animated.Value(SHEET_MIN_HEIGHT)).current;
  const isExpandedRef = useRef(false);

  // State para Modales y Emergencia
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // SOS Mechanic states
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(10);
  const [showMedicalID, setShowMedicalID] = useState(false);
  
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

  // TODO: Copilot Backend & Sensors - Detección Automática de Choques / Caídas
  // Para usuarios de motos: Integrar `expo-sensors` (Accelerometer o Gyroscope).
  // Suscribirse a los sensores en segundo plano y, si detecta una sacudida extrema 
  // (e.g. Aceleración > 4G o 40m/s² de golpe), disparar automáticamente `setShowSOSModal(true)`
  // Aquí mismo en un useEffect.

  // SOS Countdown Mechanism
  useEffect(() => {
    if (showSOSModal) {
      setSosCountdown(10);
      countdownIntervalRef.current = setInterval(() => {
        setSosCountdown((prev) => {
          if (prev <= 1) {
             clearInterval(countdownIntervalRef.current!);
             triggerEmergency();
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [showSOSModal]);

  const triggerEmergency = () => {
    setShowSOSModal(false);
    
    // TODO: Copilot Backend - Aquí integrar la lógica para:
    // 1. Enviar SMS con expo-sms al Contacto de Confianza (location.coords)
    // 2. Disparar API de Firebase para notificar a Centro de Control / 911
    // 3. Registrar en base de datos local (SQLite o AsyncStorage) el incidente offline.
    
    setShowMedicalID(true);
  };

  // Pulse animation for FAB
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

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
        Animated.spring(sheetAnim, {
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
        Animated.spring(sheetAnim, {
          toValue: SHEET_MIN_HEIGHT,
          friction: 8,
          tension: 40,
          useNativeDriver: false,
        }).start();
      }
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
        style={StyleSheet.absoluteFillObject}
        region={mapRegion}
        showsUserLocation={locationAllowed}
        followsUserLocation={locationAllowed}
        showsMyLocationButton={false}
        customMapStyle={activeTheme === "dark" ? RESCUE_DARK_MAP_STYLE : undefined}
      >
        {/* // TODO: Copilot - Renderizar Markers aquí */}
      </MapView>

      {/* HEADER FLOTANTE */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]} pointerEvents="box-none">
        <View style={[styles.headerBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === "es" ? "Ubicación Actual" : "Current Location"}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {location ? `Satélites Conectados` : "Buscando satélites..."}
            </Text>
          </View>
          <Pressable style={styles.profileBtn} onPress={() => router.push("/(tabs)/options")}>
             <BrandLogo width={36} height={36} />
          </Pressable>
        </View>
      </View>

      {/* FAB: RESCUE AI (Chatbot) */}
      <Animated.View style={[
          styles.aiFabContainer, 
          { bottom: Animated.add(sheetAnim, 24) }
        ]}
      >
        <Pressable 
          style={[styles.aiFab, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.accent }]} 
          onPress={() => router.push("/(tabs)/chatbot")}
        >
          <MaterialCommunityIcons name="robot-outline" size={28} color={colors.accent} />
        </Pressable>
      </Animated.View>

      {/* FAB (SOS Button) - SEPARATED VIEWS FIX */}
      <Animated.View style={[
          styles.fabContainer, 
          { 
            bottom: Animated.add(sheetAnim, 24) // JS Driven
          }
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable 
            onPress={() => setShowSOSModal(true)}
            style={[styles.sosFab, { shadowColor: '#DC2626', elevation: 12 }]} 
          >
            <MaterialCommunityIcons name="alert" size={34} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* BOTTOM SHEET INTERACTIVO */}
      <Animated.View 
        style={[
          styles.bottomSheet, 
          { 
            height: sheetAnim, 
            backgroundColor: colors.surface, 
            borderColor: colors.cardBorder, 
            paddingBottom: Math.max(insets.bottom, 20) 
          }
        ]}
      >
        {/* Manija de Arrastre */}
        <View style={styles.dragHandleWrapper} {...panResponder.panHandlers}>
          <View style={[styles.dragHandle, { backgroundColor: colors.cardBorder }]} />
        </View>

        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
          {language === "es" ? "¿Qué asistencia necesitas?" : "What assistance do you need?"}
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridMode}
        >
          {SERVICES.map((service) => {
            const isSelected = selectedService === service.id;
            const bgColor = isSelected ? `${service.colorHex}15` : 'transparent';
            const borderColor = isSelected ? service.colorHex : colors.cardBorder;
            const shadowForce = isSelected ? { shadowColor: service.colorHex, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 } : {};

            return (
              <Pressable
                key={service.id}
                onPress={() => toggleService(service.id)}
                style={[
                  styles.serviceGridCard,
                  { backgroundColor: bgColor, borderColor },
                  shadowForce
                ]}
              >
                <MaterialCommunityIcons 
                  name={service.icon} 
                  size={32} 
                  color={isSelected ? service.colorHex : colors.textSecondary} 
                  style={{ marginBottom: 10 }}
                />
                <Text style={[styles.serviceTitle, { color: colors.textPrimary }]}>
                  {language === "es" ? service.titleEs : service.titleEn}
                </Text>
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {language === "es" ? service.descEs : service.descEn}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

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

      {/* SOS COUNTDOWN MODAL */}
      <Modal transparent visible={showSOSModal} animationType="fade">
        <View style={styles.sosModalOverlay}>
           <Text style={styles.sosAlertTitle}>¡EMERGENCIA INICIADA!</Text>
           <Text style={styles.sosAlertDesc}>En breve se mandará un mensaje y tu ubicación exacta al contado predeterminado y a los sistemas de emergencia.</Text>

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
  headerBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 24, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerSubtitle: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  profileBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  aiFabContainer: { position: 'absolute', left: 20, zIndex: 30 },
  aiFab: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabContainer: { position: 'absolute', right: 20, zIndex: 30 },
  sosFab: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16 },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, borderBottomWidth: 0, zIndex: 20, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -5 } },
  dragHandleWrapper: { width: '100%', alignItems: 'center', paddingVertical: 14 },
  dragHandle: { width: 48, height: 5, borderRadius: 3, opacity: 0.8 },
  sheetTitle: { fontSize: 20, fontWeight: '900', paddingHorizontal: 24, marginBottom: 16, letterSpacing: 0.2 },
  gridMode: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingBottom: 24, justifyContent: 'space-between' },
  serviceGridCard: { width: '48%', borderRadius: 24, borderWidth: 1.5, alignItems: 'flex-start', padding: 18, marginBottom: 16 },
  serviceTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  serviceDesc: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', borderRadius: 32, padding: 28, borderWidth: 1, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 15 },
  modalIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  modalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500', marginBottom: 28 },
  modalButtons: { width: '100%', gap: 12 },
  modalBtnPrimary: { width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  modalBtnPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  modalBtnSecondary: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5 },
  modalBtnSecondaryText: { fontSize: 14, fontWeight: '700' },
  
  sosModalOverlay: { flex: 1, backgroundColor: 'rgba(20, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  sosAlertTitle: { color: '#DC2626', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  sosAlertDesc: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', opacity: 0.9, lineHeight: 24, marginBottom: 40 },
  countdownContainer: { width: 220, height: 220, borderRadius: 110, borderWidth: 8, borderColor: '#DC2626', justifyContent: 'center', alignItems: 'center', marginBottom: 48, backgroundColor: 'rgba(220, 38, 38, 0.15)' },
  countdownNumber: { color: '#FFFFFF', fontSize: 80, fontWeight: '900' },
  countdownLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', opacity: 0.8 },
  sosCancelBtn: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 24, paddingVertical: 18, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  sosCancelText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  medicalOverlay: { flex: 1 },
  medicalHeader: { alignItems: 'center', justifyContent: 'center', paddingTop: 64, paddingBottom: 32, paddingHorizontal: 24, borderBottomWidth: 4, borderBottomColor: '#991B1B' },
  medicalHeaderTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },
  medicalHeaderSubtitle: { color: '#FFF', fontSize: 15, fontWeight: '500', textAlign: 'center', opacity: 0.9, marginTop: 8 },
  medicalScroll: { padding: 24, paddingBottom: 100 },
  medicalCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  medicalLabel: { fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  medicalValue: { fontSize: 18, fontWeight: '700' },
  medicalDismissBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#000', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  medicalDismissText: { color: '#FFF', fontSize: 14, fontWeight: '800' }
});
