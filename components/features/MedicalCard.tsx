import { memo, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useAppLanguage } from "@/hooks/use-app-language";
import { getAppPreferences } from "@/constants/app-preferences";
import { formatPhoneNumber } from "@/constants/app-preferences";

interface MedicalCardProps {
  visible: boolean;
  onClose: () => void;
}

type MedicalData = {
  bloodType: string;
  allergies: string;
  conditions: string;
  contactName: string;
  contactPhoneFormatted: string;
};

const EMPTY_DATA: MedicalData = {
  bloodType: "",
  allergies: "",
  conditions: "",
  contactName: "",
  contactPhoneFormatted: "",
};

function MedicalCardComponent({ visible, onClose }: MedicalCardProps) {
  const language = useAppLanguage();
  const [data, setData] = useState<MedicalData>(EMPTY_DATA);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const prefs = await getAppPreferences();
      if (cancelled) return;
      setData({
        bloodType: prefs.bloodType,
        allergies: prefs.allergies,
        conditions: prefs.medicalConditions,
        contactName: prefs.trustedContactName,
        contactPhoneFormatted: formatPhoneNumber(
          prefs.trustedContactCountryCode,
          prefs.trustedContactPhone,
        ),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const t = language === "es"
    ? {
        title: "FICHA MÉDICA",
        subtitle: "Información de emergencia",
        bloodType: "TIPO DE SANGRE",
        allergies: "ALERGIAS",
        conditions: "CONDICIONES MÉDICAS",
        contact: "CONTACTO DE EMERGENCIA",
        unspecified: "No especificado",
        unregistered: "No registrado",
        close: "Cerrar",
        disclaimer:
          "Esta información puede consultarse SIN INTERNET. Muestra esta pantalla a los rescatistas en caso de emergencia.",
      }
    : {
        title: "MEDICAL ID",
        subtitle: "Emergency information",
        bloodType: "BLOOD TYPE",
        allergies: "ALLERGIES",
        conditions: "MEDICAL CONDITIONS",
        contact: "EMERGENCY CONTACT",
        unspecified: "Not specified",
        unregistered: "Not registered",
        close: "Close",
        disclaimer:
          "This information works OFFLINE. Show this screen to rescuers in case of emergency.",
      };

  const display = (value: string, fallback: string) =>
    value.trim().length > 0 ? value : fallback;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.springify()} style={styles.card}>
          {/* Top red banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <MaterialCommunityIcons name="medical-bag" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.field}>
              <Text style={styles.label}>{t.bloodType}</Text>
              <Text style={styles.bloodValue}>
                {display(data.bloodType, t.unspecified)}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t.allergies}</Text>
              <Text style={styles.value}>
                {display(data.allergies, t.unspecified)}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t.conditions}</Text>
              <Text style={styles.value}>
                {display(data.conditions, t.unspecified)}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t.contact}</Text>
              <Text style={styles.value}>
                {data.contactName.trim().length > 0
                  ? `${data.contactName} – ${data.contactPhoneFormatted}`
                  : t.unregistered}
              </Text>
            </View>

            <View style={styles.disclaimerBox}>
              <Ionicons name="information-circle" size={16} color="#FBBF24" />
              <Text style={styles.disclaimerText}>{t.disclaimer}</Text>
            </View>
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t.close}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
            <Text style={styles.closeText}>{t.close}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "85%",
  },
  banner: {
    backgroundColor: "#DC2626",
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  bannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
  },
  body: {
    padding: 20,
    gap: 4,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  value: {
    color: "#F1F5F9",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  bloodValue: {
    color: "#F87171",
    fontSize: 32,
    fontWeight: "900",
  },
  disclaimerBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#FBBF24",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "flex-start",
  },
  disclaimerText: {
    color: "#FBBF24",
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    paddingVertical: 16,
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export const MedicalCard = memo(MedicalCardComponent);
