import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAppCopy } from "@/constants/app-copy";
import { AppLanguage, getAppPreferences } from "@/constants/app-preferences";
import { HomeThemeColors } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { useAppLanguage } from "@/hooks/use-app-language";

type PanicButtonProps = {
  colors: HomeThemeColors;
  onPress?: () => void;
};

const PANIC_RED = "#DC2626";

async function getEmergencyCoordinates() {
  try {
    const currentPosition = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return currentPosition.coords;
  } catch {
    const lastKnownPosition = await Location.getLastKnownPositionAsync();

    if (lastKnownPosition) {
      return lastKnownPosition.coords;
    }

    throw new Error("location-unavailable");
  }
}

export function PanicButton({ colors, onPress }: PanicButtonProps) {
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const language = useAppLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const copy = getAppCopy(language as AppLanguage).panicButton;

  const openWhatsApp = async (message: string, phone?: string) => {
    const normalizedPhone = (phone ?? "").replace(/[^\d]/g, "");
    const whatsappUrl = normalizedPhone
      ? `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;

    if (await Linking.canOpenURL(whatsappUrl)) {
      await Linking.openURL(whatsappUrl);
      return true;
    }

    return false;
  };

  const openSms = async (message: string, phone?: string) => {
    const normalizedPhone = (phone ?? "").replace(/[^\d+]/g, "");
    const smsBase = normalizedPhone ? `sms:${normalizedPhone}` : "sms:";

    const smsUrlAndroid = `${smsBase}?body=${encodeURIComponent(message)}`;
    const smsUrliOS = `${smsBase}&body=${encodeURIComponent(message)}`;
    const smsUrlLegacy = `${smsBase};body=${encodeURIComponent(message)}`;

    const smsCandidates = [smsUrlAndroid, smsUrliOS, smsUrlLegacy];

    for (const candidate of smsCandidates) {
      if (await Linking.canOpenURL(candidate)) {
        await Linking.openURL(candidate);
        return true;
      }
    }

    return false;
  };

  const pickManualChannel = () =>
    new Promise<"whatsapp" | "sms" | null>((resolve) => {
      Alert.alert(copy.chooseTitle, copy.chooseMessage, [
        {
          text: copy.whatsappPick,
          onPress: () => resolve("whatsapp"),
        },
        {
          text: copy.smsPick,
          onPress: () => resolve("sms"),
        },
        {
          text: copy.cancel,
          style: "cancel",
          onPress: () => resolve(null),
        },
      ]);
    });

  const triggerEmergency = async () => {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      if (!reduceMotionEnabled) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      }

      const appPreferences = await getAppPreferences();

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(copy.permissionTitle, copy.permissionMessage);
        return;
      }

      const { latitude, longitude } = await getEmergencyCoordinates();
      const message = copy.emergencyBody(latitude, longitude);
      const hasTrustedContact =
        appPreferences.useTrustedContact &&
        appPreferences.trustedContactPhone.length >= 7;

      let didOpenChannel = false;
      if (hasTrustedContact) {
        didOpenChannel = await openWhatsApp(
          message,
          appPreferences.trustedContactPhone,
        );

        if (!didOpenChannel) {
          didOpenChannel = await openSms(
            message,
            appPreferences.trustedContactPhone,
          );
        }
      } else {
        const selectedChannel = await pickManualChannel();

        if (!selectedChannel) {
          return;
        }

        didOpenChannel =
          selectedChannel === "whatsapp"
            ? await openWhatsApp(message)
            : await openSms(message);
      }

      if (!didOpenChannel) {
        Alert.alert(copy.channelErrorTitle, copy.channelErrorMessage);
        if (!reduceMotionEnabled) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
        }
        return;
      }

      onPress?.();

      if (!reduceMotionEnabled) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch {
      Alert.alert(copy.sendErrorTitle, copy.sendErrorMessage);
      if (!reduceMotionEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <MaterialCommunityIcons name="bullhorn" size={42} color="#fff" />
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
    shadowColor: "#7F1D1D",
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 11,
  },
  buttonTitle: {
    color: "#fff",
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
