import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

export type MapTooltipIcon = "flame" | "shield" | "medkit";

export interface LegendItem {
  icon: MapTooltipIcon;
  label: string;
  color: string;
}

interface MapTooltipProps {
  items: LegendItem[];
  onDismiss: () => void;
}

const ICON_MAP: Record<MapTooltipIcon, keyof typeof Ionicons.glyphMap> = {
  flame: "flame",
  shield: "shield-checkmark",
  medkit: "medkit",
};

export const LEGEND_ITEMS: LegendItem[] = [
  { icon: "flame", label: "Bomberos", color: "#EF4444" },
  { icon: "shield", label: "Policía", color: "#3B82F6" },
  { icon: "medkit", label: "Hospitales", color: "#22C55E" },
];

export function MapTooltip({ items, onDismiss }: MapTooltipProps) {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          borderRadius: tokens.borderRadius.lg,
        },
      ]}
    >
      <View style={styles.handleBar}>
        <View
          style={[
            styles.handle,
            { backgroundColor: tokens.colors.border },
          ]}
        />
      </View>

      <View style={styles.content}>
        {items.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: item.color + "20" },
              ]}
            >
              <Ionicons
                name={ICON_MAP[item.icon]}
                size={20}
                color={item.color}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: tokens.colors.textPrimary },
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.dismissButton,
          { backgroundColor: tokens.colors.primary },
        ]}
        onPress={onDismiss}
        activeOpacity={0.8}
      >
        <Text style={styles.dismissText}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#0B1120",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minWidth: 200,
  },
  handleBar: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
  dismissButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  dismissText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
