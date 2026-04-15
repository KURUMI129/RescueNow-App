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
import Animated, { FadeInDown } from "react-native-reanimated";

import { AuthHeader } from "@/components/auth/auth-header";
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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

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
                {language === "es" ? "Crea tu Cuenta" : "Create Account"}
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
              >
                {t.sectionSubtitle}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t.fullName}
              </Text>
              
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  placeholder={t.fullNamePlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Mantenemos teléfono opcional */}
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t.phone} (Opcional)
              </Text>

              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  keyboardType="phone-pad"
                  placeholder={t.phonePlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t.email}
              </Text>

              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder={t.emailPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t.password}
              </Text>

              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  secureTextEntry={!showPassword}
                  placeholder={t.passwordPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t.confirmPassword}
              </Text>

              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  secureTextEntry={!showConfirmPassword}
                  placeholder={t.confirmPasswordPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={confirmPassword.length > 0 && passwordsMatch ? colors.success : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()}>

              {confirmPassword.trim().length > 0 && !passwordsMatch ? (
                <Text style={[styles.errorText, { color: colors.danger, marginTop: 8 }]}>
                  {t.passwordMismatch}
                </Text>
              ) : null}

              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                disabled={!canSubmit || isSubmitting}
                onPress={() => {
                  void handleRegister();
                }}
                style={[
                  styles.submitButton,
                  (!canSubmit || isSubmitting) && styles.submitButtonDisabled,
                  { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                    {t.submit}
                  </Text>
                )}
              </TouchableOpacity>

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
