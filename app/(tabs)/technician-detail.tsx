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

import { getAppCopy, getScheduleLabel } from "@/constants/app-copy";
import { AppLanguage } from "@/constants/app-preferences";
import {
    formatCurrencyMxn,
    formatDistanceKm,
} from "@/constants/display-format";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import {
    getSuggestedPrices,
    SERVICE_OPTIONS,
    ServiceCategory,
    ServiceComplexity,
    TECHNICIANS,
} from "@/constants/service-flow";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { useAppLanguage } from "@/hooks/use-app-language";

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
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const language = useAppLanguage();

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

  const copy = getAppCopy(language as AppLanguage);
  const t = copy.tabs.technicianDetail;
  const categoryLabel = copy.categories[category];

  const scheduleDate = useMemo(() => buildDateBySchedule(schedule), [schedule]);
  const scheduleLabel = useMemo(() => {
    const hourLabel = scheduleDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return getScheduleLabel(language as AppLanguage, schedule, hourLabel);
  }, [language, schedule, scheduleDate]);

  // Estimacion basada en distancia, urgencia, complejidad y contexto horario.
  const estimate = useMemo(
    () =>
      getSuggestedPrices(
        category,
        technician.distanceKm,
        urgent,
        complexity,
        scheduleDate,
        language as AppLanguage,
      ),
    [
      category,
      technician.distanceKm,
      urgent,
      complexity,
      scheduleDate,
      language,
    ],
  );

  const priceSuggestions = estimate.prices;
  const hasNightSurcharge = estimate.meta.nightFactor > 1;
  const hasWeekendSurcharge = estimate.meta.weekendFactor > 1;

  useEffect(() => {
    if (reduceMotionEnabled) {
      entranceOpacity.setValue(1);
      entranceTranslateY.setValue(0);
      return;
    }

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
  }, [entranceOpacity, entranceTranslateY, reduceMotionEnabled]);

  const handleModePress = (isUrgent: boolean) => {
    if (!reduceMotionEnabled) {
      void Haptics.impactAsync(
        isUrgent
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Light,
      );
    }
    setUrgent(isUrgent);
  };

  const handleComplexityPress = (value: ServiceComplexity) => {
    if (!reduceMotionEnabled) {
      void Haptics.selectionAsync();
    }
    setComplexity(value);
  };

  const handleSchedulePress = (value: ScheduleOption) => {
    if (!reduceMotionEnabled) {
      void Haptics.selectionAsync();
    }
    setSchedule(value);
  };

  const handleConfirm = () => {
    if (!reduceMotionEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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
            {t.step}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t.title}
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
              {t.etaSummary(technician.etaMin)}
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
              {categoryLabel} · {t.rating} {technician.rating.toFixed(1)}
            </Text>
            <Text style={[styles.techMeta, { color: colors.textSecondary }]}>
              {t.etaPrefix} {technician.etaMin} {t.min} ·{" "}
              {formatDistanceKm(technician.distanceKm, language as AppLanguage)}{" "}
              · {technician.jobsDone} {t.services}
            </Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              {technician.about[language as AppLanguage]}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {t.workLabel}
          </Text>
          <TextInput
            multiline
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder={t.workPlaceholder}
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
            {t.mode}
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
                {t.normal}
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
                {t.urgent}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {t.complexity}
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
                {t.basic}
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
                {t.medium}
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
                {t.high}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {t.schedule}
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
                {t.now}
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
                {t.in2h}
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
                {t.tomorrow}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {t.suggestedPrices}
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
                    {t.base}{" "}
                    {formatCurrencyMxn(
                      price.basePrice,
                      language as AppLanguage,
                    )}
                  </Text>
                </View>
                <Text style={[styles.priceAmount, { color: colors.accent }]}>
                  {formatCurrencyMxn(
                    price.estimatedPrice,
                    language as AppLanguage,
                  )}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.totalLabel}>{t.recommendedEstimate}</Text>
            <Text style={styles.totalValue}>
              {formatCurrencyMxn(
                priceSuggestions[0]?.estimatedPrice ?? 0,
                language as AppLanguage,
              )}
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
              {t.factors}
            </Text>
            <Text style={[styles.factorText, { color: colors.textSecondary }]}>
              {t.scheduleFactor}: {scheduleLabel}
            </Text>
            <Text style={[styles.factorText, { color: colors.textSecondary }]}>
              {t.distanceFactor}: x{estimate.meta.distanceFactor.toFixed(2)}
            </Text>
            <Text style={[styles.factorText, { color: colors.textSecondary }]}>
              {t.urgencyFactor}: x{estimate.meta.urgencyFactor.toFixed(2)}
            </Text>
            <Text style={[styles.factorText, { color: colors.textSecondary }]}>
              {t.complexityFactor}: x{estimate.meta.complexityFactor.toFixed(2)}
            </Text>
            {hasNightSurcharge ? (
              <Text style={[styles.factorText, { color: colors.danger }]}>
                {t.nightSurcharge}: x{estimate.meta.nightFactor.toFixed(2)}
              </Text>
            ) : null}
            {hasWeekendSurcharge ? (
              <Text style={[styles.factorText, { color: colors.danger }]}>
                {t.weekendSurcharge}: x{estimate.meta.weekendFactor.toFixed(2)}
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
              {t.confirm}
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
