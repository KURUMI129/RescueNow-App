import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";

import { Card } from "@/components/ui/Card";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

interface EmergencyTipCardProps {
  title: string;
  description: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function EmergencyTipCard({
  title,
  description,
  detail,
  icon,
}: EmergencyTipCardProps) {
  const [expanded, setExpanded] = useState(false);
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const colors = tokens.colors;

  const rotation = useSharedValue(0);
  const detailHeight = useSharedValue(0);

  const toggleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    rotation.value = withTiming(newExpanded ? 1 : 0, { duration: 200 });
    detailHeight.value = withTiming(newExpanded ? 1 : 0, { duration: 200 });
  };

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  const detailStyle = useAnimatedStyle(() => ({
    opacity: detailHeight.value,
    maxHeight: detailHeight.value * 1000,
  }));

  const iconBgColors: Record<string, string> = {
    "heart": "rgba(239, 68, 68, 0.1)",
    "warning": "rgba(245, 158, 11, 0.1)",
    "water": "rgba(59, 130, 246, 0.1)",
    "medkit": "rgba(16, 185, 129, 0.1)",
    "flame": "rgba(249, 115, 22, 0.1)",
  };

  const iconColors: Record<string, string> = {
    "heart": "#EF4444",
    "warning": "#F59E0B",
    "water": "#3B82F6",
    "medkit": "#10B981",
    "flame": "#F97316",
  };

  return (
    <Card style={[styles.card, { borderColor: colors.border }]}>
      <Pressable onPress={toggleExpand} style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: iconBgColors[icon] || colors.primary + "15" },
          ]}
        >
          <Ionicons
            name={icon}
            size={24}
            color={iconColors[icon] || colors.primary}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
        <Animated.View style={arrowStyle}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.textSecondary}
          />
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.detailContainer, detailStyle]}>
        <View style={[styles.detailBorder, { backgroundColor: colors.border }]} />
        <Text style={[styles.detail, { color: colors.textPrimary }]}>
          {detail}
        </Text>
      </Animated.View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
  },
  detailContainer: {
    overflow: "hidden",
  },
  detailBorder: {
    height: 1,
    marginHorizontal: 16,
  },
  detail: {
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
  },
});