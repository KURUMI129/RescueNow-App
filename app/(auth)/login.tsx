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
import Animated, { FadeInDown } from "react-native-reanimated";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firestoreDb } from "@/lib/firebase";

import { AuthHeader } from "@/components/auth/auth-header";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  const t = getAppCopy(language as AppLanguage).auth.login;

  // Layout animations handled by react-native-reanimated

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

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
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setAuthError(language === "es" ? "Correo o contraseña incorrectos." : "Invalid email or password.");
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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
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

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
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
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {language === "es" ? "Correo Electrónico o Teléfono" : "Email Address"}
              </Text>
              
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={language === "es" ? "ejemplo@correo.com" : t.emailPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                />
              </View>

              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t.password}
              </Text>
              
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder={t.passwordPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                />
              </View>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
                style={styles.forgotPasswordButton}
              >
                <Text
                  style={[styles.forgotPasswordText, { color: colors.textSecondary }]}
                >
                  {t.forgot}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                disabled={isSubmitting}
                onPress={() => {
                  void handleLogin();
                }}
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                  { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
                ]}
              >
                <Text
                  style={[styles.submitButtonText, { color: '#000000' }]}
                >
                  {t.submit}
                </Text>
              </TouchableOpacity>

              <View style={styles.biometricRow}>
                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                <TouchableOpacity activeOpacity={0.6} style={[styles.biometricBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
  biometricBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }
});
