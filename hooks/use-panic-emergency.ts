import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";

import { getAppPreferences } from "@/constants/app-preferences";

type PanicCopy = {
  chooseTitle: string;
  chooseMessage: string;
  whatsappPick: string;
  smsPick: string;
  cancel: string;
  permissionTitle: string;
  permissionMessage: string;
  emergencyBody: (latitude: number, longitude: number) => string;
  channelErrorTitle: string;
  channelErrorMessage: string;
  sendErrorTitle: string;
  sendErrorMessage: string;
};

type UsePanicEmergencyParams = {
  copy: PanicCopy;
  reduceMotionEnabled: boolean;
  onSuccess?: () => void;
};

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

async function openWhatsApp(message: string, phone?: string) {
  const normalizedPhone = (phone ?? "").replace(/[^\d]/g, "");
  const whatsappUrl = normalizedPhone
    ? `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`
    : `whatsapp://send?text=${encodeURIComponent(message)}`;

  if (await Linking.canOpenURL(whatsappUrl)) {
    await Linking.openURL(whatsappUrl);
    return true;
  }

  return false;
}

async function openSms(message: string, phone?: string) {
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
}

function pickManualChannel(copy: PanicCopy) {
  return new Promise<"whatsapp" | "sms" | null>((resolve) => {
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
}

export function usePanicEmergency({
  copy,
  reduceMotionEnabled,
  onSuccess,
}: UsePanicEmergencyParams) {
  const [isLoading, setIsLoading] = useState(false);

  const triggerEmergency = useCallback(async () => {
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
        const selectedChannel = await pickManualChannel(copy);

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

      onSuccess?.();

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
  }, [copy, isLoading, onSuccess, reduceMotionEnabled]);

  return {
    isLoading,
    triggerEmergency,
  };
}
