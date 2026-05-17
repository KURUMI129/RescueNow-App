import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { getAppPreferences, subscribeToAppPreferences } from "@/constants/app-preferences";

export function ContactShortcut() {
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+52");

  useEffect(() => {
    void getAppPreferences().then((prefs) => {
      setName(prefs.trustedContactName);
      setPhone(prefs.trustedContactPhone);
      setCountryCode(prefs.trustedContactCountryCode);
    });
    return subscribeToAppPreferences((prefs) => {
      setName(prefs.trustedContactName);
      setPhone(prefs.trustedContactPhone);
      setCountryCode(prefs.trustedContactCountryCode);
    });
  }, []);

  if (!name || !phone) return null;

  const handleCall = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cleanPhone = phone.replace(/\s+/g, "");
    const fullNumber = cleanPhone.startsWith("+") ? cleanPhone : `${countryCode}${cleanPhone}`;
    try {
      // Skip canOpenURL - Android 11+ needs a <queries> entry for it to return
      // true, but openURL still works. Just try it.
      await Linking.openURL(`tel:${fullNumber}`);
    } catch {
      Alert.alert(
        "No se pudo llamar",
        `No hay app de teléfono disponible. Número: ${fullNumber}`,
      );
    }
  };

  return (
    <Pressable
      onPress={handleCall}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="call" size={16} color={colors.success} />
      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    maxWidth: 140,
  },
  pressed: { opacity: 0.7 },
  name: { fontSize: 12, fontWeight: "700", flex: 1 },
});
