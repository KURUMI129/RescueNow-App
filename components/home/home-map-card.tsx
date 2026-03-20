import { Ionicons } from "@expo/vector-icons";
import { RefObject } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { HomeThemeColors } from "@/constants/home-theme";
import { TechnicianMarker } from "@/hooks/use-live-map";

type HomeMapCardProps = {
  colors: HomeThemeColors;
  mapRef: RefObject<MapView | null>;
  mapRegion: Region;
  isLocating: boolean;
  technicians: TechnicianMarker[];
  locatingText: string;
  centerMapLabel: string;
  etaPrefix: string;
  onCenterMap: () => void;
};

export function HomeMapCard({
  colors,
  mapRef,
  mapRegion,
  isLocating,
  technicians,
  locatingText,
  centerMapLabel,
  etaPrefix,
  onCenterMap,
}: HomeMapCardProps) {
  return (
    <View
      style={[
        styles.mapWrap,
        {
          borderColor: colors.cardBorder,
          backgroundColor: colors.surface,
        },
      ]}
    >
      {isLocating ? (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.mapInfoText, { color: colors.textSecondary }]}>
            {locatingText}
          </Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          showsUserLocation
          followsUserLocation={false}
          loadingEnabled
        >
          {technicians.map((tech) => (
            <Marker
              key={tech.id}
              coordinate={{
                latitude: tech.latitude,
                longitude: tech.longitude,
              }}
              title={tech.name}
              description={`${tech.specialty} · ${etaPrefix} ${tech.eta}`}
              pinColor={colors.accent}
            />
          ))}
        </MapView>
      )}

      {!isLocating ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={centerMapLabel}
          onPress={onCenterMap}
          style={({ pressed }) => [
            styles.centerMapButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Ionicons name="locate" size={16} color={colors.primary} />
          <Text style={[styles.centerMapText, { color: colors.textPrimary }]}>
            {centerMapLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    height: 210,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  centerMapButton: {
    position: "absolute",
    top: 10,
    right: 10,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 34,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  centerMapText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
