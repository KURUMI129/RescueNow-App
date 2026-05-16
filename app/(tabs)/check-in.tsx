import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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
import { useAuth } from "@/lib/auth-context";
import {
  getAppPreferences,
  updateAppPreferences,
  formatPhoneNumber,
} from "@/constants/app-preferences";
import {
  cancelCheckInNotification,
  computeNextStreak,
  scheduleDailyCheckInNotification,
  sendCheckInToContact,
} from "@/lib/check-in-service";

const HOUR_PRESETS: { hour: number; minute: number; labelEs: string; labelEn: string }[] = [
  { hour: 8, minute: 0, labelEs: "8:00 AM", labelEn: "8:00 AM" },
  { hour: 9, minute: 0, labelEs: "9:00 AM", labelEn: "9:00 AM" },
  { hour: 12, minute: 0, labelEs: "12:00 PM", labelEn: "12:00 PM" },
  { hour: 20, minute: 0, labelEs: "8:00 PM", labelEn: "8:00 PM" },
];

export default function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const language = useAppLanguage();
  const { user } = useAuth();

  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [enabled, setEnabled] = useState(false);
  const [scheduleHour, setScheduleHour] = useState(9);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const [lastCheckInTime, setLastCheckInTime] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCountryCode, setContactCountryCode] = useState("+52");
  const [isToggling, setIsToggling] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "ok" | "fail" | "no_contact">("idle");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const prefs = await getAppPreferences();
        setPlan(prefs.subscriptionPlan);
        setEnabled(prefs.checkInEnabled);
        setScheduleHour(prefs.checkInScheduleHour);
        setScheduleMinute(prefs.checkInScheduleMinute);
        setLastCheckInTime(prefs.lastCheckInTime);
        setStreak(prefs.checkInStreak);
        setContactName(prefs.trustedContactName);
        setContactPhone(prefs.trustedContactPhone);
        setContactCountryCode(prefs.trustedContactCountryCode);
      })();
    }, []),
  );

  const t = language === "es"
    ? {
        title: "Check-in Diario",
        subtitle: "Confirma que estás bien y mantén tranquilo a tu contacto",
        howItWorks: "Cómo funciona",
        step1: "Recibes una notificación a la hora que elijas.",
        step2: "Toca \"Estoy bien\" para confirmar tu seguridad.",
        step3: "Tu contacto recibe un mensaje automático con tu racha.",
        toggleLabel: "Check-in Diario Activado",
        toggleDesc: "Programa una notificación recurrente cada día a la hora elegida.",
        scheduleLabel: "Hora del recordatorio",
        confirmBtn: "Estoy bien",
        confirmingBtn: "Enviando...",
        alreadyCheckedIn: "Ya hiciste check-in hoy",
        contactLabel: "Avisa a",
        noContact: "Configura un contacto de confianza en Opciones",
        streakLabel: "Racha actual",
        days: "días",
        day: "día",
        sentOK: "Mensaje enviado a tu contacto",
        sentFail: "No se pudo enviar el mensaje",
        lastCheckIn: "Último check-in",
        never: "Nunca",
        premiumOnly: "Check-in Diario es una función Premium",
        premiumDesc: "Activa Premium para que tu contacto reciba confirmaciones diarias automáticas de tu seguridad.",
        goPremium: "Conoce Premium",
        back: "Atrás",
      }
    : {
        title: "Daily Check-in",
        subtitle: "Confirm you're safe and keep your contact at ease",
        howItWorks: "How it works",
        step1: "You get a notification at the time you choose.",
        step2: "Tap \"I'm fine\" to confirm your safety.",
        step3: "Your contact gets an automatic message with your streak.",
        toggleLabel: "Daily Check-in Enabled",
        toggleDesc: "Schedules a recurring notification every day at the chosen time.",
        scheduleLabel: "Reminder time",
        confirmBtn: "I'm fine",
        confirmingBtn: "Sending...",
        alreadyCheckedIn: "You already checked in today",
        contactLabel: "Notifies",
        noContact: "Set up a trusted contact in Options",
        streakLabel: "Current streak",
        days: "days",
        day: "day",
        sentOK: "Message sent to your contact",
        sentFail: "Could not send the message",
        lastCheckIn: "Last check-in",
        never: "Never",
        premiumOnly: "Daily Check-in is a Premium feature",
        premiumDesc: "Activate Premium so your contact gets daily automatic safety confirmations.",
        goPremium: "Learn about Premium",
        back: "Back",
      };

  const hasContact = contactPhone.replace(/\D/g, "").length >= 7;
  const userName = user?.displayName ?? "Paciente";

  const isSameDay = (a: number, b: number) => {
    const da = new Date(a);
    const db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };

  const alreadyToday =
    lastCheckInTime !== null && isSameDay(lastCheckInTime, Date.now());

  const handleToggle = async (next: boolean) => {
    if (isToggling) return;
    setIsToggling(true);
    setEnabled(next);

    if (next) {
      const ok = await scheduleDailyCheckInNotification(
        scheduleHour,
        scheduleMinute,
        language,
      );
      if (!ok) {
        setEnabled(false);
        setIsToggling(false);
        return;
      }
    } else {
      await cancelCheckInNotification();
    }

    await updateAppPreferences({ checkInEnabled: next });
    setIsToggling(false);
  };

  const handleScheduleChange = async (hour: number, minute: number) => {
    setScheduleHour(hour);
    setScheduleMinute(minute);
    await updateAppPreferences({
      checkInScheduleHour: hour,
      checkInScheduleMinute: minute,
    });
    if (enabled) {
      await scheduleDailyCheckInNotification(hour, minute, language);
    }
  };

  const handleCheckIn = async () => {
    if (isCheckingIn) return;
    setIsCheckingIn(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = Date.now();
    const nextStreak = computeNextStreak(lastCheckInTime, streak, now);
    setLastCheckInTime(now);
    setStreak(nextStreak);

    await updateAppPreferences({
      lastCheckInTime: now,
      checkInStreak: nextStreak,
    });

    if (hasContact) {
      const result = await sendCheckInToContact(
        contactPhone,
        contactCountryCode,
        userName,
        nextStreak,
        language,
      );
      setFeedback(result.success ? "ok" : "fail");
    } else {
      setFeedback("no_contact");
    }

    setIsCheckingIn(false);
  };

  const formatLastCheckIn = (ts: number | null) => {
    if (!ts) return t.never;
    const date = new Date(ts);
    return date.toLocaleString(language === "es" ? "es-MX" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const streakText = streak === 1 ? t.day : t.days;

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
            <View style={[styles.gateIconWrap, { backgroundColor: colors.success + "20" }]}>
              <MaterialCommunityIcons name="shield-check" size={48} color={colors.success} />
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
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>{t.back}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.success + "20" }]}>
            <MaterialCommunityIcons name="shield-check" size={40} color={colors.success} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{t.title}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </Animated.View>

        {/* Streak + last check-in */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Ionicons name="flame" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {streakText.toUpperCase()} {language === "es" ? "RACHA" : "STREAK"}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Ionicons name="time" size={20} color={colors.accent} />
            <Text style={[styles.statValueSmall, { color: colors.textPrimary }]} numberOfLines={1}>
              {formatLastCheckIn(lastCheckInTime)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t.lastCheckIn.toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        {/* How it works */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.howItWorks}</Text>
          {[t.step1, t.step2, t.step3].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.success }]}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Toggle */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 4 }]}>{t.toggleLabel}</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>{t.toggleDesc}</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              disabled={isToggling}
              trackColor={{ false: colors.cardBorder, true: colors.success }}
              thumbColor={"#FFFFFF"}
            />
          </View>
        </Animated.View>

        {/* Schedule presets */}
        {enabled && (
          <Animated.View entering={FadeInDown.springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.scheduleLabel}</Text>
            <View style={styles.presetRow}>
              {HOUR_PRESETS.map(p => {
                const selected = p.hour === scheduleHour && p.minute === scheduleMinute;
                return (
                  <Pressable
                    key={`${p.hour}-${p.minute}`}
                    onPress={() => handleScheduleChange(p.hour, p.minute)}
                    style={[
                      styles.presetBtn,
                      {
                        backgroundColor: selected ? colors.accent : "transparent",
                        borderColor: selected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.presetText, { color: selected ? "#FFFFFF" : colors.textPrimary }]}>
                      {language === "es" ? p.labelEs : p.labelEn}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Contact info */}
        <Animated.View entering={FadeInDown.springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
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

        {/* Confirm now button */}
        <Pressable
          onPress={handleCheckIn}
          disabled={isCheckingIn || alreadyToday}
          style={[
            styles.confirmBtn,
            {
              backgroundColor: alreadyToday ? colors.cardBorder : colors.success,
              opacity: isCheckingIn || alreadyToday ? 0.6 : 1,
            },
          ]}
          accessibilityRole="button"
        >
          <Ionicons
            name={alreadyToday ? "checkmark-done-circle" : "checkmark-circle"}
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.confirmText}>
            {alreadyToday
              ? t.alreadyCheckedIn
              : isCheckingIn
              ? t.confirmingBtn
              : t.confirmBtn}
          </Text>
        </Pressable>

        {feedback !== "idle" && (
          <View
            style={[
              styles.statusBox,
              {
                backgroundColor:
                  feedback === "ok"
                    ? colors.success + "20"
                    : colors.danger + "20",
                borderColor: feedback === "ok" ? colors.success : colors.danger,
              },
            ]}
          >
            <Ionicons
              name={feedback === "ok" ? "checkmark-circle" : "alert-circle"}
              size={18}
              color={feedback === "ok" ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.statusText,
                { color: feedback === "ok" ? colors.success : colors.danger },
              ]}
            >
              {feedback === "ok"
                ? t.sentOK
                : feedback === "no_contact"
                ? t.noContact
                : t.sentFail}
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
  hero: { alignItems: "center", marginBottom: 12 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  heroTitle: { fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: 16 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, padding: 14, borderRadius: 14, borderWidth: 1,
    alignItems: "center", gap: 4,
  },
  statValue: { fontSize: 28, fontWeight: "900" },
  statValueSmall: { fontSize: 14, fontWeight: "800", marginTop: 4 },
  statLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
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
  toggleRow: { flexDirection: "row", alignItems: "center" },
  toggleDesc: { fontSize: 12, lineHeight: 16 },
  presetRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  presetBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
  },
  presetText: { fontSize: 13, fontWeight: "700" },
  contactRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  contactName: { fontSize: 15, fontWeight: "700" },
  contactPhone: { fontSize: 13, marginTop: 2 },
  warnRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  warnText: { fontSize: 13, fontWeight: "600", flex: 1 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 18, borderRadius: 14, marginTop: 4,
  },
  confirmText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  statusBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12,
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
