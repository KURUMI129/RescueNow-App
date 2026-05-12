import { useActiveTheme } from "@/hooks/use-active-theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
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

import { AuthHeader } from "@/components/auth/auth-header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAppCopy } from "@/constants/app-copy";
import { AppLanguage, updateAppPreferences } from "@/constants/app-preferences";
import { AUTH_THEME_COLORS } from "@/constants/auth-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { firebaseAuth, firestoreDb } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function RegisterScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = AUTH_THEME_COLORS[activeTheme];
  const language = useAppLanguage();

  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  
  // Emergency Contact Info
  const [trustedName, setTrustedName] = useState<string>("");
  const [trustedCode, setTrustedCode] = useState<string>("+52");
  const [trustedPhone, setTrustedPhone] = useState<string>("");

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const COUNTRY_CODES = ["+52", "+1", "+34", "+57", "+54", "+56"];

  const t = getAppCopy(language as AppLanguage).auth.register;

  const passwordsMatch =
    password.trim().length > 0 && password === confirmPassword;

  // Valida datos base del formulario
  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 3 &&
      email.trim().length > 4 &&
      password.trim().length > 5 &&
      confirmPassword.trim().length > 5 &&
      passwordsMatch
    );
  }, [confirmPassword, email, fullName, password, passwordsMatch]);

  // Layout animations handled by react-native-reanimated

  const handleRegister = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setAuthError("");

    try {
      // 1. Create Firebase Auth account (this is the critical step)
      const credentials = await createUserWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password,
      );

      // 2. Set display name
      if (fullName.trim().length > 0) {
        await updateProfile(credentials.user, { displayName: fullName.trim() });
      }

      // 3. Try saving user profile to Firestore (best-effort)
      const role = "user";
      try {
        await setDoc(doc(firestoreDb, "users", credentials.user.uid), {
          uid: credentials.user.uid,
          email: credentials.user.email ?? email.trim(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          trustedContactName: trustedName.trim(),
          trustedContactCountryCode: trustedCode,
          trustedContactPhone: trustedPhone.replace(/\D/g,""),
          role,
          subscriptionPlan: "free",
          language,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (firestoreError) {
        // Firestore permissions not configured yet — account still works
        console.warn("Firestore profile sync failed (account created):", firestoreError);
      }

      // 4. Save local preferences
      await updateAppPreferences({
        accountRole: role,
        subscriptionPlan: "free",
        trustedContactName: trustedName.trim(),
        trustedContactCountryCode: trustedCode,
        trustedContactPhone: trustedPhone.replace(/\D/g,""),
        useTrustedContact: trustedPhone.trim().length >= 10,
      });

      router.replace("/(tabs)");
    } catch {
      setAuthError(
        language === "es"
          ? "No se pudo crear la cuenta. Intenta con otro correo."
          : "Could not create account. Try another email.",
      );
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
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
                {language === "es" ? "Crea tu Cuenta" : "Create Account"}
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
              >
                {t.sectionSubtitle}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Input
                label={t.fullName}
                placeholder={t.fullNamePlaceholder}
                value={fullName}
                onChangeText={setFullName}
                icon="account-outline"
              />

              {/* Mantenemos teléfono opcional */}
              <Input
                label={`${t.phone} (Opcional)`}
                placeholder={t.phonePlaceholder}
                value={phone}
                onChangeText={setPhone}
                icon="phone-outline"
                keyboardType="phone-pad"
              />

              <Input
                label={language === "es" ? "Familiar / Emergencia (Opcional)" : "Emergency Contact (Optional)"}
                placeholder={language === "es" ? "Nombre completo" : "Full name"}
                value={trustedName}
                onChangeText={setTrustedName}
                icon="heart-pulse"
                style={{ marginTop: 12 }}
              />
              
              <Text style={[styles.label, { color: colors.textPrimary, fontSize: 13, marginBottom: 4, marginTop: -4 }]}>
                {language === "es" ? "Lada / Región" : "Country Code"}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, maxHeight: 40}}>
                {COUNTRY_CODES.map((code) => (
                  <TouchableOpacity
                    key={code}
                    onPress={() => setTrustedCode(code)}
                    style={[
                      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.inputBorder, marginRight: 8, backgroundColor: colors.inputBackground },
                      trustedCode === code && { backgroundColor: `${colors.primary}33`, borderColor: colors.primary }
                    ]}
                  >
                    <Text style={{ color: trustedCode === code ? colors.primary : colors.textSecondary, fontWeight: "600" }}>{code}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Input
                placeholder={language === "es" ? "Número de emergencia a 10 dígitos" : "10-digit emergency number"}
                value={trustedPhone}
                onChangeText={setTrustedPhone}
                icon="phone-alert-outline"
                keyboardType="phone-pad"
              />

              <Input
                label={t.email}
                placeholder={t.emailPlaceholder}
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

              <Input
                label={t.confirmPassword}
                placeholder={t.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="lock-check-outline"
                variant="password"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()}>

              {confirmPassword.trim().length > 0 && !passwordsMatch ? (
                <Text style={[styles.errorText, { color: colors.danger, marginTop: 8 }]}>
                  {t.passwordMismatch}
                </Text>
              ) : null}

              <Button
                title={t.submit}
                onPress={() => {
                  void handleRegister();
                }}
                loading={isSubmitting}
                disabled={!canSubmit || isSubmitting}
                variant="primary"
                size="lg"
                style={{ marginTop: 28 }}
              />

              {authError ? (
                <Text style={[styles.errorText, { color: colors.danger, marginTop: 12, textAlign: "center" }]}>
                  {authError}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                style={styles.linkButton}
              >
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  {language === "es" ? "¿Ya tienes cuenta?" : "Already have an account?"} <Text style={{ color: colors.primary, fontWeight: "700" }}>{t.loginLink}</Text>
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
  sectionSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 20 },
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
  errorText: { marginTop: 6, fontSize: 13, fontWeight: "700" },
  submitButton: { marginTop: 28, borderRadius: 18, paddingVertical: 18, alignItems: "center" },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  linkButton: { marginTop: 20, alignItems: "center", paddingVertical: 12 },
  linkText: { fontSize: 14, fontWeight: "500" },
  eyeBtn: { padding: 4 },
});
