import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Modal,
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
  onEmergencyTypeSelect?: (type: "accident" | "mechanical" | "fuel") => void;
};

const APP_BG = "#121212";
const SURFACE_BG = "#1E1E1E";
const AMBER = "#EAB308";
const ALERT_RED = "#DC2626";
const TEXT_PRIMARY = "#F5F5F5";
const TEXT_SECONDARY = "#BFBFBF";
const COUNTDOWN_SECONDS = 10;

export function PanicButton({
  colors,
  onPress,
  onEmergencyTypeSelect,
}: PanicButtonProps) {
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const language = useAppLanguage();
  const copy = getAppCopy(language).panicButton;
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCrashModalVisible, setIsCrashModalVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [autoDispatchTriggered, setAutoDispatchTriggered] = useState(false);
  const blinkAnim = useRef(new Animated.Value(0)).current;

  const { isLoading, triggerEmergency } = usePanicEmergency({
    copy,
    reduceMotionEnabled,
    onSuccess: onPress,
  });

  const titleCopy = useMemo(
    () =>
      language === "es"
        ? {
            panic: "Pánico Vial",
            panicHint: "Activa tu menú SOS de emergencia vial",
            panelTitle: "Selecciona tu emergencia",
            panelSubtitle: "RescueNow te conecta con ayuda inmediata.",
            accidentTitle: "Tuve un Accidente",
            accidentSubtitle: "Llamar 911 y enviar SOS con ubicación",
            mechanicalTitle: "Falla Mecánica",
            mechanicalSubtitle: "Buscar grúa o mecánico cercano",
            fuelTitle: "Sin Gasolina",
            fuelSubtitle: "Buscar gasolinera cercana",
            close: "Cerrar",
            sensor: "Simular Choque (Sensor)",
            crashDetected: "POSIBLE ACCIDENTE DETECTADO",
            crashSubtitle:
              "Si no cancelas, enviaremos alerta SOS automática con ubicación.",
            cancelSafe: "Estoy Bien (Cancelar)",
            autoSending: "Enviando alerta automática...",
            dispatchTitle: "¿Qué deseas hacer ahora?",
            dispatchMessage:
              "Puedes enviar SOS a contactos y/o abrir llamada al 911.",
            sendSos: "Enviar SOS",
            call911: "Llamar 911",
            mapMechanicalTitle: "Búsqueda de asistencia",
            mapMechanicalMessage:
              "Mostrando opción para grúa o mecánico en el mapa.",
            mapFuelTitle: "Búsqueda de gasolinera",
            mapFuelMessage: "Mostrando gasolineras cercanas en el mapa.",
            dialErrorTitle: "No se pudo abrir el teléfono",
            dialErrorMessage: "Marca manualmente al 911 desde tu dispositivo.",
          }
        : {
            panic: "Roadside Panic",
            panicHint: "Open SOS emergency menu",
            panelTitle: "Choose your emergency",
            panelSubtitle: "RescueNow connects you with immediate help.",
            accidentTitle: "I Had an Accident",
            accidentSubtitle: "Call 911 and send SOS with location",
            mechanicalTitle: "Mechanical Failure",
            mechanicalSubtitle: "Find nearby tow or mechanic",
            fuelTitle: "Out of Gas",
            fuelSubtitle: "Find nearby gas station",
            close: "Close",
            sensor: "Simulate Crash (Sensor)",
            crashDetected: "POSSIBLE ACCIDENT DETECTED",
            crashSubtitle:
              "If you do not cancel, we will send an automatic SOS with your location.",
            cancelSafe: "I am Safe (Cancel)",
            autoSending: "Sending automatic alert...",
            dispatchTitle: "What do you want to do now?",
            dispatchMessage:
              "You can send SOS to contacts and/or open a 911 call.",
            sendSos: "Send SOS",
            call911: "Call 911",
            mapMechanicalTitle: "Assistance search",
            mapMechanicalMessage: "Showing tow/mechanic options on map.",
            mapFuelTitle: "Gas station search",
            mapFuelMessage: "Showing nearby gas stations on map.",
            dialErrorTitle: "Could not open phone app",
            dialErrorMessage: "Please dial 911 manually from your device.",
          },
    [language],
  );

  const openDial911 = useCallback(async () => {
    const dialUrl = "tel:911";

    try {
      if (await Linking.canOpenURL(dialUrl)) {
        await Linking.openURL(dialUrl);
        return;
      }
    } catch {
      // Handled below with user-facing alert.
    }

    Alert.alert(titleCopy.dialErrorTitle, titleCopy.dialErrorMessage);
  }, [titleCopy.dialErrorMessage, titleCopy.dialErrorTitle]);

  const confirmAccidentActions = useCallback(() => {
    Alert.alert(copy.confirmTitle, copy.confirmMessage, [
      { text: copy.cancel, style: "cancel" },
      {
        text: titleCopy.sendSos,
        style: "destructive",
        onPress: () => {
          void triggerEmergency();
        },
      },
      {
        text: titleCopy.call911,
        onPress: () => {
          void openDial911();
        },
      },
    ]);
  }, [
    copy.cancel,
    copy.confirmMessage,
    copy.confirmTitle,
    openDial911,
    titleCopy.call911,
    titleCopy.sendSos,
    triggerEmergency,
  ]);

  const triggerAccidentEmergency = useCallback(() => {
    onEmergencyTypeSelect?.("accident");
    setIsMenuVisible(false);

    Alert.alert(titleCopy.dispatchTitle, titleCopy.dispatchMessage, [
      {
        text: copy.cancel,
        style: "cancel",
      },
      {
        text: titleCopy.sendSos,
        style: "destructive",
        onPress: () => {
          confirmAccidentActions();
        },
      },
      {
        text: titleCopy.call911,
        onPress: () => {
          void openDial911();
        },
      },
    ]);
  }, [
    confirmAccidentActions,
    copy.cancel,
    onEmergencyTypeSelect,
    openDial911,
    titleCopy.call911,
    titleCopy.dispatchMessage,
    titleCopy.dispatchTitle,
    titleCopy.sendSos,
  ]);

  const triggerMechanicalFlow = useCallback(() => {
    onEmergencyTypeSelect?.("mechanical");
    setIsMenuVisible(false);
    Alert.alert(titleCopy.mapMechanicalTitle, titleCopy.mapMechanicalMessage);
  }, [
    onEmergencyTypeSelect,
    titleCopy.mapMechanicalMessage,
    titleCopy.mapMechanicalTitle,
  ]);

  const triggerFuelFlow = useCallback(() => {
    onEmergencyTypeSelect?.("fuel");
    setIsMenuVisible(false);
    Alert.alert(titleCopy.mapFuelTitle, titleCopy.mapFuelMessage);
  }, [onEmergencyTypeSelect, titleCopy.mapFuelMessage, titleCopy.mapFuelTitle]);

  const startCrashSimulation = useCallback(() => {
    setSecondsLeft(COUNTDOWN_SECONDS);
    setAutoDispatchTriggered(false);
    setIsCrashModalVisible(true);
  }, []);

  const cancelCrashSimulation = useCallback(() => {
    setIsCrashModalVisible(false);
    setAutoDispatchTriggered(false);
    setSecondsLeft(COUNTDOWN_SECONDS);
  }, []);

  const triggerAutomaticCrashEmergency = useCallback(async () => {
    onEmergencyTypeSelect?.("accident");
    setIsCrashModalVisible(false);
    Alert.alert(titleCopy.autoSending);
    await triggerEmergency();
    await openDial911();
  }, [
    onEmergencyTypeSelect,
    openDial911,
    titleCopy.autoSending,
    triggerEmergency,
  ]);

  useEffect(() => {
    if (!isCrashModalVisible || autoDispatchTriggered) {
      return;
    }

    if (secondsLeft <= 0) {
      setAutoDispatchTriggered(true);
      void triggerAutomaticCrashEmergency();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [
    autoDispatchTriggered,
    isCrashModalVisible,
    secondsLeft,
    triggerAutomaticCrashEmergency,
  ]);

  useEffect(() => {
    if (!isCrashModalVisible) {
      blinkAnim.stopAnimation();
      blinkAnim.setValue(0);
      return;
    }

    if (reduceMotionEnabled) {
      blinkAnim.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      blinkAnim.stopAnimation();
      blinkAnim.setValue(0);
    };
  }, [blinkAnim, isCrashModalVisible, reduceMotionEnabled]);

  const crashOverlayColor = blinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(127, 29, 29, 0.86)", "rgba(220, 38, 38, 0.97)"],
  });

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={titleCopy.panic}
        accessibilityHint={titleCopy.panicHint}
        onPress={() => setIsMenuVisible(true)}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: ALERT_RED,
            opacity: pressed || isLoading ? 0.82 : 1,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name="car-emergency"
            size={46}
            color="#FFFFFF"
          />
        )}
        <Text style={styles.buttonTitle}>
          {isLoading ? copy.sending : titleCopy.panic}
        </Text>
      </Pressable>

      <Text
        style={[
          styles.hintText,
          { color: colors.textSecondary || TEXT_SECONDARY },
        ]}
      >
        {titleCopy.panicHint}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={titleCopy.sensor}
        style={({ pressed }) => [
          styles.sensorButton,
          pressed && styles.sensorButtonPressed,
        ]}
        onPress={startCrashSimulation}
      >
        <MaterialCommunityIcons name="radar" size={14} color={AMBER} />
        <Text style={styles.sensorButtonText}>{titleCopy.sensor}</Text>
      </Pressable>

      <Modal
        transparent
        visible={isMenuVisible}
        animationType="slide"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setIsMenuVisible(false)}
        >
          <View />
        </Pressable>

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{titleCopy.panelTitle}</Text>
          <Text style={styles.sheetSubtitle}>{titleCopy.panelSubtitle}</Text>

          <Pressable
            style={styles.optionCard}
            onPress={triggerAccidentEmergency}
          >
            <View style={[styles.optionIconWrap, styles.optionAccident]}>
              <MaterialCommunityIcons
                name="car-emergency"
                size={22}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>
                💥 {titleCopy.accidentTitle}
              </Text>
              <Text style={styles.optionSubtitle}>
                {titleCopy.accidentSubtitle}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={AMBER}
            />
          </Pressable>

          <Pressable style={styles.optionCard} onPress={triggerMechanicalFlow}>
            <View style={[styles.optionIconWrap, styles.optionMechanical]}>
              <MaterialCommunityIcons
                name="tow-truck"
                size={22}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>
                🚗 {titleCopy.mechanicalTitle}
              </Text>
              <Text style={styles.optionSubtitle}>
                {titleCopy.mechanicalSubtitle}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={AMBER}
            />
          </Pressable>

          <Pressable style={styles.optionCard} onPress={triggerFuelFlow}>
            <View style={[styles.optionIconWrap, styles.optionFuel]}>
              <MaterialCommunityIcons
                name="gas-station"
                size={22}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>⛽ {titleCopy.fuelTitle}</Text>
              <Text style={styles.optionSubtitle}>
                {titleCopy.fuelSubtitle}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={AMBER}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.sheetCloseButton,
              pressed && { opacity: 0.82 },
            ]}
            onPress={() => setIsMenuVisible(false)}
          >
            <Text style={styles.sheetCloseText}>{titleCopy.close}</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isCrashModalVisible}
        animationType="fade"
        onRequestClose={cancelCrashSimulation}
      >
        <Animated.View
          style={[styles.crashOverlay, { backgroundColor: crashOverlayColor }]}
        >
          <View style={styles.crashCard}>
            <MaterialCommunityIcons
              name="alert-octagon"
              size={34}
              color="#FEE2E2"
            />
            <Text style={styles.crashTitle}>{titleCopy.crashDetected}</Text>
            <Text style={styles.crashSubtitle}>{titleCopy.crashSubtitle}</Text>

            <View style={styles.counterBadge}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.counterText}>{secondsLeft}</Text>
              )}
            </View>

            <Pressable
              onPress={cancelCrashSimulation}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.cancelCrashButton,
                (pressed || isLoading) && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.cancelCrashText}>{titleCopy.cancelSafe}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
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
    borderWidth: 2,
    borderColor: "rgba(234, 179, 8, 0.45)",
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
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
  sensorButton: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SURFACE_BG,
    borderColor: "rgba(234, 179, 8, 0.4)",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sensorButtonPressed: {
    opacity: 0.85,
  },
  sensorButtonText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "700",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  sheetContainer: {
    backgroundColor: SURFACE_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.18)",
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#444444",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    color: TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  sheetSubtitle: {
    color: TEXT_SECONDARY,
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
    fontWeight: "600",
  },
  optionCard: {
    backgroundColor: APP_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.16)",
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  optionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  optionAccident: {
    backgroundColor: ALERT_RED,
  },
  optionMechanical: {
    backgroundColor: "#92400E",
  },
  optionFuel: {
    backgroundColor: "#0369A1",
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "800",
  },
  optionSubtitle: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  sheetCloseButton: {
    marginTop: 6,
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.4)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  sheetCloseText: {
    color: AMBER,
    fontWeight: "800",
    fontSize: 14,
  },
  crashOverlay: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  crashCard: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "rgba(32, 32, 32, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(254, 202, 202, 0.35)",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  crashTitle: {
    color: "#FEE2E2",
    marginTop: 10,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  crashSubtitle: {
    color: "#FCA5A5",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
  },
  counterBadge: {
    marginTop: 16,
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "rgba(254, 242, 242, 0.4)",
    backgroundColor: "rgba(220, 38, 38, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },
  cancelCrashButton: {
    marginTop: 18,
    backgroundColor: "#0F766E",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(204, 251, 241, 0.35)",
  },
  cancelCrashText: {
    color: "#ECFEFF",
    fontWeight: "800",
    fontSize: 14,
  },
});
