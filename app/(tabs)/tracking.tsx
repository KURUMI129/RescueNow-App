import { useActiveTheme } from "@/hooks/use-active-theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { getAppCopy } from "@/constants/app-copy";
import { AppLanguage } from "@/constants/app-preferences";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { useAppLanguage } from "@/hooks/use-app-language";

export default function TrackingScreen() {
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const language = useAppLanguage();
  const { width } = useWindowDimensions();
  const titleSize = Math.max(22, Math.min(28, width * 0.075));

  const t = getAppCopy(language as AppLanguage).tabs.tracking;



  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.entranceLayer}
        >
          <Text style={[styles.topTitle, { color: colors.textSecondary }]}>
            {t.topTitle}
          </Text>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, fontSize: titleSize },
            ]}
          >
            {t.title}
          </Text>

          <View
            style={[
              styles.etaCard,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>
              {t.etaLabel}
            </Text>
            <Text style={[styles.etaValue, { color: colors.primary }]}>
              {t.etaValue}
            </Text>
            <Text style={[styles.etaSub, { color: colors.textSecondary }]}>
              {t.distance}
            </Text>
            <View
              style={[styles.liveBadge, { backgroundColor: colors.tracking }]}
            >
              <Text style={styles.liveBadgeText}>{t.live}</Text>
            </View>
          </View>

          <View
            style={[
              styles.mapCard,
              {
                backgroundColor: colors.mapBackground,
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
            {t.section}
          </Text>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View
            style={[
              styles.jobCard,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={[styles.jobText, { color: colors.textPrimary }]}>
              {t.service}
            </Text>
            <Text style={[styles.jobText, { color: colors.textPrimary }]}>
              {t.status}
            </Text>
          </View>

          <View
            style={[
              styles.stepsCard,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            {t.steps.map((step) => (
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
                {t.diagnosis}
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
    borderRadius: 16,
    padding: 14,
    shadowColor: '#0B1120',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
  },
  sectionTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "800",
  },
  jobCard: {
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: '#0B1120',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  jobText: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepsCard: {
    marginTop: 10,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    shadowColor: '#0B1120',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
