import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EmergencyTipCard } from "@/components/features/EmergencyTipCard";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

const EMERGENCY_TIPS = [
  {
    title: "Primeros auxilios: RCP",
    description: "Reanimación cardiopulmonar en adultos",
    detail: "1. Verifica que la persona no responda y no respire normalmente.\n2. Llama al 911 o indica a alguien que lo haga.\n3. Coloca a la persona boca arriba sobre una superficie firme.\n4. Pon el talón de una mano en el centro del pecho (sobre el esternón), la otra mano encima entrelazando los dedos.\n5. Realiza compresiones fuertes y rápidas (100-120 por minuto, profundidad de 5-6 cm).\n6. Si estás capacitado, alterna 30 compresiones con 2 ventilaciones.",
    icon: "heart" as const,
  },
  {
    title: "Atragantamiento: Maniobra de Heimlich",
    description: "Desobstrucción de vías respiratorias",
    detail: "1. Pregunta a la persona si se está atragantando.\n2. Colócate detrás de la persona y envuelve tus brazos alrededor de su cintura.\n3. Forma un puño con una mano y colócalo encima del ombligo, debajo del esternón.\n4. Agarra el puño con la otra mano y realiza compresiones abdominales hacia arriba y hacia adentro.\n5. Repite hasta que el objeto sea expulsado o la persona pierda el conocimiento.\n6. Si pierde el conocimiento, inicia RCP.",
    icon: "warning" as const,
  },
  {
    title: "Sangrado: Cómo controlar",
    description: "Control de hemorragias",
    detail: "1. Usa guantes si están disponibles para protegerte.\n2. Aplica presión directa sobre la herida con un pano limpio o tu mano.\n3. No retires el pano si se satura; añade más capas encima.\n4. Eleva la extremidad afectada por encima del nivel del corazón si es posible.\n5. Si el sangrado es severo y no se controla, aplica un torniquete solo como último recurso (anota la hora).\n6. Busca atención médica inmediata.",
    icon: "water" as const,
  },
  {
    title: "Fracturas: Inmovilización",
    description: "Inmovilización de huesos rotos",
    detail: "1. No muevas a la persona ni intentes corregir la posición del miembro.\n2. Inmoviliza la zona afectada en la posición en que se encuentra.\n3. Usa férulas rigidezas (tablillas) o materiales improvisados (madera, revistas enrolladas).\n4. Asegura la férula por encima y debajo del área de la fractura, sin apretar demasiado.\n5. Aplica hielo envuelto en tela para reducir la inflamación (no más de 20 minutos).\n6. Busca atención médica urgentemente.",
    icon: "medkit" as const,
  },
  {
    title: "Quemaduras: Primeros pasos",
    description: "Tratamiento inicial de quemaduras",
    detail: "1. Retira a la persona de la fuente de calor y aleja el peligro.\n2. Enfría la quemadura con agua fresca (no helada) durante 10-20 minutos.\n3. No apliques hielo, mantequilla, pasta de dientes ni otros remedios caseros.\n4. Retira suavemente accesorios, ropa suelta o joyería cerca de la zona (pero no si están pegados a la piel).\n5. Cubre la quemadura con un pano limpio y no adhesivo.\n6. Busca atención médica para quemaduras grandes, en cara, manos, pies, ingles o articulaciones.",
    icon: "flame" as const,
  },
];

export default function EmergencyTipsScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];

  return (
    <View style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.headerBar, { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.navigate("/(tabs)")}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Tips de Emergencia
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={[styles.infoCard, { backgroundColor: `${colors.accent}12`, borderColor: colors.accent }]}>
              <Ionicons name="information-circle" size={22} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                Estos tips son guía básica. En emergencias reales, llama al 911 o servicios de emergencia locales.
              </Text>
            </View>

            {EMERGENCY_TIPS.map((tip, index) => (
              <Animated.View key={tip.title} entering={FadeInDown.delay(150 + index * 50).springify()}>
                <EmergencyTipCard
                  title={tip.title}
                  description={tip.description}
                  detail={tip.detail}
                  icon={tip.icon}
                />
              </Animated.View>
            ))}
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
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
});