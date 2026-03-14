import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import {
    Animated,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    useWindowDimensions,
    View,
} from "react-native";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import {
    getCategoryLabel,
    SERVICE_OPTIONS,
    ServiceCategory,
    TECHNICIANS,
} from "@/constants/service-flow";

function getParamValue(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function isServiceCategory(value: string): value is ServiceCategory {
  return SERVICE_OPTIONS.some((item) => item.id === value);
}

export default function TechniciansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; issue?: string }>();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const { width } = useWindowDimensions();
  const titleSize = Math.max(22, Math.min(28, width * 0.075));

  const rawCategory = getParamValue(params.category);
  const issue = getParamValue(params.issue);

  const category: ServiceCategory = isServiceCategory(rawCategory)
    ? rawCategory
    : "mech";
  const availableTechnicians = TECHNICIANS.filter(
    (item) => item.category === category,
  );
  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(12), []);
  const cardAnimValues = useMemo(
    () => availableTechnicians.map(() => new Animated.Value(0)),
    [availableTechnicians],
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
      70,
      cardAnimValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [cardAnimValues]);

  const handleTechnicianPress = (techId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/(tabs)/technician-detail",
      params: {
        techId,
        category,
        issue,
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
            Paso 2 de 3
          </Text>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, fontSize: titleSize },
            ]}
          >
            {getCategoryLabel(category)}s disponibles
          </Text>

          <View
            style={[
              styles.statusRow,
              {
                backgroundColor: colors.mapBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="construct" size={16} color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.primary }]}>
              {availableTechnicians.length} tecnicos activos cerca de ti
            </Text>
          </View>

          {issue.trim().length > 0 ? (
            <View
              style={[
                styles.issueCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.issueTitle, { color: colors.textPrimary }]}>
                Trabajo solicitado:
              </Text>
              <Text style={[styles.issueText, { color: colors.textSecondary }]}>
                {issue}
              </Text>
            </View>
          ) : null}

          {availableTechnicians.map((tech, index) => (
            <Animated.View
              key={tech.id}
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
                onPress={() => handleTechnicianPress(tech.id)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: colors.mapBackground },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.textWrap}>
                  <Text style={[styles.name, { color: colors.textPrimary }]}>
                    {tech.name}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    ETA {tech.etaMin} min · {tech.distanceKm.toFixed(1)} km
                  </Text>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={colors.accent} />
                    <Text
                      style={[styles.metaStrong, { color: colors.textPrimary }]}
                    >
                      {tech.rating.toFixed(1)}
                    </Text>
                    <Text
                      style={[styles.meta, { color: colors.textSecondary }]}
                    >
                      {tech.jobsDone} servicios completados
                    </Text>
                  </View>
                </View>

                <View style={styles.rightWrap}>
                  <View
                    style={[styles.badge, { backgroundColor: colors.tracking }]}
                  >
                    <Text style={styles.badgeText}>Disponible</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </View>
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
  topLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    marginTop: 2,
    marginBottom: 12,
    fontSize: 24,
    fontWeight: "900",
  },
  statusRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  issueCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  issueText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
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
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "800",
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
  },
  ratingRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaStrong: {
    fontSize: 12,
    fontWeight: "800",
    marginRight: 6,
  },
  rightWrap: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#003A3D",
    fontSize: 10,
    fontWeight: "800",
  },
  entranceLayer: {
    gap: 0,
  },
});
