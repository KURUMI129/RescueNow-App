import { useActiveTheme } from "@/hooks/use-active-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, View, Pressable, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";

const STORAGE_KEY = "@rescuenow_checkin_v1";

interface CheckInSettings {
  enabled: boolean;
  interval: number;
}

const INTERVAL_OPTIONS = [
  { label: "1h", value: 1 },
  { label: "2h", value: 2 },
  { label: "4h", value: 4 },
  { label: "8h", value: 8 },
  { label: "12h", value: 12 },
];

export default function SafetyCheckScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const colors = tokens.colors;

  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval] = useState(4);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CheckInSettings = JSON.parse(stored);
        setEnabled(parsed.enabled);
        setInterval(parsed.interval);
      }
    } catch (error) {
      console.warn("Failed to load check-in settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newEnabled: boolean, newInterval: number) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ enabled: newEnabled, interval: newInterval })
      );
    } catch (error) {
      console.warn("Failed to save check-in settings:", error);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleToggleEnabled = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEnabled(value);
    await saveSettings(value, interval);
  };

  const handleSelectInterval = async (newInterval: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterval(newInterval);
    await saveSettings(enabled, newInterval);
  };

  const handleManualCheckIn = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Check-in Completado",
      "Te has registrado exitosamente. Mantente seguro.",
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={HOME_THEME_COLORS[activeTheme].gradientBg}
        style={StyleSheet.absoluteFillObject}
      />
      <Header title="Check-in de Seguridad" showBack onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="shield-check" size={22} color={colors.success} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Auto Check-in
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                  Activar check-in automático
                </Text>
                <Text style={[styles.toggleSubtext, { color: colors.textSecondary }]}>
                  Recibe recordatorios para confirmar tu seguridad
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>

          {enabled && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Card style={[styles.card, { borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    Intervalo de Recordatorio
                  </Text>
                </View>

                <View style={styles.intervalContainer}>
                  {INTERVAL_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelectInterval(option.value)}
                      style={[
                        styles.intervalButton,
                        {
                          backgroundColor:
                            interval === option.value
                              ? colors.primary
                              : colors.background,
                          borderColor:
                            interval === option.value
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.intervalButtonText,
                          {
                            color:
                              interval === option.value
                                ? "#FFFFFF"
                                : colors.textPrimary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Card style={[styles.card, { borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Check-in Manual
                </Text>
              </View>

              <Text style={[styles.manualDescription, { color: colors.textSecondary }]}>
                Confirma tu seguridad ahora mismo con un solo toque.
              </Text>

              <Button
                title="Check-in ahora"
                onPress={handleManualCheckIn}
                variant="primary"
                size="lg"
                style={styles.manualButton}
              />
            </Card>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

import { DESIGN_TOKENS } from "@/constants/design-tokens";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, marginBottom: 20, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "800", marginLeft: 10 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  toggleLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  toggleSubtext: { fontSize: 13 },
  intervalContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  intervalButtonText: { fontSize: 14, fontWeight: "800" },
  manualDescription: { fontSize: 13, paddingHorizontal: 16, marginBottom: 16 },
  manualButton: { marginHorizontal: 16, marginBottom: 16 },
});