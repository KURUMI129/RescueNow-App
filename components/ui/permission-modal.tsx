import { useActiveTheme } from "@/hooks/use-active-theme";
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

interface PermissionModalProps {
  visible: boolean;
  title: string;
  message: string;
  onApprove: () => void;
  onDecline: () => void;
  approveText?: string;
  declineText?: string;
}

export function PermissionModal({
  visible,
  title,
  message,
  onApprove,
  onDecline,
  approveText = "Entendido",
  declineText = "Ahora no",
}: PermissionModalProps) {
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const isLight = activeTheme === "light";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: isLight ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.7)" }]}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(0, 180, 216, 0.15)' }]}>
            <Ionicons name="notifications" size={32} color={colors.primary} />
          </View>
          
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={onApprove}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{approveText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.6}
            onPress={onDecline}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>{declineText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
