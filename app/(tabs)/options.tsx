import { useActiveTheme } from "@/hooks/use-active-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { RESCUENOW_WEB_URL } from "@/constants/links";
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    withTiming as withTimingReanimated,
} from "react-native-reanimated";


import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShareAppCard } from "@/components/features/ShareAppCard";
import { CrashSensitivitySlider } from "@/components/features/CrashSensitivitySlider";
import { getAppCopy } from "@/constants/app-copy";
import {
    AccountRole,
    AppLanguage,
    DEFAULT_APP_PREFERENCES,
    getAppPreferences,
    SubscriptionPlan,
    ThemeMode,
    updateAppPreferences,
} from "@/constants/app-preferences";
import {
    DEFAULT_SOS_SETTINGS,
    SOSSoundOption,
    SOS_SOUND_OPTIONS,
} from "@/constants/sos-settings";
import {
    DEFAULT_CRASH_SENSITIVITY,
    CrashSensitivitySettings,
} from "@/constants/crash-settings";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { useAuth } from "@/lib/auth-context";
import { firebaseAuth, firestoreDb } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function OptionsScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const { user } = useAuth();
  
  const [language, setLanguage] = useState<AppLanguage>(DEFAULT_APP_PREFERENCES.language);
  const [themeMode, setThemeMode] = useState<ThemeMode>(DEFAULT_APP_PREFERENCES.themeMode);
  
  const [trustedContactCountryCode, setTrustedContactCountryCode] = useState(DEFAULT_APP_PREFERENCES.trustedContactCountryCode);
  const [trustedContactPhone, setTrustedContactPhone] = useState(DEFAULT_APP_PREFERENCES.trustedContactPhone);
  const [trustedContactName, setTrustedContactName] = useState(DEFAULT_APP_PREFERENCES.trustedContactName);
  const [useTrustedContact, setUseTrustedContact] = useState(DEFAULT_APP_PREFERENCES.useTrustedContact);
  
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(DEFAULT_APP_PREFERENCES.subscriptionPlan);
  const [accountRole, setAccountRole] = useState<AccountRole>(DEFAULT_APP_PREFERENCES.accountRole);

  const [sosSound, setSosSound] = useState<SOSSoundOption>(DEFAULT_SOS_SETTINGS.sound);
  const [sosVibration, setSosVibration] = useState<boolean>(DEFAULT_SOS_SETTINGS.vibration);

  const [crashThreshold, setCrashThreshold] = useState<number>(DEFAULT_CRASH_SENSITIVITY.threshold);
  const [showCrashExplanation, setShowCrashExplanation] = useState(false);
  const crashExplanationHeight = useSharedValue(0);
  const crashExplanationOpacity = useSharedValue(0);

  const toggleCrashExplanation = () => {
    const willShow = !showCrashExplanation;
    setShowCrashExplanation(willShow);
    crashExplanationHeight.value = withTimingReanimated(willShow ? 1 : 0, { duration: 300 });
    crashExplanationOpacity.value = withSequence(
      withTimingReanimated(willShow ? 1 : 0, { duration: 200 }),
      withTimingReanimated(willShow ? 1 : 0, { duration: 100 })
    );
  };

  const crashExplanationStyle = useAnimatedStyle(() => ({
    height: crashExplanationHeight.value * 320,
    opacity: crashExplanationOpacity.value,
    overflow: "hidden",
  }));

  const entranceReady = !isLoadingPrefs;
  
  // Premium Starburst / Radar Animation (Reanimated native thread)
  const premiumPulse = useSharedValue(1);
  const premiumRotate = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      const loadPreferences = async () => {
        const preferences = await getAppPreferences();
        setLanguage(preferences.language);
        setThemeMode(preferences.themeMode);
        setTrustedContactCountryCode(preferences.trustedContactCountryCode);
        setTrustedContactPhone(preferences.trustedContactPhone);
        setTrustedContactName(preferences.trustedContactName);
        setUseTrustedContact(preferences.useTrustedContact);
        setSubscriptionPlan(preferences.subscriptionPlan);
        setAccountRole(preferences.accountRole);
        // If the user downgraded to free while owning a Premium SOS sound,
        // snap back to "default" so we never play a sound they no longer own.
        if (preferences.subscriptionPlan !== "premium" && preferences.sosSound !== "default") {
          setSosSound("default");
          await updateAppPreferences({ sosSound: "default" });
        } else {
          setSosSound(preferences.sosSound);
        }
        setSosVibration(preferences.sosVibration);
        setIsLoadingPrefs(false);
      };
      void loadPreferences();
    }, [])
  );

  useEffect(() => {
    if (subscriptionPlan === "premium" && !reduceMotionEnabled) {
      premiumPulse.value = withRepeat(
        withTiming(1.25, { duration: 1500 }),
        -1,
        true,
      );
      premiumRotate.value = withRepeat(
        withTiming(360, { duration: 10000 }),
        -1,
        false,
      );
    } else {
      premiumPulse.value = 1;
      premiumRotate.value = 0;
    }
  }, [subscriptionPlan, reduceMotionEnabled, premiumPulse, premiumRotate]);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: premiumPulse.value }],
    opacity: 1.25 - premiumPulse.value, // 0.25 -> 0 when scaling
  }));

  const spinRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${premiumRotate.value}deg` }],
  }));

  const handleThemeChange = async (nextTheme: ThemeMode) => {
    if (nextTheme === themeMode || isSavingTheme) return;
    setThemeMode(nextTheme);
    setIsSavingTheme(true);
    await updateAppPreferences({ themeMode: nextTheme });
    setIsSavingTheme(false);
  };

  const handleSaveContact = async () => {
    if (isSavingContact) return;
    setIsSavingContact(true);
    
    // Save to AppPreferences
    const nextPrefs = await updateAppPreferences({ 
      trustedContactCountryCode, 
      trustedContactPhone, 
      trustedContactName, 
      useTrustedContact 
    });
    setTrustedContactCountryCode(nextPrefs.trustedContactCountryCode);
    setTrustedContactPhone(nextPrefs.trustedContactPhone);
    setTrustedContactName(nextPrefs.trustedContactName);
    setUseTrustedContact(nextPrefs.useTrustedContact);

    // Backup to Firestore (best-effort)
    if (user) {
      try {
        await setDoc(doc(firestoreDb, "users", user.uid), {
          trustedContactCountryCode: nextPrefs.trustedContactCountryCode,
          trustedContactPhone: nextPrefs.trustedContactPhone,
          trustedContactName: nextPrefs.trustedContactName,
          useTrustedContact: nextPrefs.useTrustedContact,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore contact backup failed:", e);
      }
    }

    setIsSavingContact(false);
  };

  const handleTogglePlan = async () => {
    if (isSavingPlan) return;
    setIsSavingPlan(true);
    const nextPlan = subscriptionPlan === "premium" ? "free" : "premium";
    const nextPrefs = await updateAppPreferences({ subscriptionPlan: nextPlan });
    setSubscriptionPlan(nextPrefs.subscriptionPlan);

    // Sync to Firestore (best-effort)
    if (user) {
      try {
        await setDoc(doc(firestoreDb, "users", user.uid), {
          subscriptionPlan: nextPlan,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore plan sync failed:", e);
      }
    }

    setIsSavingPlan(false);
  };

  // Single source file (alarm.mp3) with different playback parameters per option,
  // so the preview audibly distinguishes each choice without bundling more assets.
  const SOUND_PROFILE: Record<
    SOSSoundOption,
    { rate: number; volume: number; durationMs: number } | null
  > = {
    silent: null,
    default: { rate: 1.0, volume: 0.55, durationMs: 900 },
    alarm: { rate: 0.85, volume: 0.85, durationMs: 1600 },
    siren: { rate: 1.45, volume: 0.95, durationMs: 1800 },
  };

  const previewSoundRef = useRef<Audio.Sound | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPreview = async () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    const s = previewSoundRef.current;
    previewSoundRef.current = null;
    if (s) {
      try {
        await s.stopAsync();
      } catch {}
      try {
        await s.unloadAsync();
      } catch {}
    }
  };

  const playSoundPreview = async (sound: SOSSoundOption) => {
    const profile = SOUND_PROFILE[sound];
    if (!profile) {
      await stopPreview();
      return;
    }
    await stopPreview();

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound: audioSound } = await Audio.Sound.createAsync(
        require("@/assets/audio/alarm.mp3"),
        {
          shouldPlay: true,
          volume: profile.volume,
          isLooping: false,
          rate: profile.rate,
          shouldCorrectPitch: false,
        },
      );
      previewSoundRef.current = audioSound;

      previewTimeoutRef.current = setTimeout(() => {
        void stopPreview();
      }, profile.durationMs);
    } catch (error) {
      console.warn("Sound preview failed:", error);
    }
  };

  useEffect(() => {
    return () => {
      void stopPreview();
    };
  }, []);

  // Only "default" is free. Any other sound is gated behind Premium so the
  // free tier still gets a working SOS sound without unlocking customization.
  const SOS_FREE_SOUND: SOSSoundOption = "default";

  const handleSOSSoundChange = async (sound: SOSSoundOption) => {
    if (subscriptionPlan !== "premium" && sound !== SOS_FREE_SOUND) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push("/premium");
      return;
    }
    setSosSound(sound);
    await updateAppPreferences({ sosSound: sound });
    void playSoundPreview(sound);
  };

  const handleSOSVibrationChange = async (vibration: boolean) => {
    setSosVibration(vibration);
    await updateAppPreferences({ sosVibration: vibration });
  };


  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      await updateAppPreferences({ trustedContactPhone: "", useTrustedContact: false, subscriptionPlan: "free", accountRole: "user" });
    } finally {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View style={styles.safeArea}>
      <LinearGradient 
        colors={colors.gradientBg} 
        style={StyleSheet.absoluteFillObject} 
      />
      <SafeAreaView style={styles.safeArea}>
      <BlurView intensity={activeTheme === "dark" ? 40 : 80} tint={activeTheme} style={[styles.headerBar, { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.navigate("/(tabs)")}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mi Perfil</Text>
        <View style={styles.backBtn} />
      </BlurView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          
          {/* 1. SECCIÓN DE PERFIL CENTRADO */}
          <Card elevated style={[styles.profileHeroCard, { borderColor: colors.cardBorder }]}>
            <View style={styles.avatarWrapper}>
              {subscriptionPlan === "premium" && (
                <>
                  <Animated.View style={[
                    styles.premiumPulseRing,
                    { backgroundColor: colors.accent },
                    pulseRingStyle
                  ]} />
                  <Animated.View style={[
                    styles.premiumMultiColorRing,
                    spinRingStyle
                  ]} />
                </>
              )}
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarInitials, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitialsText}>
                    {(user?.displayName ?? "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.displayName || "Usuario"}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || "Sin correo"}</Text>

            <View style={[styles.profileBadge, { backgroundColor: subscriptionPlan === "premium" ? `${colors.accent}20` : colors.mapBackground, borderColor: subscriptionPlan === "premium" ? colors.accent : colors.cardBorder }]}>
              <MaterialCommunityIcons
                name={subscriptionPlan === "premium" ? "crown" : "account-circle-outline"}
                size={13}
                color={subscriptionPlan === "premium" ? colors.accent : colors.textSecondary}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.profileBadgeText, { color: subscriptionPlan === "premium" ? colors.accent : colors.textSecondary }]}>
                {subscriptionPlan === "premium" ? "Miembro Premium" : "Usuario Estándar"}
              </Text>
            </View>

            <Pressable
              style={[styles.editProfileBtn, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}
              onPress={() => router.push("/(tabs)/edit-profile")}
            >
              <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>Editar Perfil</Text>
            </Pressable>
          </Card>

          {/* ACCESO RÁPIDO A PERFIL MÉDICO */}
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/medical-id");
            }}
          >
            <Card style={[styles.medicalCard, { borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.medicalIconWrap, { backgroundColor: 'rgba(225, 29, 72, 0.08)' }]}>
                <MaterialCommunityIcons name="medical-bag" size={24} color="#E11D48" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.medicalCardTitle, { color: colors.textPrimary }]}>Perfil Médico</Text>
                <Text style={[styles.medicalCardSubtitle, { color: colors.textSecondary }]}>Ver tu información de emergencia</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            </Card>
          </Pressable>

          {/* SAFETY CHECK-IN */}
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/safety-check");
            }}
          >
            <Card style={[styles.medicalCard, { borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.medicalIconWrap, { backgroundColor: `${colors.success}15` }]}>
                <MaterialCommunityIcons name="shield-check" size={24} color={colors.success} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.medicalCardTitle, { color: colors.textPrimary }]}>Check-in de Seguridad</Text>
                <Text style={[styles.medicalCardSubtitle, { color: colors.textSecondary }]}>Configura recordatorios de seguridad</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            </Card>
          </Pressable>

          {/* EMERGENCY TIPS */}
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/emergency-tips");
            }}
          >
            <Card style={[styles.medicalCard, { borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.medicalIconWrap, { backgroundColor: 'rgba(249, 115, 22, 0.08)' }]}>
                <MaterialCommunityIcons name="medical-bag" size={24} color="#F97316" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.medicalCardTitle, { color: colors.textPrimary }]}>Tips de Emergencia</Text>
                <Text style={[styles.medicalCardSubtitle, { color: colors.textSecondary }]}>Guía básica de primeros auxilios</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            </Card>
          </Pressable>

          {/* HISTORIAL DE UBICACIONES */}
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/location-history");
            }}
          >
            <Card style={[styles.medicalCard, { borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.medicalIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.08)' }]}>
                <Ionicons name="location" size={24} color="#22C55E" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.medicalCardTitle, { color: colors.textPrimary }]}>Historial de Ubicaciones</Text>
                <Text style={[styles.medicalCardSubtitle, { color: colors.textSecondary }]}>Ver ubicaciones guardadas</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            </Card>
          </Pressable>

          {/* HISTORIAL DE EMERGENCIAS */}
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/incident-history" as never);
            }}
          >
            <Card style={[styles.medicalCard, { borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.medicalIconWrap, { backgroundColor: 'rgba(225, 29, 72, 0.08)' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#E11D48" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.medicalCardTitle, { color: colors.textPrimary }]}>Historial de Emergencias</Text>
                <Text style={[styles.medicalCardSubtitle, { color: colors.textSecondary }]}>SOS manual y detecciones automáticas</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            </Card>
          </Pressable>

          {/* 2. SECCIÓN VIP / SUSCRIPCIÓN */}
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card style={[styles.cardGroup, { borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="crown" size={20} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Planes y Suscripción</Text>
            </View>
            
            <View style={styles.planContent}>
              <Text style={[styles.planSub, { color: colors.textSecondary }]}>
                {subscriptionPlan === "premium" 
                  ? "Tienes acceso a diagnósticos IA avanzados." 
                  : "Mejora para habilitar funciones exclusivas como diagnósticos Inteligentes."}
              </Text>
              
              <Pressable 
                onPress={() => router.push("/premium")}
                style={[styles.upgradeBtn, { backgroundColor: subscriptionPlan === "premium" ? colors.background : colors.primary }]}
              >
                <Text style={{ color: subscriptionPlan === "premium" ? colors.textPrimary : '#fff', fontWeight: '800' }}>
                  {subscriptionPlan === "premium" ? "Ver Detalles de mi Plan Premium" : "Explorar Planes"}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* 3. SECCIÓN DE AJUSTES GLOBALES */}
          <Card style={[styles.cardGroup, { borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Ajustes Generales</Text>
            </View>
            
            {/* TEMA */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Apariencia</Text>
              <View style={styles.pillsRow}>
                <Pressable onPress={() => handleThemeChange("light")} style={[styles.pillBtn, themeMode === "light" && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.pillText, themeMode === "light" ? { color: "#fff" } : { color: colors.textSecondary }]}>Claro</Text>
                </Pressable>
                <Pressable onPress={() => handleThemeChange("dark")} style={[styles.pillBtn, themeMode === "dark" && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.pillText, themeMode === "dark" ? { color: "#fff" } : { color: colors.textSecondary }]}>Oscuro</Text>
                </Pressable>
                <Pressable onPress={() => handleThemeChange("time")} style={[styles.pillBtn, themeMode === "time" && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.pillText, themeMode === "time" ? { color: "#fff" } : { color: colors.textSecondary }]}>Auto</Text>
                </Pressable>
              </View>
            </View>

            {/* CRASH SENSITIVITY */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Pressable onPress={toggleCrashExplanation}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text style={[styles.settingLabel, { color: colors.textSecondary, marginLeft: 6, marginBottom: 0 }]}>
                    ¿Qué significa esta sensibilidad?
                  </Text>
                </View>
              </Pressable>
              <Animated.View style={crashExplanationStyle}>
                <View style={[styles.crashExplanationBox, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.crashExplanationText, { color: colors.textSecondary }]}>
                    Esta función detecta posible accidentes de tránsito usando el acelerómetro de tu dispositivo.
                  </Text>
                  <Text style={[styles.crashExplanationText, { color: colors.textPrimary, marginTop: 8 }]}>
                    • Sensibilidad ALTA (7-10): Detecta golpes fuertes y bruscos. Ideal para terrenos con baches o caminos en mal estado. Puede activarse con menos fuerza.
                  </Text>
                  <Text style={[styles.crashExplanationText, { color: colors.textPrimary, marginTop: 8 }]}>
                    • Sensibilidad MEDIA (4-6): Equilibrio recomendado. Detecta impactos significativos sin ser demasiado sensible. Configuración recomendada para la mayoría de usuarios.
                  </Text>
                  <Text style={[styles.crashExplanationText, { color: colors.textPrimary, marginTop: 8 }]}>
                    • Sensibilidad BAJA (1-3): Solo detecta golpes muy intensos. Ideal si conduces en autopistas lisas o si recibes muchas falsas alarmas.
                  </Text>
                  <Text style={[styles.crashExplanationNote, { color: colors.accent, marginTop: 12 }]}>
                    NOTA: Esta función requiere que la app esté abierta o en segundo plano. Cerciórate de mantener RescueNow activo mientras conduces.
                  </Text>
                </View>
              </Animated.View>
              <CrashSensitivitySlider
                threshold={crashThreshold}
                onThresholdChange={setCrashThreshold}
                label="Sensibilidad de Detección de Choques"
              />
            </View>
          </Card>

          {/* SOS SOUND SETTINGS */}
          <Card style={[styles.cardGroup, { borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="bullhorn" size={18} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Sonido S.O.S.</Text>
            </View>
            <View style={styles.settingRowStack}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary, marginBottom: 12 }]}>Selecciona el sonido de alerta:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SOS_SOUND_OPTIONS.map(option => {
                  const isLocked = subscriptionPlan !== "premium" && option.id !== SOS_FREE_SOUND;
                  const isSelected = sosSound === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handleSOSSoundChange(option.id)}
                      style={[
                        styles.pillBtn,
                        isSelected
                          ? { backgroundColor: colors.primary, borderWidth: 0 }
                          : { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder, borderWidth: 1 },
                        isLocked && { opacity: 0.6 },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={option.icon as any}
                        size={14}
                        color={isSelected ? "#fff" : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.pillText, isSelected ? { color: "#fff" } : { color: colors.textSecondary }]}>{option.label}</Text>
                      {isLocked && (
                        <MaterialCommunityIcons
                          name="lock"
                          size={12}
                          color={colors.accent}
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {subscriptionPlan !== "premium" && (
                <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 8, color: colors.accent }}>
                  Los sonidos personalizados son exclusivos Premium.
                </Text>
              )}
              <View style={[styles.switchRow, { marginTop: 16 }]}>
                <Text style={[styles.settingLabel, { flex: 1, color: colors.textPrimary }]}>Vibración</Text>
                <Switch value={sosVibration} onValueChange={handleSOSVibrationChange} trackColor={{ false: colors.cardBorder, true: colors.primary }} thumbColor="#FFFFFF" />
              </View>
            </View>
          </Card>

          {/* 4. SECCIÓN CONTACTO DE CONFIANZA */}
          <Card style={[styles.cardGroup, { borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Contacto de Emergencia</Text>
            </View>
            <View style={styles.settingRowStack}>
                <Text style={{fontSize: 12, fontWeight: '700', marginBottom: 6, color: colors.textSecondary}}>Nombre o Parentesco:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
                  {["Mamá", "Papá", "Pareja", "Hijo/a", "Hermano/a", "Amigo/a"].map(rel => (
                    <Pressable 
                      key={rel} 
                      onPress={() => setTrustedContactName(rel)}
                      style={[
                        styles.pillBtn, 
                        trustedContactName === rel 
                          ? { backgroundColor: colors.primary, borderWidth: 0 } 
                          : { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder, borderWidth: 1 }
                      ]}
                    >
                      <Text style={[styles.pillText, trustedContactName === rel ? { color: "#fff" } : { color: colors.textSecondary }]}>{rel}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
               <TextInput
                  value={trustedContactName}
                  onChangeText={setTrustedContactName}
                  placeholder="Ej: Mamá, Papá..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.phoneInput, { color: colors.textPrimary, backgroundColor: colors.mapBackground, borderColor: colors.cardBorder, marginBottom: 12 }]}
                />

                <Text style={{fontSize: 12, fontWeight: '700', marginBottom: 6, color: colors.textSecondary}}>Lada / Código de País:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
                  {["+52", "+1", "+34", "+57", "+54", "+56"].map(l => (
                    <Pressable 
                      key={l} 
                      onPress={() => setTrustedContactCountryCode(l)}
                      style={[
                        styles.pillBtn, 
                        trustedContactCountryCode === l 
                          ? { backgroundColor: colors.accent, borderWidth: 0 } 
                          : { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder, borderWidth: 1 }
                      ]}
                    >
                      <Text style={[styles.pillText, trustedContactCountryCode === l ? { color: "#000" } : { color: colors.textSecondary }]}>{l}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={{fontSize: 12, fontWeight: '700', marginBottom: 6, color: colors.textSecondary}}>Número de Teléfono a 10 Dígitos:</Text>
               <TextInput
                  value={trustedContactPhone}
                  onChangeText={setTrustedContactPhone}
                  keyboardType="phone-pad"
                  placeholder="Ej: +52 55 1234 5678"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.phoneInput, { color: colors.textPrimary, backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}
                />
                <View style={[styles.switchRow, { marginTop: 12 }]}>
                  <Text style={[styles.settingLabel, { flex: 1, color: colors.textPrimary }]}>Alertar automáticamente en S.O.S.</Text>
                  <Switch value={useTrustedContact} onValueChange={setUseTrustedContact} trackColor={{ false: colors.cardBorder, true: colors.primary }} thumbColor="#FFFFFF" />
                </View>
                <Button
                  title="Guardar Contacto"
                  onPress={handleSaveContact}
                  loading={isSavingContact}
                  disabled={isSavingContact}
                  variant="primary"
                  style={{ marginTop: 16 }}
                />
            </View>
          </Card>

          {/* 5. CONOCE MÁS (Web) */}
          <Pressable
            onPress={() => {
              void WebBrowser.openBrowserAsync(RESCUENOW_WEB_URL, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
                toolbarColor: colors.background,
                controlsColor: colors.primary,
              });
            }}
            style={({ pressed }) => [
              styles.webLinkBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.webLinkIcon, { backgroundColor: `${colors.accent}15` }]}>
              <MaterialCommunityIcons name="web" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.webLinkTitle, { color: colors.textPrimary }]}>
                Conoce más sobre RescueNow
              </Text>
              <Text style={[styles.webLinkSub, { color: colors.textSecondary }]}>
                Visita nuestra página oficial
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
          </Pressable>

          {/* COMPARTIR APP */}
          <ShareAppCard />

          {/* 6. CERRAR SESIÓN */}
          <Button
            title="Cerrar Sesión"
            onPress={handleLogout}
            variant="danger"
            size="lg"
            style={{ marginTop: 10 }}
          />

        </Animated.View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: "900", textAlign: 'center', flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  profileHeroCard: { alignItems: 'center', borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, shadowColor: '#0B1120', shadowOpacity: 0.05, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 0 },
  avatarWrapper: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  premiumPulseRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45 },
  premiumMultiColorRing: { 
    position: 'absolute', 
    width: 106, 
    height: 106, 
    borderRadius: 53, 
    borderWidth: 3.5, 
    borderTopColor: '#E11D48', 
    borderRightColor: '#FFB800', 
    borderBottomColor: '#0EA5E9', 
    borderLeftColor: '#8B5CF6' 
  },
  avatarInner: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', shadowColor: "#0B1120", shadowOpacity: 0.06, shadowRadius: 16, zIndex: 10 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, zIndex: 10 },
  avatarInitials: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  avatarInitialsText: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  profileName: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  profileEmail: { fontSize: 13, marginBottom: 12 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  profileBadgeText: { fontSize: 12, fontWeight: '700' },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  cardGroup: { borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1, shadowColor: '#0B1120', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  medicalCard: { marginHorizontal: 0, marginBottom: 20, borderRadius: 16, padding: 16, borderWidth: 1, shadowColor: '#E11D48', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 0 },
  medicalIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  medicalCardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  medicalCardSubtitle: { fontSize: 13 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginLeft: 8 },
  planContent: { padding: 16 },
  planSub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  upgradeBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  settingRowStack: { paddingHorizontal: 16, paddingVertical: 16 },
  settingLabel: { fontSize: 14, fontWeight: '700' },
  pillsRow: { flexDirection: 'row', gap: 6 },
  pillBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  pillText: { fontSize: 12, fontWeight: '800' },
  phoneInput: { borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '600', borderWidth: 1 },
  saveContactBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  logoutButton: { marginTop: 10, borderRadius: 14, minHeight: 52, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  webLinkBtn: { marginTop: 18, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1 },
  webLinkIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  webLinkTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  webLinkSub: { fontSize: 12, fontWeight: "500" },
  crashExplanationBox: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  crashExplanationText: { fontSize: 13, lineHeight: 18 },
  crashExplanationNote: { fontSize: 12, fontWeight: "700" }
});
