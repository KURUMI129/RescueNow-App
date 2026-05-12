import { useActiveTheme } from "@/hooks/use-active-theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as LocalAuthentication from "expo-local-authentication";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firestoreDb } from "@/lib/firebase";

import { AuthHeader } from "@/components/auth/auth-header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAppCopy } from "@/constants/app-copy";
import {
  AppLanguage,
  updateAppPreferences,
} from "@/constants/app-preferences";
import { AUTH_THEME_COLORS } from "@/constants/auth-theme";
import { useAppLanguage } from "@/hooks/use-app-language";

export default function LoginScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = AUTH_THEME_COLORS[activeTheme];
  const language = useAppLanguage();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  const t = getAppCopy(language as AppLanguage).auth.login;

  // Biometric login — uses device fingerprint/face and checks for Firebase cached session
  const handleBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setAuthError(language === "es" ? "Tu dispositivo no soporta autenticación biométrica." : "Your device doesn't support biometric authentication.");
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setAuthError(language === "es" ? "No tienes huellas/rostro configurado en tu dispositivo." : "No biometrics enrolled on your device.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: language === "es" ? "Inicia sesión con biometría" : "Sign in with biometrics",
        cancelLabel: language === "es" ? "Cancelar" : "Cancel",
        fallbackLabel: language === "es" ? "Usar contraseña" : "Use password",
      });

      if (result.success) {
        // Check if Firebase has a cached user (from a previous login)
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
          router.replace("/(tabs)");
        } else {
          setAuthError(language === "es"
            ? "Biometría exitosa pero necesitas iniciar sesión por primera vez con correo y contraseña."
            : "Biometric verified but you need to sign in with email first.");
        }
      }
    } catch (e) {
      console.warn("[Biometric] Error:", e);
      setAuthError(language === "es" ? "Error al verificar biometría." : "Biometric verification error.");
    }
  };

  const handleLogin = async () => {
    // Field-level validation
    if (!email.trim() && !password.trim()) {
      setAuthError(language === "es" ? "Ingresa tu correo y contraseña." : "Enter your email and password.");
      return;
    }
    if (!email.trim()) {
      setAuthError(language === "es" ? "Ingresa tu correo electrónico." : "Enter your email address.");
      return;
    }
    if (!password.trim()) {
      setAuthError(language === "es" ? "Ingresa tu contraseña." : "Enter your password.");
      return;
    }

    setIsSubmitting(true);
    setAuthError("");

    try {
      const credentials = await signInWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password,
      );

      // Sync Firestore profile → local preferences
      try {
        const userDoc = await getDoc(doc(firestoreDb, "users", credentials.user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          await updateAppPreferences({
            subscriptionPlan: data.subscriptionPlan === "premium" ? "premium" : "free",
            accountRole: data.role === "technician" ? "technician" : "user",
            language: data.language === "en" ? "en" : "es",
            trustedContactPhone: data.trustedContactPhone ?? "",
            trustedContactName: data.trustedContactName ?? "",
          });
        }
      } catch {
        // Offline — local preferences remain as fallback
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      const code = error?.code ?? "";
      if (code === "auth/user-not-found") {
        setAuthError(language === "es"
          ? "No existe una cuenta con este correo. ¿Deseas registrarte?"
          : "No account found with this email. Want to register?");
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setAuthError(language === "es" ? "Correo o contraseña incorrectos." : "Invalid email or password.");
      } else if (code === "auth/invalid-email") {
        setAuthError(language === "es" ? "El formato del correo no es válido." : "The email format is not valid.");
      } else if (code === "auth/too-many-requests") {
        setAuthError(language === "es" ? "Demasiados intentos. Intenta más tarde." : "Too many attempts. Try later.");
      } else if (code === "auth/network-request-failed") {
        setAuthError(language === "es" ? "Sin conexión a internet." : "No internet connection.");
      } else {
        setAuthError(language === "es" ? "Error al iniciar sesión." : "Login error.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <LinearGradient 
        colors={colors.gradientBg} 
        style={StyleSheet.absoluteFillObject} 
      />
      <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flexContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader colors={colors} />

          <BlurView
            intensity={activeTheme === "dark" ? 40 : 80}
            tint={activeTheme}
            style={[
              styles.card,
              {
                backgroundColor: 'transparent',
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {language === "es" ? "Inicia Sesión" : "Sign In"}
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
              >
                {t.sectionSubtitle}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Input
                label={language === "es" ? "Correo Electrónico o Teléfono" : "Email Address"}
                placeholder={language === "es" ? "ejemplo@correo.com" : t.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
                icon="email-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label={t.password}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChangeText={setPassword}
                icon="lock-outline"
                variant="password"
              />

              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
                style={styles.forgotPasswordButton}
              >
                <Text
                  style={[styles.forgotPasswordText, { color: colors.accent }]}
                >
                  {t.forgot}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Button
                title={t.submit}
                onPress={() => {
                  void handleLogin();
                }}
                loading={isSubmitting}
                disabled={isSubmitting}
                variant="primary"
                size="lg"
                style={StyleSheet.flatten([
                  styles.submitButton,
                  { shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
                ])}
              />

              <View style={styles.biometricRow}>
                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                <TouchableOpacity activeOpacity={0.6} style={[styles.biometricBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={() => void handleBiometric()}>
                  <MaterialCommunityIcons name="fingerprint" size={26} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
              </View>

              {authError ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {authError}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
                style={styles.registerButton}
              >
                <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                  {language === "es" ? "¿Nuevo en RescueNow?" : "New to RescueNow?"} <Text style={{ color: colors.primary, fontWeight: "700" }}>{t.register}</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flexContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingVertical: 20, justifyContent: "center" },
  card: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 0,
  },
  sectionTitle: { fontSize: 28, fontWeight: "900", letterSpacing: 0.5 },
  sectionSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 24 },
  label: { fontWeight: "800", fontSize: 13, marginTop: 16, marginBottom: 10, letterSpacing: 0.3 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: { marginRight: 12 },
  modernInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 14,
  },
  submitButton: { marginTop: 28, borderRadius: 18, paddingVertical: 18, alignItems: "center" },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  forgotPasswordButton: { marginTop: 14, alignSelf: "flex-end", paddingVertical: 4 },
  forgotPasswordText: { fontSize: 13, fontWeight: "600" },
  errorText: { marginTop: 16, fontSize: 13, fontWeight: "700", textAlign: "center" },
  registerButton: { marginTop: 8, alignItems: "center", paddingVertical: 14 },
  registerText: { fontSize: 14, fontWeight: "500" },
  biometricRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24, gap: 16 },
  divider: { height: 1, flex: 1 },
  biometricBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  eyeBtn: { padding: 4 },
});
