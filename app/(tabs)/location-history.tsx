import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Header } from "@/components/ui/Header";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";
import { getAppPreferences, type SubscriptionPlan } from "@/constants/app-preferences";

const LOCATION_HISTORY_KEY = "@rescuenow_location_history_v1";

export type LocationType = "sos" | "crash" | "checkin";

export interface LocationEntry {
  id: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  timestamp: string;
}

const TYPE_CONFIG: Record<LocationType, { icon: string; color: string; label: string }> = {
  sos: { icon: "warning", color: "#EF4444", label: "SOS" },
  crash: { icon: "car", color: "#EAB308", label: "Choque" },
  checkin: { icon: "shield-checkmark", color: "#22C55E", label: "Check-in" },
};

export default function LocationHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<LocationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];

  // Sub-screens are registered as hidden tabs (href: null), so router.back()
  // pops to the previously focused tab — which is always "index" (home), not
  // Options. Explicitly route to Options to keep the user in their flow.
  const handleBack = useCallback(() => {
    router.replace("/(tabs)/options");
  }, [router]);

  useEffect(() => {
    loadHistory();
    void getAppPreferences().then((prefs) => setPlan(prefs.subscriptionPlan));
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading location history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: { item: LocationEntry }) => {
    const config = TYPE_CONFIG[item.type];
    return (
      <Card style={[styles.card, { borderColor: tokens.colors.border }]}>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
            <MaterialCommunityIcons name={item.type === "checkin" ? "shield-check" : (item.type === "crash" ? "car" : "alert-circle") as any} size={24} color={config.color} />
          </View>
          <View style={styles.details}>
            <View style={styles.headerRow}>
              <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
              <Text style={[styles.timestamp, { color: tokens.colors.textMuted }]}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
            <Text style={[styles.coordinates, { color: tokens.colors.textSecondary }]}>
              {formatCoordinates(item.latitude, item.longitude)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Historial de Ubicaciones" showBack onBack={handleBack} />
        <EmptyState type="loading" title="Cargando historial..." />
      </View>
    );
  }

  if (plan !== "premium") {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <Header title="Historial de Ubicaciones" showBack onBack={handleBack} />
        <View style={styles.gateBox}>
          <View style={[styles.gateIconWrap, { backgroundColor: tokens.colors.warning + "20" }]}>
            <MaterialCommunityIcons name="map-marker-path" size={48} color={tokens.colors.warning} />
          </View>
          <Text style={[styles.gateTitle, { color: tokens.colors.textPrimary }]}>Función Premium</Text>
          <Text style={[styles.gateDesc, { color: tokens.colors.textSecondary }]}>
            El historial de ubicaciones detallado está disponible para miembros Premium.
          </Text>
          <Pressable
            onPress={() => router.push("/premium")}
            style={[styles.goPremiumBtn, { backgroundColor: tokens.colors.warning }]}
          >
            <Ionicons name="star" size={18} color="#FFFFFF" />
            <Text style={styles.goPremiumText}>Ir a Premium</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Historial de Ubicaciones" showBack onBack={handleBack} />
        <EmptyState
          type="empty"
          title="Sin historial"
          subtitle="Aún no hay ubicaciones guardadas"
          icon="location-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Historial de Ubicaciones" showBack onBack={handleBack} />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  timestamp: {
    fontSize: 12,
  },
  coordinates: {
    fontSize: 13,
  },
  gateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  gateIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  gateDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  goPremiumBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  goPremiumText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
});