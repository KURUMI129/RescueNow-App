import { useEffect, useState } from "react";
import { StyleSheet, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

interface Contact {
  name: string;
  phone: string;
}

export function ContactShortcut() {
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const [trustedContact, setTrustedContact] = useState<Contact | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@rescuenow_trusted_contact").then((data) => {
      if (data) {
        const contact = JSON.parse(data) as Contact;
        setTrustedContact(contact);
      }
    });
  }, []);

  if (!trustedContact?.name) return null;

  const handleCall = async () => {
    if (!trustedContact.phone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const supported = await Linking.canOpenURL(`tel:${trustedContact.phone}`);
    if (supported) {
      await Linking.openURL(`tel:${trustedContact.phone}`);
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
      <Ionicons name="call" size={20} color={colors.success} />
      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
        {trustedContact.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
});