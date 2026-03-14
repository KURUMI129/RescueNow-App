import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Animated,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    useWindowDimensions,
    View,
} from "react-native";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { SERVICE_OPTIONS, ServiceCategory } from "@/constants/service-flow";

const SERVICE_ACCENT: Record<ServiceCategory, string> = {
  mech: "#0047AB",
  tow: "#FF6600",
  lock: "#00CED1",
  plumb: "#34A853",
};

export default function ServicesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const { width } = useWindowDimensions();
  const titleSize = Math.max(22, Math.min(28, width * 0.075));
  const [issueDescription, setIssueDescription] = useState<string>("");
  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(12), []);
  const cardAnimValues = useMemo(
    () => SERVICE_OPTIONS.map(() => new Animated.Value(0)),
    [],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslateY, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entranceOpacity, entranceTranslateY]);

  useEffect(() => {
    Animated.stagger(
      65,
      cardAnimValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [cardAnimValues]);

  const handleServicePress = (category: ServiceCategory) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/(tabs)/technicians",
      params: {
        category,
        issue: issueDescription.trim(),
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.entranceLayer,
            {
              opacity: entranceOpacity,
              transform: [{ translateY: entranceTranslateY }],
            },
          ]}
        >
          <Text style={[styles.topLabel, { color: colors.textSecondary }]}>
            Paso 1 de 3
          </Text>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, fontSize: titleSize },
            ]}
          >
            Que servicio necesitas?
          </Text>

          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: colors.mapBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="navigate" size={16} color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.primary }]}>
              Asistencia activa en tu zona
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Describe tu problema (opcional)
          </Text>
          <TextInput
            multiline
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder="Ejemplo: Se me poncho una llanta en carretera."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.issueInput,
              {
                color: colors.textPrimary,
                borderColor: colors.cardBorder,
                backgroundColor: colors.surface,
              },
            ]}
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Categorias disponibles
          </Text>

          {SERVICE_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.id}
              style={{
                opacity: cardAnimValues[index],
                transform: [
                  {
                    translateY: cardAnimValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              }}
            >
              <Pressable
                onPress={() => handleServicePress(option.id as ServiceCategory)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: SERVICE_ACCENT[option.id as ServiceCategory],
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: colors.mapBackground },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={SERVICE_ACCENT[option.id as ServiceCategory]}
                  />
                </View>

                <View style={styles.textWrap}>
                  <Text
                    style={[styles.cardTitle, { color: colors.textPrimary }]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                  <Text
                    style={[styles.cardHint, { color: colors.textSecondary }]}
                  >
                    Tecnicos disponibles ahora
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
    paddingBottom: 24,
  },
  entranceLayer: {
    gap: 0,
  },
  topLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "800",
  },
  issueInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 84,
    textAlignVertical: "top",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    marginLeft: 10,
    marginRight: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
  },
});
