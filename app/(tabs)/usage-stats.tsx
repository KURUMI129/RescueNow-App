import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Header } from "@/components/ui/Header";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsageStatsCard } from "@/components/features/UsageStatsCard";

const USAGE_STATS_KEY = "@rescuenow_usage_stats_v1";

interface UsageStats {
  sosCount: number;
  crashDetections: number;
  checkIns: number;
}

export default function UsageStatsScreen() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(USAGE_STATS_KEY);
      if (stored) {
        setStats(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading usage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Estadísticas" />
        <EmptyState type="loading" title="Cargando estadísticas..." />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <Header title="Estadísticas" />
        <EmptyState
          type="empty"
          title="Sin estadísticas"
          subtitle="Aún no hay datos de uso registrados"
          icon="bar-chart-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Estadísticas" />
      <View style={styles.content}>
        <UsageStatsCard
          sosCount={stats.sosCount}
          crashDetections={stats.crashDetections}
          checkIns={stats.checkIns}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});