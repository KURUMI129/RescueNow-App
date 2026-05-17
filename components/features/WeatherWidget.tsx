import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

interface WeatherWidgetProps {
  latitude?: number | null;
  longitude?: number | null;
}

// Open-Meteo WMO weather code -> Ionicons mapping
function iconForCode(code: number): keyof typeof Ionicons.glyphMap {
  if (code === 0) return "sunny";
  if (code === 1 || code === 2) return "partly-sunny";
  if (code === 3) return "cloudy";
  if (code >= 45 && code <= 48) return "cloudy-night";
  if (code >= 51 && code <= 67) return "rainy";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rainy";
  if (code >= 95 && code <= 99) return "thunderstorm";
  return "cloudy";
}

function colorForCode(code: number): string {
  if (code === 0) return "#F59E0B";
  if (code <= 3) return "#0EA5E9";
  if (code >= 95) return "#7C3AED";
  if (code >= 71 && code <= 77) return "#94A3B8";
  if (code >= 51) return "#0EA5E9";
  return "#94A3B8";
}

let cache: { lat: number; lon: number; data: WeatherData; ts: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const now = Date.now();
  if (
    cache &&
    now - cache.ts < CACHE_TTL_MS &&
    Math.abs(cache.lat - lat) < 0.05 &&
    Math.abs(cache.lon - lon) < 0.05
  ) {
    return cache.data;
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[Weather] HTTP", res.status);
      return null;
    }
    const json = await res.json();
    const current = json?.current_weather;
    if (!current) {
      console.warn("[Weather] missing current_weather payload");
      return null;
    }
    const data: WeatherData = {
      temperature: Math.round(current.temperature),
      weatherCode: current.weathercode ?? 3,
    };
    cache = { lat, lon, data, ts: now };
    return data;
  } catch (e) {
    console.warn("[Weather] fetch failed:", e);
    return null;
  }
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    let cancelled = false;
    setLoading(true);
    fetchWeather(latitude, longitude).then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Ionicons name="cloud-offline" size={16} color={colors.textSecondary} />
        <Text style={[styles.temperature, { color: colors.textSecondary }]}>--°</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name={iconForCode(data.weatherCode)} size={18} color={colorForCode(data.weatherCode)} />
      <Text style={[styles.temperature, { color: colors.textPrimary }]}>{data.temperature}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 5,
    minWidth: 56,
    justifyContent: "center",
  },
  temperature: {
    fontSize: 14,
    fontWeight: "800",
  },
});
