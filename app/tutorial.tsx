import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { useTutorial } from "@/hooks/useTutorial";
import { DESIGN_TOKENS } from "@/constants/design-tokens";
import { useActiveTheme } from "@/hooks/use-active-theme";

const { width } = Dimensions.get("window");

interface TutorialStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: "warning",
    title: "Botón SOS",
    description: "Presiona el botón rojo para activar la emergencia",
  },
  {
    icon: "map",
    title: "Mapa de servicios",
    description: "Los marcadores muestran servicios de emergencia cercanos",
  },
  {
    icon: "people",
    title: "Contacto de confianza",
    description: "Tu contacto será notificado cuando actives el SOS",
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const { markAsShown } = useTutorial();
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];

  const handleDismiss = async () => {
    await markAsShown();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={64} color={tokens.colors.primary} />
        </View>

        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
          Bienvenido a RescueNow
        </Text>

        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={[styles.iconWrapper, { backgroundColor: `${tokens.colors.primary}1A` }]}>
                <Ionicons name={step.icon} size={28} color={tokens.colors.primary} />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={[styles.stepTitle, { color: tokens.colors.textPrimary }]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDescription, { color: tokens.colors.textSecondary }]}>
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Button
          title="Entendido"
          onPress={handleDismiss}
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
  },
  stepsContainer: {
    flex: 1,
    gap: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 32,
    width: width - 48,
  },
});