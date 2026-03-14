import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Animated,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import {
    getCategoryLabel,
    getSuggestedPrices,
    SERVICE_OPTIONS,
    ServiceCategory,
    ServiceComplexity,
    TECHNICIANS,
} from "@/constants/service-flow";

function getParamValue(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function isServiceCategory(value: string): value is ServiceCategory {
  return SERVICE_OPTIONS.some((item) => item.id === value);
}

type ScheduleOption = "now" | "in2h" | "tomorrow9";

function buildDateBySchedule(schedule: ScheduleOption): Date {
  const now = new Date();

  if (schedule === "in2h") {
    return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }

  if (schedule === "tomorrow9") {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  return now;
}

function formatScheduleLabel(schedule: ScheduleOption, date: Date): string {
  if (schedule === "now") {
    return "Ahora";
  }

  if (schedule === "in2h") {
    return "En 2 horas";
  }

  const hour = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Manana, ${hour}`;
}

export default function TechnicianDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    techId?: string;
    category?: string;
    issue?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;

  const techId = getParamValue(params.techId);
  const rawCategory = getParamValue(params.category);
  const initialIssue = getParamValue(params.issue);

  const category: ServiceCategory = isServiceCategory(rawCategory)
    ? rawCategory
    : "mech";

  const technician =
    TECHNICIANS.find(
      (item) => item.id === techId && item.category === category,
    ) ?? TECHNICIANS[0];

  const [issueDescription, setIssueDescription] =
    useState<string>(initialIssue);
  const [urgent, setUrgent] = useState<boolean>(false);
  const [complexity, setComplexity] = useState<ServiceComplexity>("basic");
  const [schedule, setSchedule] = useState<ScheduleOption>("now");
  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(12), []);

  const scheduleDate = useMemo(() => buildDateBySchedule(schedule), [schedule]);
  const scheduleLabel = useMemo(
    () => formatScheduleLabel(schedule, scheduleDate),
    [schedule, scheduleDate],
  );

  // Estimacion basada en distancia, urgencia, complejidad y contexto horario.
  const estimate = useMemo(
    () =>
      getSuggestedPrices(
        category,
        technician.distanceKm,
        urgent,
        complexity,
        scheduleDate,
      ),
    [category, technician.distanceKm, urgent, complexity, scheduleDate],
  );

  const priceSuggestions = estimate.prices;
  const hasNightSurcharge = estimate.meta.nightFactor > 1;
  const hasWeekendSurcharge = estimate.meta.weekendFactor > 1;

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

  const handleModePress = (isUrgent: boolean) => {
    void Haptics.impactAsync(
      isUrgent
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light,
    );
    setUrgent(isUrgent);
  };

  const handleComplexityPress = (value: ServiceComplexity) => {
    void Haptics.selectionAsync();
    setComplexity(value);
  };

  const handleSchedulePress = (value: ScheduleOption) => {
    void Haptics.selectionAsync();
    setSchedule(value);
  };

  const handleConfirm = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/(tabs)/tracking");
  };

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
          <Text style={[styles.topLabel, { color: colors.textSecondary }]}>
            Paso 3 de 3
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Detalle del tecnico
          </Text>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.mapBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={[styles.summaryText, { color: colors.primary }]}>
              Llegada estimada en {technician.etaMin} minutos
            </Text>
          </View>

          <View
            style={[
              styles.techCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.techName, { color: colors.textPrimary }]}>
              {technician.name}
            </Text>
            <Text style={[styles.techMeta, { color: colors.textSecondary }]}>
              {getCategoryLabel(category)} · Calificacion{" "}
              {technician.rating.toFixed(1)}
            </Text>
            <Text style={[styles.techMeta, { color: colors.textSecondary }]}>
              ETA {technician.etaMin} min · {technician.distanceKm.toFixed(1)}{" "}
              km · {technician.jobsDone} servicios
            </Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              {technician.about}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Que trabajo necesitas?
          </Text>
          <TextInput
            multiline
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder="Ejemplo: Cambio de llanta trasera y revision de presion."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.issueInput,
              {
                color: colors.textPrimary,
                borderColor: colors.cardBorder,
                backgroundColor: colors.surface,
              },
            ]}
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Modalidad
          </Text>
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => handleModePress(false)}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: !urgent ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: !urgent ? colors.onPrimary : colors.textPrimary },
                ]}
              >
                Normal
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleModePress(true)}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: urgent ? colors.danger : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: urgent ? "#fff" : colors.textPrimary },
                ]}
              >
                Urgente
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Complejidad
          </Text>
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => handleComplexityPress("basic")}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor:
                    complexity === "basic" ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      complexity === "basic"
                        ? colors.onPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                Basica
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleComplexityPress("medium")}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor:
                    complexity === "medium" ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      complexity === "medium"
                        ? colors.onPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                Media
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleComplexityPress("complex")}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor:
                    complexity === "complex" ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      complexity === "complex"
                        ? colors.onPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                Alta
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Horario de servicio
          </Text>
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => handleSchedulePress("now")}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor:
                    schedule === "now" ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      schedule === "now"
                        ? colors.onPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                Ahora
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSchedulePress("in2h")}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor:
                    schedule === "in2h" ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      schedule === "in2h"
                        ? colors.onPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                En 2 horas
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSchedulePress("tomorrow9")}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor:
                    schedule === "tomorrow9" ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      schedule === "tomorrow9"
                        ? colors.onPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                Manana 9:00
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Precios sugeridos (aprox.)
          </Text>
          <View
            style={[
              styles.pricesCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {priceSuggestions.map((price) => (
              <View key={price.job} style={styles.priceRow}>
                <View>
                  <Text
                    style={[styles.priceJob, { color: colors.textPrimary }]}
                  >
                    {price.job}
                  </Text>
                  <Text
                    style={[
                      styles.basePriceText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Base ${price.basePrice} MXN
                  </Text>
                </View>
                <Text style={[styles.priceAmount, { color: colors.accent }]}>
                  ${price.estimatedPrice} MXN
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.totalLabel}>Estimado recomendado</Text>
            <Text style={styles.totalValue}>
              ${priceSuggestions[0]?.estimatedPrice ?? 0} MXN
            </Text>
          </View>

          <View
            style={[
              styles.factorCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.factorTitle, { color: colors.textPrimary }]}>
              Factores aplicados
            </Text>
            <Text style={[styles.factorText, { color: colors.textSecondary }]}>
              Horario: {scheduleLabel}
            </Text>
            <Text style={[styles.factorText, { color: colors.textSecondary }]}>
              Distancia: x{estimate.meta.distanceFactor.toFixed(2)}
            </Text>
            <Text style={[styles.factorText, { color: colors.textSecondary }]}>
              Urgencia: x{estimate.meta.urgencyFactor.toFixed(2)}
            </Text>
            <Text style={[styles.factorText, { color: colors.textSecondary }]}>
              Complejidad: x{estimate.meta.complexityFactor.toFixed(2)}
            </Text>
            {hasNightSurcharge ? (
              <Text style={[styles.factorText, { color: colors.danger }]}>
                Recargo nocturno activo: x{estimate.meta.nightFactor.toFixed(2)}
              </Text>
            ) : null}
            {hasWeekendSurcharge ? (
              <Text style={[styles.factorText, { color: colors.danger }]}>
                Recargo fin de semana activo: x
                {estimate.meta.weekendFactor.toFixed(2)}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.confirmButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={[styles.confirmText, { color: colors.onPrimary }]}>
              Confirmar y ver ruta
            </Text>
          </Pressable>
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
  topLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    marginTop: 2,
    marginBottom: 12,
    fontSize: 24,
    fontWeight: "900",
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "800",
  },
  techCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  techName: {
    fontSize: 16,
    fontWeight: "900",
  },
  techMeta: {
    marginTop: 2,
    fontSize: 12,
  },
  aboutText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "800",
  },
  issueInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 88,
    textAlignVertical: "top",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  pricesCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  priceRow: {
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceJob: {
    fontSize: 13,
    fontWeight: "700",
  },
  priceAmount: {
    fontSize: 13,
    fontWeight: "900",
  },
  basePriceText: {
    marginTop: 2,
    fontSize: 11,
  },
  totalCard: {
    marginTop: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.95,
  },
  totalValue: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  factorCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  factorTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  factorText: {
    fontSize: 12,
    marginTop: 2,
  },
  confirmButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "900",
  },
});
