import { useActiveTheme } from "@/hooks/use-active-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { AppEvents, EVENT_SELECT_SERVICE_FILTER } from "@/lib/app-events";
import { MAP_SERVICES } from "@/constants/services";

export default function ServicesScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const language = useAppLanguage();
  const { width } = useWindowDimensions();
  const titleSize = Math.max(22, Math.min(28, width * 0.075));

  const handleServicePress = (serviceId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Emit the filter event so the home screen picks it up
    AppEvents.emit(EVENT_SELECT_SERVICE_FILTER, serviceId);
    // Navigate back to home tab
    router.navigate("/(tabs)");
  };

  return (
    <View style={styles.safeArea}>
      <LinearGradient 
        colors={colors.gradientBg} 
        style={StyleSheet.absoluteFillObject} 
      />
      <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.entranceLayer}>

          {/* Header */}
          <Text style={[styles.topLabel, { color: colors.textSecondary }]}>
            {language === "es" ? "Buscar en el mapa" : "Search on map"}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: titleSize }]}>
            {language === "es" ? "¿Qué asistencia necesitas?" : "What assistance do you need?"}
          </Text>

          {/* Info badge */}
          <View style={[styles.infoBadge, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="map-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoBadgeText, { color: colors.primary }]}>
              {language === "es"
                ? "Selecciona una opción para ver ubicaciones en el mapa"
                : "Select an option to see locations on the map"}
            </Text>
          </View>

          {/* Service Cards */}
          {MAP_SERVICES.map((service, index) => (
            <Animated.View
              key={service.id}
              entering={FadeInDown.delay(200 + index * 65).springify()}
            >
              <Pressable
                onPress={() => handleServicePress(service.id)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: 'transparent',
                    borderLeftColor: service.colorHex,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <BlurView intensity={activeTheme === "dark" ? 40 : 80} tint={activeTheme} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.iconWrap, { backgroundColor: `${service.colorHex}15` }]}>
                  <MaterialCommunityIcons
                    name={service.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={22}
                    color={service.colorHex}
                  />
                </View>

                <View style={styles.textWrap}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    {language === "es" ? service.titleEs : service.titleEn}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                    {language === "es" ? service.descEs : service.descEn}
                  </Text>
                </View>

                <View style={[styles.arrowWrap, { backgroundColor: `${service.colorHex}10` }]}>
                  <Ionicons name="navigate" size={16} color={service.colorHex} />
                </View>
                </BlurView>
              </Pressable>
            </Animated.View>
          ))}

          {/* Bottom note */}
          <View style={[styles.noteContainer, { borderColor: colors.cardBorder }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              {language === "es"
                ? "Los resultados se basan en tu ubicación actual usando datos de OpenStreetMap."
                : "Results are based on your current location using OpenStreetMap data."}
            </Text>
          </View>

        </Animated.View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  entranceLayer: {
    gap: 0,
  },
  topLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  card: {
    borderLeftWidth: 3,
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#0B1120",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    marginLeft: 14,
  },
  textWrap: {
    marginLeft: 12,
    marginRight: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  cardSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
