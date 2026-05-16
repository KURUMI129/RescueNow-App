import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useUserLocation } from "@/hooks/use-user-location";
import { useAuth } from "@/lib/auth-context";
import {
  getAppPreferences,
  updateAppPreferences,
  formatPhoneNumber,
} from "@/constants/app-preferences";
import {
  buildTravelArrivalMessage,
  buildTravelStartMessage,
  sendTravelMessage,
} from "@/lib/travel-mode-service";

type Duration = 1 | 2 | 4 | 8;
const DURATION_OPTIONS: Duration[] = [1, 2, 4, 8];

export default function TravelModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const language = useAppLanguage();
  const { location } = useUserLocation();
  const { user } = useAuth();

  // ====== State ======
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState<Duration>(2);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [destination, setDestination] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCountryCode, setContactCountryCode] = useState("+52");
  const [elapsed, setElapsed] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [lastMessageStatus, setLastMessageStatus] = useState<
    "idle" | "sent" | "no_contact" | "failed"
  >("idle");

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ====== Load prefs on focus ======
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const prefs = await getAppPreferences();
        setPlan(prefs.subscriptionPlan);
        setIsActive(prefs.travelModeActive);
        setStartTime(prefs.travelModeStartTime);
        setDuration(prefs.travelModeDurationHours);
        setDestination(prefs.travelModeDestination);
        setContactName(prefs.trustedContactName);
        setContactPhone(prefs.trustedContactPhone);
        setContactCountryCode(prefs.trustedContactCountryCode);
      })();
    }, []),
  );

  // ====== Elapsed timer ======
  useEffect(() => {
    if (!isActive || !startTime) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      setElapsed(0);
      return;
    }

    const update = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    };
    update();
    tickRef.current = setInterval(update, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [isActive, startTime]);

  // ====== i18n ======
  const t = language === "es"
    ? {
        title: "Modo Viaje",
        subtitle: "Comparte tu viaje con tu contacto de confianza",
        howItWorks: "Cómo funciona",
        step1: "Tu contacto recibe un mensaje al iniciar con tu ubicación de partida.",
        step2: "Al llegar, presionas \"Finalicé el viaje\" y tu contacto recibe confirmación.",
        step3: "Si excedes el tiempo estimado, te avisamos para que confirmes.",
        durationLabel: "Duración estimada del viaje",
        destinationLabel: "Destino (opcional)",
        destinationPlaceholder: "Ej: Casa, oficina, Cabo",
        startBtn: "Iniciar Viaje Seguro",
        stopBtn: "Finalicé el viaje",
        elapsed: "Tiempo transcurrido",
        of: "de",
        sentOK: "Mensaje enviado a tu contacto",
        noContact: "Configura un contacto de confianza en Opciones",
        failed: "No se pudo enviar el mensaje",
        contactLabel: "Avisa a",
        premiumOnly: "Modo Viaje es una función Premium",
        premiumDesc: "Activa Premium para compartir tu viaje en tiempo real con un contacto de confianza.",
        goPremium: "Conoce Premium",
        back: "Atrás",
        starting: "Iniciando...",
        stopping: "Finalizando...",
        hours: "h",
      }
    : {
        title: "Travel Mode",
        subtitle: "Share your trip with your trusted contact",
        howItWorks: "How it works",
        step1: "Your contact gets a message at the start with your departure location.",
        step2: "When you arrive, tap \"Trip ended\" and your contact gets a confirmation.",
        step3: "If you exceed the expected time, we notify you so you can confirm.",
        durationLabel: "Estimated trip duration",
        destinationLabel: "Destination (optional)",
        destinationPlaceholder: "e.g.: Home, office, Cabo",
        startBtn: "Start Safe Trip",
        stopBtn: "Trip ended",
        elapsed: "Elapsed time",
        of: "of",
        sentOK: "Message sent to your contact",
        noContact: "Set up a trusted contact in Options",
        failed: "Could not send the message",
        contactLabel: "Notifies",
        premiumOnly: "Travel Mode is a Premium feature",
        premiumDesc: "Activate Premium to share your trip in real-time with a trusted contact.",
        goPremium: "Learn about Premium",
        back: "Back",
        starting: "Starting...",
        stopping: "Ending...",
        hours: "h",
      };

  // ====== Helpers ======
  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const hasContact = contactPhone.replace(/\D/g, "").length >= 7;
  const userName = user?.displayName ?? "Paciente";

  // ====== Actions ======
  const handleStart = async () => {
    if (isSending) return;
    if (!hasContact) {
      setLastMessageStatus("no_contact");
      return;
    }
    if (!location) {
      console.warn("[TravelMode] No location yet, cannot start");
      return;
    }

    setIsSending(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const now = Date.now();
    await updateAppPreferences({
      travelModeActive: true,
      travelModeStartTime: now,
      travelModeDurationHours: duration,
      travelModeDestination: destination.trim(),
    });
    setStartTime(now);
    setIsActive(true);

    const message = buildTravelStartMessage(
      userName,
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      destination,
      duration,
      language,
    );

    const result = await sendTravelMessage(contactPhone, message, contactCountryCode);
    setLastMessageStatus(result.success ? "sent" : "failed");
    setIsSending(false);
  };

  const handleStop = async () => {
    if (isSending) return;
    setIsSending(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await updateAppPreferences({
      travelModeActive: false,
      travelModeStartTime: null,
    });
    setIsActive(false);
    setStartTime(null);

    if (hasContact && location) {
      const message = buildTravelArrivalMessage(
        userName,
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        language,
      );
      const result = await sendTravelMessage(contactPhone, message, contactCountryCode);
      setLastMessageStatus(result.success ? "sent" : "failed");
    }

    setIsSending(false);
  };

  // ====== Premium gate ======
  if (plan !== "premium") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            <Text style={[styles.backText, { color: colors.textPrimary }]}>{t.back}</Text>
          </Pressable>
        </View>

        <View style={styles.gateBox}>
          <Animated.View entering={FadeInUp.springify()} style={[styles.gateCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={[styles.gateIconWrap, { backgroundColor: colors.accent + "20" }]}>
              <MaterialCommunityIcons name="map-marker-path" size={48} color={colors.accent} />
            </View>
            <Text style={[styles.gateTitle, { color: colors.textPrimary }]}>{t.premiumOnly}</Text>
            <Text style={[styles.gateDesc, { color: colors.textSecondary }]}>{t.premiumDesc}</Text>
            <Pressable
              onPress={() => router.push("/premium")}
              style={[styles.goPremiumBtn, { backgroundColor: colors.accent }]}
              accessibilityRole="button"
            >
              <Ionicons name="star" size={18} color="#FFFFFF" />
              <Text style={styles.goPremiumText}>{t.goPremium}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>{t.back}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accent + "20" }]}>
            <MaterialCommunityIcons name="map-marker-path" size={40} color={colors.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{t.title}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </Animated.View>

        {/* How it works */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.howItWorks}</Text>
          {[t.step1, t.step2, t.step3].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Contact info */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.contactLabel}</Text>
          {hasContact ? (
            <View style={styles.contactRow}>
              <Ionicons name="person-circle" size={32} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {contactName || "Contacto"}
                </Text>
                <Text style={[styles.contactPhone, { color: colors.textSecondary }]} numberOfLines={1}>
                  {formatPhoneNumber(contactCountryCode, contactPhone)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.warnRow}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <Text style={[styles.warnText, { color: colors.danger }]}>{t.noContact}</Text>
            </View>
          )}
        </Animated.View>

        {/* INACTIVE — config form */}
        {!isActive && (
          <>
            <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.durationLabel}</Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((h) => {
                  const selected = duration === h;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => setDuration(h)}
                      style={[
                        styles.durationBtn,
                        {
                          backgroundColor: selected ? colors.accent : "transparent",
                          borderColor: selected ? colors.accent : colors.cardBorder,
                        },
                      ]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.durationText, { color: selected ? "#FFFFFF" : colors.textPrimary }]}>
                        {h}{t.hours}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.destinationLabel}</Text>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder={t.destinationPlaceholder}
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}
                maxLength={80}
              />
            </Animated.View>

            <Pressable
              onPress={handleStart}
              disabled={!hasContact || isSending}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: hasContact ? colors.accent : colors.cardBorder,
                  opacity: hasContact && !isSending ? 1 : 0.6,
                },
              ]}
              accessibilityRole="button"
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>{isSending ? t.starting : t.startBtn}</Text>
            </Pressable>
          </>
        )}

        {/* ACTIVE — countdown */}
        {isActive && (
          <Animated.View entering={FadeInUp.springify()} style={[styles.activeCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.activeLabel, { color: colors.textSecondary }]}>{t.elapsed}</Text>
            <Text style={[styles.activeTime, { color: colors.textPrimary }]}>
              {formatElapsed(elapsed)}
            </Text>
            <Text style={[styles.activeSubtitle, { color: colors.textSecondary }]}>
              {t.of} {duration}h
            </Text>

            <Pressable
              onPress={handleStop}
              disabled={isSending}
              style={[styles.actionBtn, { backgroundColor: colors.danger, marginTop: 24, opacity: isSending ? 0.6 : 1 }]}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>{isSending ? t.stopping : t.stopBtn}</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Last message status */}
        {lastMessageStatus !== "idle" && (
          <View
            style={[
              styles.statusBox,
              {
                backgroundColor:
                  lastMessageStatus === "sent"
                    ? colors.success + "20"
                    : colors.danger + "20",
                borderColor:
                  lastMessageStatus === "sent" ? colors.success : colors.danger,
              },
            ]}
          >
            <Ionicons
              name={lastMessageStatus === "sent" ? "checkmark-circle" : "alert-circle"}
              size={18}
              color={lastMessageStatus === "sent" ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: lastMessageStatus === "sent" ? colors.success : colors.danger,
                },
              ]}
            >
              {lastMessageStatus === "sent"
                ? t.sentOK
                : lastMessageStatus === "no_contact"
                ? t.noContact
                : t.failed}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8 },
  backText: { fontSize: 15, fontWeight: "600" },
  scroll: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: 16 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  heroTitle: { fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
  card: {
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12 },
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 10, alignItems: "flex-start" },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginTop: 1,
  },
  stepNumberText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18 },
  contactRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  contactName: { fontSize: 15, fontWeight: "700" },
  contactPhone: { fontSize: 13, marginTop: 2 },
  warnRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  warnText: { fontSize: 13, fontWeight: "600", flex: 1 },
  durationRow: { flexDirection: "row", gap: 8 },
  durationBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5,
    alignItems: "center",
  },
  durationText: { fontSize: 15, fontWeight: "800" },
  input: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontWeight: "500",
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 16, borderRadius: 14, marginTop: 8,
  },
  actionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  activeCard: {
    padding: 24, borderRadius: 16, borderWidth: 2, alignItems: "center", marginBottom: 12,
  },
  liveDot: {
    width: 10, height: 10, borderRadius: 5, marginBottom: 8,
  },
  activeLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  activeTime: { fontSize: 42, fontWeight: "900", marginVertical: 4 },
  activeSubtitle: { fontSize: 13, fontWeight: "600" },
  statusBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 8,
  },
  statusText: { fontSize: 13, fontWeight: "600", flex: 1 },
  gateBox: { flex: 1, padding: 24, justifyContent: "center" },
  gateCard: {
    padding: 28, borderRadius: 20, borderWidth: 1, alignItems: "center",
  },
  gateIconWrap: {
    width: 84, height: 84, borderRadius: 42,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  gateTitle: { fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: 8 },
  gateDesc: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  goPremiumBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  goPremiumText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
