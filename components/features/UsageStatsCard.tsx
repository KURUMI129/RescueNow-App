import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

interface UsageStatsCardProps {
  sosCount: number;
  crashDetections: number;
  checkIns: number;
}

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function UsageStatsCard({
  sosCount,
  crashDetections,
  checkIns,
}: UsageStatsCardProps) {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const colors = tokens.colors;

  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        <StatItem
          icon="warning"
          label="Emergencias"
          value={sosCount}
          color={colors.primary}
        />
        <StatItem
          icon="car"
          label="Detections"
          value={crashDetections}
          color={colors.warning}
        />
        <StatItem
          icon="shield-checkmark"
          label="Check-ins"
          value={checkIns}
          color={colors.success}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});