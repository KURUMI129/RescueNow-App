import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Slider from "@react-native-community/slider";

import { Card } from "@/components/ui/Card";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";
import { CRASH_SENSITIVITY_LABELS } from "@/constants/crash-settings";

interface CrashSensitivitySliderProps {
  threshold: number;
  onThresholdChange: (value: number) => void;
  label?: string;
}

export function CrashSensitivitySlider({
  threshold,
  onThresholdChange,
  label = "Sensibilidad de Detección",
}: CrashSensitivitySliderProps) {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const colors = tokens.colors;

  const cardStyle: ViewStyle = {
    ...styles.card,
    borderColor: colors.border,
  };

  return (
    <Card style={cardStyle}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={2}>{label}</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
          <Text
            style={[styles.badgeText, { color: colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Nivel {threshold}: {CRASH_SENSITIVITY_LABELS[threshold]}
          </Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={threshold}
        onValueChange={onThresholdChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Suave</Text>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Normal</Text>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Sensible</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 140,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },
});