import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
    useColorScheme,
} from "react-native";

import { AuthHeader } from "@/components/auth/auth-header";
import { RoleOptionCard, UserRole } from "@/components/auth/role-option-card";
import { getAppCopy } from "@/constants/app-copy";
import { AppLanguage, updateAppPreferences } from "@/constants/app-preferences";
import { AUTH_THEME_COLORS } from "@/constants/auth-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { firebaseAuth, firestoreDb } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? AUTH_THEME_COLORS.dark : AUTH_THEME_COLORS.light;
  const language = useAppLanguage();

  const [role, setRole] = useState<UserRole>("user");
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

  // Valida datos base del formulario sin cambiar logica de negocio aun.
  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 3 &&
      phone.trim().length >= 8 &&
      email.trim().length > 4 &&
      password.trim().length > 5 &&
      confirmPassword.trim().length > 5 &&
      passwordsMatch
    );
  }, [confirmPassword, email, fullName, password, passwordsMatch, phone]);

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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t.sectionTitle}
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
            >
              {t.sectionSubtitle}
            </Text>

            <RoleOptionCard
              role="user"
              title={t.userTitle}
              description={t.userDesc}
              selected={role === "user"}
              colors={colors}
              onPress={setRole}
            />
            <RoleOptionCard
              role="technician"
              title={t.technicianTitle}
              description={t.technicianDesc}
              selected={role === "technician"}
              colors={colors}
              onPress={setRole}
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t.fullName}
            </Text>
            <TextInput
              placeholder={t.fullNamePlaceholder}
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t.phone}
            </Text>
            <TextInput
              keyboardType="phone-pad"
              placeholder={t.phonePlaceholder}
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t.email}
            </Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t.emailPlaceholder}
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t.password}
            </Text>
            <TextInput
              secureTextEntry
              placeholder={t.passwordPlaceholder}
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={password}
              onChangeText={setPassword}
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t.confirmPassword}
            </Text>
            <TextInput
              secureTextEntry
              placeholder={t.confirmPasswordPlaceholder}
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {confirmPassword.trim().length > 0 && !passwordsMatch ? (
              <Text style={[styles.errorText, { color: "#dc2626" }]}>
                {t.passwordMismatch}
              </Text>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.9}
              disabled={!canSubmit || isSubmitting}
              onPress={() => {
                void handleRegister();
              }}
              style={[
                styles.submitButton,
                {
                  backgroundColor: canSubmit
                    ? colors.primary
                    : colors.primaryDisabled,
                },
              ]}
            >
              <Text
                style={[styles.submitButtonText, { color: colors.onPrimary }]}
              >
                {t.submit}
              </Text>
            </TouchableOpacity>

            {authError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {authError}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.linkButton}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {t.loginLink}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
    justifyContent: "center",
  },
  card: {
    width: "100%",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  submitButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  linkButton: {
    marginTop: 12,
    alignItems: "center",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
