import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/ui/Card";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

const SHARE_MESSAGE = "Descarga RescueNow - Tu app de emergencia personal. https://rescuenow.app/download";

export function ShareAppCard() {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const colors = tokens.colors;

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: SHARE_MESSAGE,
    });
  };

  return (
    <Pressable
      onPress={handleShare}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Card style={[styles.card, { borderColor: colors.border }]}>
        <View style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
            <MaterialCommunityIcons name="share-variant" size={24} color={colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Compartir App
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Recomienda RescueNow a tus seres queridos
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
});