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
import Animated, { FadeInDown } from "react-native-reanimated";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { AppEvents, EVENT_SELECT_SERVICE_FILTER } from "@/lib/app-events";

// Service options that map directly to the map's POI filter system
type ServiceItem = {
  id: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  icon: string; // MaterialCommunityIcons name
  colorHex: string;
};

const SERVICE_OPTIONS: ServiceItem[] = [
  {
    id: "hospital",
    titleEs: "Hospitales",
    titleEn: "Hospitals",
    descEs: "Encuentra clínicas y hospitales cercanos a tu ubicación",
    descEn: "Find nearby clinics and hospitals",
    icon: "hospital-box",
    colorHex: "#DC2626",
  },
  {
    id: "tow",
    titleEs: "Grúa",
    titleEn: "Tow Truck",
    descEs: "Servicio de arrastre para vehículo inmovilizado",
    descEn: "Towing service for immobilized vehicle",
    icon: "tow-truck",
    colorHex: "#FFB800",
  },
  {
    id: "mechanic_car",
    titleEs: "Mecánico de Autos",
    titleEn: "Car Mechanic",
    descEs: "Talleres mecánicos para fallas de motor, batería y más",
    descEn: "Auto repair shops for engine, battery and more",
    icon: "car-wrench",
    colorHex: "#3B82F6",
  },
  {
    id: "mechanic_moto",
    titleEs: "Mecánico de Motos",
    titleEn: "Motorcycle Mechanic",
    descEs: "Talleres especializados en reparación de motocicletas",
    descEn: "Motorcycle repair and service shops",
    icon: "motorbike",
    colorHex: "#6366F1",
  },
  {
    id: "electrician",
    titleEs: "Electricista Automotriz",
    titleEn: "Auto Electrician",
    descEs: "Diagnóstico y reparación de sistemas eléctricos vehiculares",
    descEn: "Vehicle electrical system diagnosis and repair",
    icon: "flash",
    colorHex: "#EAB308",
  },
  {
    id: "gas",
    titleEs: "Gasolinera",
    titleEn: "Gas Station",
    descEs: "Encuentra la estación de combustible más cercana",
    descEn: "Find the nearest fuel station",
    icon: "gas-station",
    colorHex: "#10B981",
  },
  {
    id: "tire",
    titleEs: "Llantera",
    titleEn: "Tire Shop",
    descEs: "Llanterías cercanas para ponchadura o presión baja",
    descEn: "Nearby tire shops for punctures or low pressure",
    icon: "tire",
    colorHex: "#F97316",
  },
  {
    id: "locksmith",
    titleEs: "Cerrajero",
    titleEn: "Locksmith",
    descEs: "Apertura de vehículo o duplicado de llaves",
    descEn: "Vehicle unlock or key duplication",
    icon: "key",
    colorHex: "#8B5CF6",
  },
];


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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
          {SERVICE_OPTIONS.map((service, index) => (
            <Animated.View
              key={service.id}
              entering={FadeInDown.delay(200 + index * 65).springify()}
            >
              <Pressable
                onPress={() => handleServicePress(service.id)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: service.colorHex,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
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
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0B1120",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
