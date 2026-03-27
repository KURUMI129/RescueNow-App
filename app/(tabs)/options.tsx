import { useActiveTheme } from "@/hooks/use-active-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { BrandLogo } from "@/components/brand/brand-logo";
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
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { firebaseAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function OptionsScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  
  const [language, setLanguage] = useState<AppLanguage>(DEFAULT_APP_PREFERENCES.language);
  const [themeMode, setThemeMode] = useState<ThemeMode>(DEFAULT_APP_PREFERENCES.themeMode);
  
  const [trustedContactPhone, setTrustedContactPhone] = useState(DEFAULT_APP_PREFERENCES.trustedContactPhone);
  const [trustedContactName, setTrustedContactName] = useState(DEFAULT_APP_PREFERENCES.trustedContactName);
  const [useTrustedContact, setUseTrustedContact] = useState(DEFAULT_APP_PREFERENCES.useTrustedContact);
  
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(DEFAULT_APP_PREFERENCES.subscriptionPlan);
  const [accountRole, setAccountRole] = useState<AccountRole>(DEFAULT_APP_PREFERENCES.accountRole);

  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(12), []);
  
  // Premium Starburst / Radar Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoadingPrefs(true);
      const preferences = await getAppPreferences();
      setLanguage(preferences.language);
      setThemeMode(preferences.themeMode);
      setTrustedContactPhone(preferences.trustedContactPhone);
      setTrustedContactName(preferences.trustedContactName);
      setUseTrustedContact(preferences.useTrustedContact);
      setSubscriptionPlan(preferences.subscriptionPlan);
      setAccountRole(preferences.accountRole);
      setIsLoadingPrefs(false);
    };
    void loadPreferences();
  }, []);

  useEffect(() => {
    if (subscriptionPlan === "premium" && !reduceMotionEnabled) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.25, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
          ]),
          Animated.timing(rotateAnim, { toValue: 1, duration: 10000, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [subscriptionPlan, reduceMotionEnabled, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

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
    const nextPrefs = await updateAppPreferences({ trustedContactPhone, trustedContactName, useTrustedContact });
    setTrustedContactPhone(nextPrefs.trustedContactPhone);
    setTrustedContactName(nextPrefs.trustedContactName);
    setUseTrustedContact(nextPrefs.useTrustedContact);
    setIsSavingContact(false);
  };

  const handleTogglePlan = async () => {
    if (isSavingPlan) return;
    setIsSavingPlan(true);
    const nextPlan = subscriptionPlan === "premium" ? "free" : "premium";
    const nextPrefs = await updateAppPreferences({ subscriptionPlan: nextPlan });
    setSubscriptionPlan(nextPrefs.subscriptionPlan);
    setIsSavingPlan(false);
  };

  useEffect(() => {
    if (reduceMotionEnabled) {
      entranceOpacity.setValue(1);
      entranceTranslateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(entranceOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(entranceTranslateY, { toValue: 0, duration: 340, useNativeDriver: true }),
    ]).start();
  }, [entranceOpacity, entranceTranslateY, reduceMotionEnabled]);

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      await updateAppPreferences({ trustedContactPhone: "", useTrustedContact: false, subscriptionPlan: "free", accountRole: "user" });
    } finally {
      router.replace("/(auth)/login");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mi Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: entranceOpacity, transform: [{ translateY: entranceTranslateY }] }}>
          
          {/* 1. SECCIÓN DE PERFIL CENTRADO (Google Style) */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              {subscriptionPlan === "premium" && (
                <>
                  <Animated.View style={[
                    styles.premiumPulseRing,
                    { 
                      backgroundColor: colors.accent,
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({ inputRange: [1, 1.25], outputRange: [0.4, 0] })
                    }
                  ]} />
                  <Animated.View style={[
                    styles.premiumMultiColorRing,
                    { transform: [{ rotate: spin }] }
                  ]} />
                </>
              )}
              <View style={[styles.avatarInner, { backgroundColor: colors.mapBackground }]}>
                 <BrandLogo width={56} height={56} />
              </View>
            </View>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>Andrés Garza</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>demo@rescuenow.app</Text>
            
            <View style={[styles.profileBadge, { backgroundColor: subscriptionPlan === "premium" ? colors.accent : colors.mapBackground }]}>
               <Text style={[styles.profileBadgeText, { color: subscriptionPlan === "premium" ? "#000" : colors.textPrimary }]}>
                 {subscriptionPlan === "premium" ? "🌟 Miembro Premium" : "🌟 Usuario Estándar"}
               </Text>
            </View>
            
            <Pressable 
              style={styles.editProfileBtn}
              onPress={() => router.push("/(tabs)/edit-profile")}
            >
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Editar Perfil</Text>
            </Pressable>
          </View>

          {/* 2. SECCIÓN VIP / SUSCRIPCIÓN */}
          <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
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
                onPress={handleTogglePlan}
                style={[styles.upgradeBtn, { backgroundColor: subscriptionPlan === "premium" ? colors.mapBackground : colors.primary }]}
              >
                <Text style={{ color: subscriptionPlan === "premium" ? colors.textPrimary : '#fff', fontWeight: '800' }}>
                  {subscriptionPlan === "premium" ? "Bajar a Gratis" : "Actualizar a Premium"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 3. SECCIÓN DE AJUSTES GLOBALES */}
          <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Ajustes Generales</Text>
            </View>
            
            {/* TEMA */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Apariencia</Text>
              <View style={styles.pillsRow}>
                <Pressable onPress={() => handleThemeChange("light")} style={[styles.pillBtn, themeMode === "light" && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={[styles.pillText, themeMode === "light" ? { color: "#fff" } : { color: colors.textSecondary }]}>Claro</Text>
                </Pressable>
                <Pressable onPress={() => handleThemeChange("dark")} style={[styles.pillBtn, themeMode === "dark" && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={[styles.pillText, themeMode === "dark" ? { color: "#fff" } : { color: colors.textSecondary }]}>Oscuro</Text>
                </Pressable>
                <Pressable onPress={() => handleThemeChange("time")} style={[styles.pillBtn, themeMode === "time" && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={[styles.pillText, themeMode === "time" ? { color: "#fff" } : { color: colors.textSecondary }]}>Auto</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 4. SECCIÓN CONTACTO DE CONFIANZA */}
          <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Contacto de Emergencia</Text>
            </View>
            <View style={styles.settingRowStack}>
                <Text style={{fontSize: 12, fontWeight: '700', marginBottom: 6, color: colors.textSecondary}}>Nombre del Familiar:</Text>
               <TextInput
                  value={trustedContactName}
                  onChangeText={setTrustedContactName}
                  placeholder="Ej: Mamá, Papá..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.phoneInput, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.mapBackground, marginBottom: 12 }]}
                />
                
                <Text style={{fontSize: 12, fontWeight: '700', marginBottom: 6, color: colors.textSecondary}}>Número de Teléfono:</Text>
               <TextInput
                  value={trustedContactPhone}
                  onChangeText={setTrustedContactPhone}
                  keyboardType="phone-pad"
                  placeholder="Ej: +52 55 1234 5678"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.phoneInput, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.mapBackground }]}
                />
                <View style={[styles.switchRow, { marginTop: 12 }]}>
                  <Text style={[styles.settingLabel, { flex: 1, color: colors.textPrimary }]}>Alertar automáticamente en S.O.S.</Text>
                  <Switch value={useTrustedContact} onValueChange={setUseTrustedContact} trackColor={{ false: colors.cardBorder, true: colors.primary }} thumbColor="#FFFFFF" />
                </View>
                <Pressable onPress={handleSaveContact} style={[styles.upgradeBtn, { backgroundColor: colors.cardBorder, marginTop: 16 }]}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{isSavingContact ? "Guardando..." : "Guardar Contacto"}</Text>
                </Pressable>
            </View>
          </View>

          {/* 5. CERRAR SESIÓN */}
          <Pressable onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: colors.danger }]}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </Pressable>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: "900" },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  premiumPulseRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45 },
  premiumMultiColorRing: { 
    position: 'absolute', 
    width: 106, 
    height: 106, 
    borderRadius: 53, 
    borderWidth: 3.5, 
    borderTopColor: '#FF1E47', 
    borderRightColor: '#FFB800', 
    borderBottomColor: '#3B82F6', 
    borderLeftColor: '#8B5CF6' 
  },
  avatarInner: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, zIndex: 10 },
  profileName: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  profileEmail: { fontSize: 13, marginBottom: 12 },
  profileBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
  profileBadgeText: { fontSize: 11, fontWeight: '800' },
  editProfileBtn: { paddingVertical: 6, paddingHorizontal: 16 },
  cardGroup: { borderWidth: 1, borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  cardTitle: { fontSize: 16, fontWeight: '800', marginLeft: 8 },
  planContent: { padding: 16 },
  planSub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  upgradeBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  settingRowStack: { paddingHorizontal: 16, paddingVertical: 16 },
  settingLabel: { fontSize: 14, fontWeight: '700' },
  pillsRow: { flexDirection: 'row', gap: 6 },
  pillBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  pillText: { fontSize: 12, fontWeight: '800' },
  phoneInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  logoutButton: { marginTop: 10, borderRadius: 16, minHeight: 52, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "800" }
});
