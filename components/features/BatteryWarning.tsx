import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

interface BatteryState {
  level: number;
  isCharging: boolean;
}

async function getBatteryLevel(): Promise<BatteryState | null> {
  try {
    const Battery = await import("expo-battery");
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();
    if (level === -1) return null;
    return {
      level: Math.round(level * 100),
      isCharging: state === Battery.BatteryState.CHARGING,
    };
  } catch {
    return null;
  }
}

export function BatteryWarning() {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const [battery, setBattery] = useState<BatteryState | null>(null);

  useEffect(() => {
    const checkBattery = async () => {
      const state = await getBatteryLevel();
      setBattery(state);
    };
    checkBattery();
    const interval = setInterval(checkBattery, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!battery || battery.level >= 20) return null;

  return (
    <BlurView intensity={60} tint={activeTheme} style={[styles.container, { backgroundColor: tokens.colors.warning + "20" }]}>
      <Ionicons name="battery-dead-outline" size={20} color={tokens.colors.warning} />
      <Text style={[styles.text, { color: tokens.colors.warning }]}>
        {battery.level}% {battery.isCharging ? "• Cargando" : "• Batería baja"}
      </Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});