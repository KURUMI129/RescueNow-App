import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { HomeThemeColors } from "@/constants/home-theme";

type MapPreviewProps = {
  colors: HomeThemeColors;
};

export function MapPreview({ colors }: MapPreviewProps) {
  return (
    <View
      style={[
        styles.mapCard,
        {
          backgroundColor: colors.mapBackground,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View
        style={[
          styles.gridHorizontal,
          { backgroundColor: colors.mapGrid, top: 48 },
        ]}
      />
      <View
        style={[
          styles.gridHorizontal,
          { backgroundColor: colors.mapGrid, top: 108 },
        ]}
      />
      <View
        style={[
          styles.gridVertical,
          { backgroundColor: colors.mapGrid, left: 90 },
        ]}
      />
      <View
        style={[
          styles.gridVertical,
          { backgroundColor: colors.mapGrid, left: 190 },
        ]}
      />

      <View style={[styles.pin, { top: 34, left: 32 }]}>
        <Ionicons name="build" size={16} color={colors.technicianPin} />
      </View>
      <View style={[styles.pin, { top: 120, left: 222 }]}>
        <Ionicons name="car-sport" size={16} color={colors.technicianPin} />
      </View>
      <View style={[styles.pin, { top: 68, left: 154 }]}>
        <Ionicons name="person" size={16} color={colors.userPin} />
      </View>

      <View style={[styles.userBadge, { borderColor: colors.userPin }]}>
        <Text style={[styles.userBadgeText, { color: colors.textPrimary }]}>
          Tu ubicación
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    borderWidth: 1,
    borderRadius: 16,
    height: 190,
    overflow: "hidden",
    position: "relative",
  },
  gridHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  gridVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.7,
  },
  pin: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  userBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffffdd",
  },
  userBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
