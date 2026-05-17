import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import {
  getAppPreferences,
  Incident,
  SubscriptionPlan,
} from "@/constants/app-preferences";

const FREE_LIMIT = 5;

export default function IncidentHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const language = useAppLanguage();

  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const prefs = await getAppPreferences();
        setPlan(prefs.subscriptionPlan);
        setIncidents(prefs.incidents);
      })();
    }, []),
  );

  const t = language === "es"
    ? {
        title: "Historial de Emergencias",
        empty: "Sin emergencias registradas",
        emptySub: "Aquí verás todas las veces que activaste el SOS o el sistema detectó un accidente.",
        manual: "SOS Manual",
        crash: "Detección Automática",
        back: "Atrás",
        statsTotal: "Total",
        statsManual: "Manuales",
        statsCrash: "Automáticos",
        statsLast7: "Últimos 7 días",
        showingFree: `Estás viendo las últimas ${FREE_LIMIT} emergencias.`,
        upgradeNote: "Activa Premium para ver todo el historial y estadísticas.",
        goPremium: "Conoce Premium",
        viewOnMap: "Ver en mapa",
        whatsappSent: "WhatsApp enviado",
        smsSent: "SMS enviado",
        sendFailed: "Envío fallido",
        noContact: "Sin contacto",
      }
    : {
        title: "Emergency History",
        empty: "No emergencies recorded",
        emptySub: "You will see here every time you triggered SOS or crash detection.",
        manual: "Manual SOS",
        crash: "Auto Detection",
        back: "Back",
        statsTotal: "Total",
        statsManual: "Manual",
        statsCrash: "Automatic",
        statsLast7: "Last 7 days",
        showingFree: `You're seeing the latest ${FREE_LIMIT} emergencies.`,
        upgradeNote: "Activate Premium to see full history and statistics.",
        goPremium: "Learn about Premium",
        viewOnMap: "View on map",
        whatsappSent: "WhatsApp sent",
        smsSent: "SMS sent",
        sendFailed: "Send failed",
        noContact: "No contact",
      };

  // Stats only for premium
  const stats = useMemo(() => {
    if (incidents.length === 0) {
      return { total: 0, manual: 0, crash: 0, last7Days: 0 };
    }
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: incidents.length,
      manual: incidents.filter((i) => i.type === "manual").length,
      crash: incidents.filter((i) => i.type === "crash_detection").length,
      last7Days: incidents.filter((i) => i.timestamp >= sevenDaysAgo).length,
    };
  }, [incidents]);

  const visibleIncidents = useMemo(
    () => (plan === "premium" ? incidents : incidents.slice(0, FREE_LIMIT)),
    [plan, incidents],
  );

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(language === "es" ? "es-MX" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const messageMethodLabel = (m: Incident["messageMethod"]) => {
    switch (m) {
      case "whatsapp":
        return t.whatsappSent;
      case "sms":
        return t.smsSent;
      case "failed":
        return t.sendFailed;
      case "no_contact":
      default:
        return t.noContact;
    }
  };

  const messageMethodColor = (m: Incident["messageMethod"]) => {
    switch (m) {
      case "whatsapp":
      case "sms":
        return colors.success;
      case "failed":
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const openInMaps = (lat: number, lon: number) => {
    void Linking.openURL(`https://maps.google.com/?q=${lat},${lon}`);
  };

  const renderIncident = ({ item, index }: { item: Incident; index: number }) => {
    const isCrash = item.type === "crash_detection";
    return (
      <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: (isCrash ? colors.danger : colors.primary) + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name={isCrash ? "car-emergency" : "alert-circle"}
                size={20}
                color={isCrash ? colors.danger : colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.typeText, { color: colors.textPrimary }]}>
                {isCrash ? t.crash : t.manual}
              </Text>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
            <View
              style={[
                styles.methodBadge,
                { backgroundColor: messageMethodColor(item.messageMethod) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.methodText,
                  { color: messageMethodColor(item.messageMethod) },
                ]}
                numberOfLines={1}
              >
                {messageMethodLabel(item.messageMethod)}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => openInMaps(item.location.latitude, item.location.longitude)}
            style={[styles.mapBtn, { backgroundColor: colors.mapBackground }]}
            accessibilityRole="button"
          >
            <Ionicons name="location" size={16} color={colors.accent} />
            <Text style={[styles.mapBtnText, { color: colors.accent }]}>
              {t.viewOnMap} ({item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)})
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const isEmpty = incidents.length === 0;
  const hasMoreThanFreeShows = plan === "free" && incidents.length > FREE_LIMIT;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.replace("/(tabs)/options")}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>{t.back}</Text>
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.title}</Text>
      </View>

      {/* PREMIUM stats */}
      {plan === "premium" && !isEmpty && (
        <Animated.View entering={FadeInDown.springify()} style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.statsTotal.toUpperCase()}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.manual}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.statsManual.toUpperCase()}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.crash}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.statsCrash.toUpperCase()}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stats.last7Days}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.statsLast7.toUpperCase()}</Text>
          </View>
        </Animated.View>
      )}

      {isEmpty ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>{t.empty}</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t.emptySub}</Text>
        </View>
      ) : (
        <FlatList
          data={visibleIncidents}
          renderItem={renderIncident}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            hasMoreThanFreeShows ? (
              <View style={[styles.upgradeBox, { backgroundColor: colors.accent + "10", borderColor: colors.accent }]}>
                <Ionicons name="lock-closed" size={20} color={colors.accent} />
                <Text style={[styles.upgradeTitle, { color: colors.textPrimary }]}>
                  {t.showingFree}
                </Text>
                <Text style={[styles.upgradeDesc, { color: colors.textSecondary }]}>
                  {t.upgradeNote}
                </Text>
                <Pressable
                  onPress={() => router.push("/premium")}
                  style={[styles.upgradeBtn, { backgroundColor: colors.accent }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="star" size={16} color="#FFFFFF" />
                  <Text style={styles.upgradeBtnText}>{t.goPremium}</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8 },
  backText: { fontSize: 15, fontWeight: "600" },
  titleRow: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "900" },
  statsGrid: {
    flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16, flexWrap: "wrap",
  },
  statCard: {
    flex: 1, minWidth: "22%", padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "900" },
  statLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5, marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  typeIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  typeText: { fontSize: 14, fontWeight: "800" },
  dateText: { fontSize: 12, marginTop: 2 },
  methodBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: 110,
  },
  methodText: { fontSize: 10, fontWeight: "800" },
  mapBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    padding: 10, borderRadius: 8, marginTop: 10,
  },
  mapBtnText: { fontSize: 12, fontWeight: "600", flex: 1 },
  emptyBox: {
    flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingBottom: 60,
  },
  emptyText: { fontSize: 18, fontWeight: "800", marginTop: 16 },
  emptySub: { fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 18 },
  upgradeBox: {
    padding: 18, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 8, marginTop: 8,
  },
  upgradeTitle: { fontSize: 14, fontWeight: "800", textAlign: "center" },
  upgradeDesc: { fontSize: 12, textAlign: "center", lineHeight: 16 },
  upgradeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 4,
  },
  upgradeBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
