import { useRouter } from "expo-router";
import { Animated, StyleSheet, View } from "react-native";

import { QuickActionCard } from "@/components/home/quick-action-card";
import { HOME_DRAWER_PATHS } from "@/constants/home-drawer-routes";
import { HomeThemeColors } from "@/constants/home-theme";

type HomeQuickActionsProps = {
  colors: HomeThemeColors;
  requestServiceTitle: string;
  requestServiceSubtitle: string;
  trackingTitle: string;
  trackingSubtitle: string;
  sectionAnimValues: Animated.Value[];
};

export function HomeQuickActions({
  colors,
  requestServiceTitle,
  requestServiceSubtitle,
  trackingTitle,
  trackingSubtitle,
  sectionAnimValues,
}: HomeQuickActionsProps) {
  const router = useRouter();

  return (
    <View style={styles.actionsRow}>
      <Animated.View
        style={[
          styles.staggerItem,
          {
            opacity: sectionAnimValues[0],
            transform: [
              {
                translateY: sectionAnimValues[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <QuickActionCard
          title={requestServiceTitle}
          subtitle={requestServiceSubtitle}
          icon="construct-outline"
          colors={colors}
          onPress={() => router.push(HOME_DRAWER_PATHS.services as never)}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.staggerItem,
          {
            opacity: sectionAnimValues[1],
            transform: [
              {
                translateY: sectionAnimValues[1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <QuickActionCard
          title={trackingTitle}
          subtitle={trackingSubtitle}
          icon="navigate-outline"
          colors={colors}
          onPress={() => router.push(HOME_DRAWER_PATHS.tracking as never)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    marginTop: 12,
    alignItems: "stretch",
    gap: 8,
  },
  staggerItem: {
    width: "100%",
  },
});
