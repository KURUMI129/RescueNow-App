import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAppCopy } from "@/constants/app-copy";
import { HomeThemeColors } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { useAppLanguage } from "@/hooks/use-app-language";
import { usePanicEmergency } from "@/hooks/use-panic-emergency";

type PanicButtonProps = {
  colors: HomeThemeColors;
  onPress?: () => void;
};

const PANIC_RED = "#E11D48";

export function PanicButton({ colors, onPress }: PanicButtonProps) {
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const language = useAppLanguage();
  const copy = getAppCopy(language).panicButton;
  const { isLoading, triggerEmergency } = usePanicEmergency({
    copy,
    reduceMotionEnabled,
    onSuccess: onPress,
  });

  const confirmAndTriggerEmergency = () => {
    Alert.alert(copy.confirmTitle, copy.confirmMessage, [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.sendAlert,
        style: "destructive",
        onPress: () => {
          void triggerEmergency();
        },
      },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.a11yLabel}
        accessibilityHint={copy.a11yHint}
        onLongPress={confirmAndTriggerEmergency}
        delayLongPress={550}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: PANIC_RED,
            opacity: pressed || isLoading ? 0.82 : 1,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name="bullhorn" size={42} color="#FFFFFF" />
        )}
        <Text style={styles.buttonTitle}>
          {isLoading ? copy.sending : copy.panic}
        </Text>
      </Pressable>

      <Text style={[styles.hintText, { color: colors.textSecondary }]}>
        {copy.holdHint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
  },
  button: {
    width: 154,
    height: 154,
    borderRadius: 77,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#333333",
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 11,
  },
  buttonTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.1,
    marginTop: 8,
  },
  hintText: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
