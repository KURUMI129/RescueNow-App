import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import {
    Animated,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(12), []);
  const optionAnimValues = useMemo(
    () => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)],
    [],
  );

  useEffect(() => {
    if (reduceMotionEnabled) {
      entranceOpacity.setValue(1);
      entranceTranslateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entranceOpacity, entranceTranslateY, reduceMotionEnabled]);

  useEffect(() => {
    if (reduceMotionEnabled) {
      optionAnimValues.forEach((value) => value.setValue(1));
      return;
    }

    Animated.stagger(
      70,
      optionAnimValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [optionAnimValues, reduceMotionEnabled]);

  const handleEmergencySelect = () => {
    if (!reduceMotionEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    router.back();
  };

  const handleClose = () => {
    if (!reduceMotionEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const emergencyOptions = [
    {
      id: "1",
      title: "Mecanico urgente",
      subtitle: "Falla severa en carretera",
      icon: "construct" as const,
    },
    {
      id: "2",
      title: "Grua inmediata",
      subtitle: "Traslado en emergencia",
      icon: "car-sport" as const,
    },
    {
      id: "3",
      title: "Plomeria critica",
      subtitle: "Fuga o rotura mayor",
      icon: "water" as const,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={[
            styles.entranceLayer,
            {
              opacity: entranceOpacity,
              transform: [{ translateY: entranceTranslateY }],
            },
          ]}
        >
          <View style={[styles.alertBadge, { backgroundColor: colors.danger }]}>
            <Ionicons name="warning" size={15} color="#fff" />
            <Text style={styles.alertBadgeText}>ALERTA CRITICA</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Emergencia rapida
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Selecciona tu tipo de incidente para priorizar la asistencia.
          </Text>

          <View
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.mapBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="pulse" size={16} color={colors.tracking} />
            <Text style={[styles.routeText, { color: colors.primary }]}>
              Unidad disponible para salida inmediata
            </Text>
          </View>

          {emergencyOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              style={{
                opacity: optionAnimValues[index],
                transform: [
                  {
                    translateY: optionAnimValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              }}
            >
              <Pressable
                onPress={handleEmergencySelect}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionIconWrap,
                    { backgroundColor: colors.mapBackground },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={colors.danger}
                  />
                </View>

                <View style={styles.optionTextWrap}>
                  <Text
                    style={[styles.optionTitle, { color: colors.textPrimary }]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </Animated.View>
          ))}

          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.closeText, { color: colors.onPrimary }]}>
              Cerrar
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  entranceLayer: {
    gap: 0,
  },
  alertBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  alertBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  routeCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  closeButton: {
    marginTop: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  closeText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
