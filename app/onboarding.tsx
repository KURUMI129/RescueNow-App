import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Dimensions,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { useOnboarding } from "@/hooks/useOnboarding";

const { width } = Dimensions.get("window");

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    icon: "shield-checkmark",
    title: "RescueNow te protege",
    subtitle: "Tu seguridad es nuestra prioridad. Estamos disponibles 24/7 para brindarte asistencia inmediata.",
  },
  {
    icon: "warning",
    title: "Un toque para pedir ayuda",
    subtitle: "Con un solo toque, enviaremos tu ubicación a servicios de emergencia y contactos de confianza.",
  },
  {
    icon: "map",
    title: "Servicios de emergencia",
    subtitle: "Accede a grúas, mecánicos, cerrajeros y más. Técnicos cercanos listos para ayudarte.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const { completeOnboarding } = useOnboarding();

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace("/(auth)");
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    return (
      <View style={styles.slide}>
        <View style={[styles.iconContainer, { backgroundColor: activeTheme === "dark" ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.1)" }]}>
          <Ionicons
            name={item.icon}
            size={64}
            color="#DC2626"
          />
        </View>
        <Text style={[styles.title, { color: activeTheme === "dark" ? "#F8FAFC" : "#0F172A" }]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, { color: activeTheme === "dark" ? "#94A3B8" : "#475569" }]}>
          {item.subtitle}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme === "dark" ? "#0F172A" : "#F8FAFC" }]}>
      <View style={styles.content}>
        <FlatList
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(_, index) => `slide-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={width}
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                { backgroundColor: activeTheme === "dark" ? "#475569" : "#CBD5E1" },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Comenzar"
          onPress={handleComplete}
          variant="primary"
          size="lg"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  slide: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 16,
  },
});