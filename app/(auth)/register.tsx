import { useActiveTheme } from "@/hooks/use-active-theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
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

  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(fadeAnim1, { toValue: 1, friction: 7, tension: 35, useNativeDriver: true }),
      Animated.spring(fadeAnim2, { toValue: 1, friction: 7, tension: 35, useNativeDriver: true }),
      Animated.spring(fadeAnim3, { toValue: 1, friction: 7, tension: 35, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim1, fadeAnim2, fadeAnim3]);

  const handleRegister = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setAuthError("");

    try {
      const credentials = await createUserWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password,
      );

      if (fullName.trim().length > 0) {
        await updateProfile(credentials.user, { displayName: fullName.trim() });
      }

      const role = "user";

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
            <Animated.View style={{ opacity: fadeAnim1, transform: [{ translateY: fadeAnim1.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {language === "es" ? "Crea tu Cuenta" : "Create Account"}
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
              >
                {t.sectionSubtitle}
              </Text>
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim2, transform: [{ translateY: fadeAnim2.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t.fullName}
              </Text>
              
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
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
              
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
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
              
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
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
              
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  secureTextEntry
                  placeholder={t.passwordPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t.confirmPassword}
              </Text>
              
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  secureTextEntry
                  placeholder={t.confirmPasswordPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim3, transform: [{ translateY: fadeAnim3.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>

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
                  { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
                ]}
              >
                <Text
                  style={[styles.submitButtonText, { color: '#000000' }]}
                >
                  {t.submit}
                </Text>
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
});
