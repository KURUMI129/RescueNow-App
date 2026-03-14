import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo } from "react";
import {
    Animated,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    useWindowDimensions,
    View,
} from "react-native";

import { HOME_THEME_COLORS } from "@/constants/home-theme";

const TRACKING_STEPS = [
  { id: "1", label: "Solicitud recibida", done: true, time: "12:01" },
  { id: "2", label: "Tecnico asignado", done: true, time: "12:03" },
  { id: "3", label: "Tecnico en camino", done: true, time: "12:05" },
  { id: "4", label: "Llegada estimada", done: false, time: "12:13" },
];

export default function TrackingScreen() {
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const { width } = useWindowDimensions();
  const titleSize = Math.max(22, Math.min(28, width * 0.075));
  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(12), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslateY, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entranceOpacity, entranceTranslateY]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
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
          <Text style={[styles.topTitle, { color: colors.textSecondary }]}>
            Espejo de ruta
          </Text>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, fontSize: titleSize },
            ]}
          >
            Tu tecnico se acerca
          </Text>

          <View
            style={[
              styles.etaCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>
              ETA
            </Text>
            <Text style={[styles.etaValue, { color: colors.primary }]}>
              8 min
            </Text>
            <Text style={[styles.etaSub, { color: colors.textSecondary }]}>
              Distancia actual: 1.4 km
            </Text>
            <View
              style={[styles.liveBadge, { backgroundColor: colors.tracking }]}
            >
              <Text style={styles.liveBadgeText}>Seguimiento en vivo</Text>
            </View>
          </View>

          <View
            style={[
              styles.mapCard,
              {
                backgroundColor: colors.mapBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[styles.routeLine, { backgroundColor: colors.primary }]}
            />

            <View
              style={[
                styles.pinUser,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.userPin,
                },
              ]}
            >
              <Ionicons name="person" size={16} color={colors.userPin} />
            </View>

            <View
              style={[
                styles.pinTech,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.technicianPin,
                },
              ]}
            >
              <Ionicons
                name="construct"
                size={16}
                color={colors.technicianPin}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Estado del servicio
          </Text>

          <View
            style={[
              styles.jobCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.jobText, { color: colors.textPrimary }]}>
              Servicio: RN-1024
            </Text>
            <Text style={[styles.jobText, { color: colors.textPrimary }]}>
              Estado: En progreso
            </Text>
          </View>

          <View
            style={[
              styles.stepsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {TRACKING_STEPS.map((step) => (
              <View key={step.id} style={styles.stepRow}>
                <Ionicons
                  name={step.done ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={step.done ? colors.primary : colors.textSecondary}
                />
                <View style={styles.stepTextWrap}>
                  <Text
                    style={[styles.stepLabel, { color: colors.textPrimary }]}
                  >
                    {step.label}
                  </Text>
                  <Text
                    style={[styles.stepTime, { color: colors.textSecondary }]}
                  >
                    {step.time}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.progressWrap}>
              <Text
                style={[styles.progressLabel, { color: colors.textSecondary }]}
              >
                Diagnostico: 75%
              </Text>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.mapGrid },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.success },
                  ]}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  entranceLayer: {
    gap: 0,
  },
  topTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "900",
  },
  etaCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  etaLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  etaValue: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: "900",
  },
  etaSub: {
    marginTop: 4,
    fontSize: 12,
  },
  liveBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveBadgeText: {
    color: "#003A3D",
    fontSize: 11,
    fontWeight: "800",
  },
  mapCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 16,
    height: 180,
    position: "relative",
    overflow: "hidden",
  },
  routeLine: {
    position: "absolute",
    left: 58,
    right: 58,
    top: 92,
    height: 4,
    borderRadius: 999,
    opacity: 0.75,
  },
  pinUser: {
    position: "absolute",
    right: 34,
    top: 78,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pinTech: {
    position: "absolute",
    left: 34,
    top: 78,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  sectionTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "800",
  },
  jobCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  jobText: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepsCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepTextWrap: {
    marginLeft: 8,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepTime: {
    marginTop: 2,
    fontSize: 11,
  },
  progressWrap: {
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    width: "75%",
    height: "100%",
    borderRadius: 999,
  },
});
