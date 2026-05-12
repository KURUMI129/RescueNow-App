import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

interface WeatherData {
  temperature: number;
  condition: string;
}

const MOCK_WEATHER: WeatherData = {
  temperature: 22,
  condition: "Cloudy",
};

const ICONS: Record<string, string> = {
  sunny: "sunny",
  rainy: "rainy",
  cloudy: "cloudy",
  snow: "snow",
  thunderstorm: "thunderstorm",
  storm: "thunderstorm",
};

export function WeatherWidget({ weather }: { weather?: WeatherData }) {
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];

  const data = weather || MOCK_WEATHER;
  const iconName = ICONS[data.condition.toLowerCase()] || "cloudy";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      ]}
    >
      <Ionicons name={iconName as any} size={20} color={colors.primary} />
      <Text style={[styles.temperature, { color: colors.textPrimary }]}>
        {data.temperature}°C
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  temperature: {
    fontSize: 14,
    fontWeight: "700",
  },
});