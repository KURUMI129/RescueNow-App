import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  AppState,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { get911VoiceScript, sendEmergencyMessage } from "@/lib/emergency-service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CallPhase = "dialing" | "ringing" | "connected" | "speaking" | "operator_response" | "ended";
type MessageStatus = "pending" | "sending" | "sent_whatsapp" | "sent_sms" | "no_contact" | "failed";

export default function EmergencyCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    userName?: string;
    latitude?: string;
    longitude?: string;
    bloodType?: string;
    allergies?: string;
    medicalConditions?: string;
    contactPhone?: string;
    contactName?: string;
  }>();

  const [phase, setPhase] = useState<CallPhase>("dialing");
  const [callDuration, setCallDuration] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [currentDialogue, setCurrentDialogue] = useState("");
  const [messageStatus, setMessageStatus] = useState<MessageStatus>("pending");
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // Track when user returns from SMS/WhatsApp app
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        messageStatus === "sending"
      ) {
        // User returned from the messaging app — mark as sent
        setMessageStatus("sent_sms");
        console.log("[911 Call] User returned from messaging app");
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [messageStatus]);

  // Pulsing animations
  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      ),
      -1,
      false,
    );
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Sound wave animation when speaking
  useEffect(() => {
    if (phase === "speaking" || phase === "operator_response") {
      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
        ),
        -1,
        false,
      );
    } else {
      waveOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [phase, waveOpacity]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
  }));

  // Call duration timer
  useEffect(() => {
    if (phase === "connected" || phase === "speaking" || phase === "operator_response") {
      if (!callTimerRef.current) {
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    }
    if (phase === "ended" && callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, [phase]);

  // Safe speech helper
  const safeSpeakAsync = useCallback((text: string, options?: { rate?: number; pitch?: number; maxWaitMs?: number }): Promise<void> => {
    return new Promise((resolve) => {
      const rate = options?.rate ?? 0.9;
      const pitch = options?.pitch ?? 1.0;
      const estimatedDuration = Math.max(5000, (text.length / 12) * 1000 + 3000);
      const maxWait = options?.maxWaitMs ?? estimatedDuration;

      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      const fallbackTimer = setTimeout(done, maxWait);

      try {
        Speech.speak(text, {
          language: "es-MX",
          rate,
          pitch,
          onDone: () => {
            clearTimeout(fallbackTimer);
            done();
          },
          onError: () => {
            clearTimeout(fallbackTimer);
            done();
          },
        });
      } catch (e) {
        console.warn("[911 Call] Speech.speak failed:", e);
        clearTimeout(fallbackTimer);
        done();
      }
    });
  }, []);

  // ====== SEND EMERGENCY MESSAGE (fires during dialing phase) ======
  const sendMessageAsync = useCallback(async () => {
    const phone = params.contactPhone;
    const name = params.contactName ?? "";

    if (!phone || phone.length < 7) {
      setMessageStatus("no_contact");
      console.warn("[911 Call] No trusted contact — skipping message");
      return;
    }

    setMessageStatus("sending");
    console.log("[911 Call] Sending emergency message to:", phone);

    try {
      const result = await sendEmergencyMessage(
        phone,
        name,
        {
          latitude: parseFloat(params.latitude ?? "0"),
          longitude: parseFloat(params.longitude ?? "0"),
        },
        params.userName ?? "Paciente",
      );

      if (result.success) {
        setMessageStatus(result.method === "whatsapp" ? "sent_whatsapp" : "sent_sms");
        console.log(`[911 Call] Message sent via ${result.method}`);
      } else {
        setMessageStatus("failed");
      }
    } catch (e) {
      console.error("[911 Call] Message send error:", e);
      setMessageStatus("failed");
    }
  }, [params]);

  // Helper: wait for the app to return to foreground
  const waitForForeground = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      // If already in foreground, resolve immediately
      if (AppState.currentState === "active") {
        resolve();
        return;
      }
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          sub.remove();
          resolve();
        }
      });
      // Safety timeout — don't wait forever (30 seconds max)
      setTimeout(() => {
        sub.remove();
        resolve();
      }, 30000);
    });
  }, []);

  // Store callbacks in refs so the simulation effect doesn't re-run
  const sendMessageRef = useRef(sendMessageAsync);
  sendMessageRef.current = sendMessageAsync;
  const safeSpeakRef = useRef(safeSpeakAsync);
  safeSpeakRef.current = safeSpeakAsync;
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // ====== MAIN CALL SIMULATION FLOW ======
  // Runs exactly ONCE on mount — never cancelled by re-renders
  useEffect(() => {
    if (callStartedRef.current) return;
    callStartedRef.current = true;

    let cancelled = false;

    const runCallSimulation = async () => {
      const p = paramsRef.current;

      // ------- PHASE 1: DIALING -------
      setPhase("dialing");
      setCurrentDialogue("");

      // Fire emergency message in background (non-blocking)
      // This opens SMS/WhatsApp but we don't wait for it
      void sendMessageRef.current();

      // Dialing tone duration
      await delay(3500);
      if (cancelled) return;

      // ------- PHASE 2: RINGING -------
      setPhase("ringing");
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await delay(2500);
      if (cancelled) return;

      // ------- PHASE 3: OPERATOR ANSWERS -------
      setPhase("connected");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const operatorGreeting = "Nueve uno uno, ¿cuál es su emergencia?";
      setCurrentDialogue(`📞 Operadora: "${operatorGreeting}"`);
      await safeSpeakRef.current(operatorGreeting, { rate: 0.9, pitch: 1.1 });
      if (cancelled) return;

      // ------- PHASE 4: WAIT FOR USER (5 seconds) -------
      setIsUserSpeaking(true);
      setCurrentDialogue("🎙️ Esperando respuesta del paciente...\n\nEl paciente no responde. RescueNow tomará la llamada.");
      await delay(5000);
      if (cancelled) return;

      // User didn't respond — system takes over
      setIsUserSpeaking(false);
      setPhase("speaking");

      // ------- PHASE 5: RESCUENOW AUTO-SPEAKS PATIENT INFO -------
      const script = get911VoiceScript(
        p.userName ?? "Paciente",
        {
          latitude: parseFloat(p.latitude ?? "0"),
          longitude: parseFloat(p.longitude ?? "0"),
        },
        {
          bloodType: p.bloodType ?? "",
          allergies: p.allergies ?? "",
          medicalConditions: p.medicalConditions ?? "",
        },
      );
      setCurrentDialogue(`🤖 RescueNow:\n"${script}"`);
      await safeSpeakRef.current(script, { rate: 0.85, pitch: 0.95 });
      if (cancelled) return;

      // ------- PHASE 6: OPERATOR CONFIRMS AMBULANCE -------
      setPhase("operator_response");
      await delay(1000);
      if (cancelled) return;

      const operatorResponse = "Entendido. Estamos enviando una ambulancia a su ubicación. Por favor mantengan la calma y no muevan al paciente. La ayuda va en camino.";
      setCurrentDialogue(`📞 Operadora:\n"${operatorResponse}"`);
      await safeSpeakRef.current(operatorResponse, { rate: 0.9, pitch: 1.1 });
      if (cancelled) return;

      // ------- PHASE 7: CALL ENDED → SHOW MEDICAL CARD -------
      setPhase("ended");
      setCurrentDialogue("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    runCallSimulation();

    return () => {
      cancelled = true;
      Speech.stop();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHangUp = () => {
    Speech.stop();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    router.back();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    switch (phase) {
      case "dialing": return "Marcando...";
      case "ringing": return "Llamando...";
      case "connected": return isUserSpeaking ? "Esperando respuesta..." : "Conectado – Operadora hablando";
      case "speaking": return "RescueNow informando al 911...";
      case "operator_response": return "Operadora respondiendo...";
      case "ended": return "🚑 Ambulancia en camino";
      default: return "";
    }
  };

  const getMessageStatusUI = () => {
    switch (messageStatus) {
      case "pending": return null;
      case "sending": return { icon: "paper-plane" as const, text: "Enviando mensaje...", color: "#F59E0B" };
      case "sent_whatsapp": return { icon: "checkmark-circle" as const, text: "✓ WhatsApp enviado", color: "#25D366" };
      case "sent_sms": return { icon: "checkmark-circle" as const, text: "✓ SMS enviado", color: "#10B981" };
      case "no_contact": return { icon: "alert-circle" as const, text: "Sin contacto configurado", color: "#6B7280" };
      case "failed": return { icon: "close-circle" as const, text: "No se pudo enviar", color: "#EF4444" };
    }
  };

  // ====== MEDICAL CARD (shown after call ends) ======
  if (phase === "ended") {
    const msgUI = getMessageStatusUI();
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
        <ScrollView contentContainerStyle={styles.medicalScrollContent}>
          <Animated.View entering={FadeInUp.springify()} style={styles.medicalHeader}>
            <View style={styles.ambulanceBadge}>
              <Text style={styles.ambulanceEmoji}>🚑</Text>
            </View>
            <Text style={styles.medicalHeaderTitle}>Ambulancia en camino</Text>
            <Text style={styles.medicalHeaderSub}>
              Llamada finalizada • {formatTime(callDuration)}
            </Text>

            {/* Message status badge */}
            {msgUI && (
              <View style={[styles.msgBadge, { backgroundColor: `${msgUI.color}15` }]}>
                <Ionicons name={msgUI.icon} size={16} color={msgUI.color} />
                <Text style={[styles.msgBadgeText, { color: msgUI.color }]}>{msgUI.text}</Text>
              </View>
            )}
          </Animated.View>

          {/* FICHA TÉCNICA DEL PACIENTE */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.medicalCard}>
            <View style={styles.medicalCardHeader}>
              <Ionicons name="medical" size={22} color="#FF3B30" />
              <Text style={styles.medicalCardTitle}>Ficha Médica del Paciente</Text>
            </View>

            <View style={styles.medicalDivider} />

            <View style={styles.medicalRow}>
              <View style={styles.medicalIconCircle}>
                <Ionicons name="person" size={18} color="#0EA5E9" />
              </View>
              <View style={styles.medicalRowContent}>
                <Text style={styles.medicalLabel}>Nombre</Text>
                <Text style={styles.medicalValue}>{params.userName || "No registrado"}</Text>
              </View>
            </View>

            <View style={styles.medicalRow}>
              <View style={[styles.medicalIconCircle, { backgroundColor: "rgba(225, 29, 72, 0.15)" }]}>
                <MaterialCommunityIcons name="blood-bag" size={18} color="#E11D48" />
              </View>
              <View style={styles.medicalRowContent}>
                <Text style={styles.medicalLabel}>Tipo de Sangre</Text>
                <Text style={[styles.medicalValue, styles.medicalHighlight]}>
                  {params.bloodType || "No registrado"}
                </Text>
              </View>
            </View>

            <View style={styles.medicalRow}>
              <View style={[styles.medicalIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                <Ionicons name="warning" size={18} color="#F59E0B" />
              </View>
              <View style={styles.medicalRowContent}>
                <Text style={styles.medicalLabel}>Alergias</Text>
                <Text style={styles.medicalValue}>
                  {params.allergies || "Ninguna registrada"}
                </Text>
              </View>
            </View>

            <View style={styles.medicalRow}>
              <View style={[styles.medicalIconCircle, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
                <MaterialCommunityIcons name="pill" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.medicalRowContent}>
                <Text style={styles.medicalLabel}>Condiciones Médicas</Text>
                <Text style={styles.medicalValue}>
                  {params.medicalConditions || "Ninguna registrada"}
                </Text>
              </View>
            </View>

            <View style={styles.medicalRow}>
              <View style={[styles.medicalIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                <Ionicons name="location" size={18} color="#10B981" />
              </View>
              <View style={styles.medicalRowContent}>
                <Text style={styles.medicalLabel}>Ubicación del accidente</Text>
                <Text style={styles.medicalValue}>
                  {params.latitude && params.longitude
                    ? `${parseFloat(params.latitude).toFixed(5)}, ${parseFloat(params.longitude).toFixed(5)}`
                    : "No disponible"}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Aviso para paramédicos */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.paramedicsNote}>
            <Ionicons name="information-circle" size={20} color="#0EA5E9" />
            <Text style={styles.paramedicsNoteText}>
              Esta información está disponible para los paramédicos y personal de emergencia que revise este dispositivo.
            </Text>
          </Animated.View>

          {/* Botón de cerrar */}
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <Pressable style={styles.closeBtn} onPress={handleHangUp}>
              <Ionicons name="home" size={20} color="#FFFFFF" />
              <Text style={styles.closeBtnText}>Volver al Inicio</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ====== CALL IN PROGRESS UI ======
  const msgUI = getMessageStatusUI();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

      <View style={styles.bgGradientTop} />
      <View style={styles.bgGradientBottom} />

      {/* Top section */}
      <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.topSection}>
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.securityText}>Llamada simulada</Text>
        </View>

        <Text style={styles.numberText}>911</Text>
        <Text style={styles.serviceText}>Emergencias</Text>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {(phase === "connected" || phase === "speaking" || phase === "operator_response") && (
          <Text style={styles.durationText}>{formatTime(callDuration)}</Text>
        )}

        {/* Live message status indicator */}
        {msgUI && (
          <View style={[styles.msgBadgeInline, { borderColor: `${msgUI.color}30` }]}>
            <Ionicons name={msgUI.icon} size={14} color={msgUI.color} />
            <Text style={[styles.msgBadgeInlineText, { color: msgUI.color }]}>{msgUI.text}</Text>
          </View>
        )}
      </Animated.View>

      {/* Center section */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.centerSection}>
        <Animated.View style={[styles.avatarPulse, pulseStyle]}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons
              name={phase === "speaking" ? "robot" : "headset"}
              size={48}
              color="#FFFFFF"
            />
          </View>
        </Animated.View>

        {/* Audio wave indicator */}
        {(phase === "speaking" || phase === "operator_response") && (
          <Animated.View style={[styles.waveContainer, waveStyle]}>
            {[...Array(7)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: 8 + Math.random() * 28,
                    backgroundColor: phase === "speaking" ? "#0EA5E9" : "#10B981",
                  },
                ]}
              />
            ))}
          </Animated.View>
        )}

        {/* User speaking indicator */}
        {isUserSpeaking && (
          <Animated.View entering={FadeIn} style={styles.listeningBadge}>
            <Ionicons name="mic" size={20} color="#E11D48" />
            <Text style={styles.listeningText}>Esperando respuesta del paciente...</Text>
          </Animated.View>
        )}

        {/* Live dialogue display */}
        {currentDialogue !== "" && (phase === "connected" || phase === "speaking" || phase === "operator_response") && (
          <Animated.View entering={FadeIn} style={styles.dialogueBox}>
            <Text style={styles.dialogueText} numberOfLines={8}>{currentDialogue}</Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Bottom controls */}
      <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.bottomSection}>
        <View style={styles.actionRow}>
          <View style={styles.actionBtn}>
            <View style={[styles.actionCircle, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
              <Ionicons name="mic-off" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>Silenciar</Text>
          </View>

          <View style={styles.actionBtn}>
            <View style={[styles.actionCircle, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
              <Ionicons name="keypad" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>Teclado</Text>
          </View>

          <View style={styles.actionBtn}>
            <View style={[styles.actionCircle, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
              <Ionicons name="volume-high" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>Altavoz</Text>
          </View>
        </View>

        <Pressable style={styles.hangUpBtn} onPress={handleHangUp}>
          <Ionicons name="call" size={32} color="#FFFFFF" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>

        <Text style={styles.hangUpLabel}>Colgar</Text>
      </Animated.View>
    </View>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a",
  },
  bgGradientTop: {
    position: "absolute",
    top: 0,
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: "rgba(14, 165, 233, 0.05)",
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  bgGradientBottom: {
    position: "absolute",
    bottom: 0,
    width: SCREEN_WIDTH,
    height: 200,
    backgroundColor: "rgba(225, 29, 72, 0.03)",
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
  },
  topSection: {
    alignItems: "center",
    paddingTop: 80,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  securityText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  numberText: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 8,
  },
  serviceText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  statusText: {
    color: "#0EA5E9",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  durationText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  msgBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  msgBadgeInlineText: {
    fontSize: 12,
    fontWeight: "700",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(14, 165, 233, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 24,
    height: 40,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  listeningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(225, 29, 72, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 20,
  },
  listeningText: {
    color: "#E11D48",
    fontSize: 14,
    fontWeight: "700",
  },
  dialogueBox: {
    marginTop: 20,
    marginHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    maxWidth: SCREEN_WIDTH - 48,
  },
  dialogueText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
  },
  bottomSection: {
    alignItems: "center",
    paddingBottom: 60,
  },
  actionRow: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 40,
  },
  actionBtn: {
    alignItems: "center",
    gap: 8,
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  hangUpBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E11D48",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  hangUpLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },

  // ====== MEDICAL CARD STYLES ======
  medicalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    paddingBottom: 100,
  },
  medicalHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  ambulanceBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  ambulanceEmoji: {
    fontSize: 40,
  },
  medicalHeaderTitle: {
    color: "#10B981",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  medicalHeaderSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  msgBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  msgBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  medicalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  medicalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  medicalCardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  medicalDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  medicalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  medicalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  medicalRowContent: {
    flex: 1,
  },
  medicalLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  medicalValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  medicalHighlight: {
    color: "#E11D48",
    fontSize: 20,
    fontWeight: "900",
  },
  paramedicsNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.15)",
  },
  paramedicsNoteText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
