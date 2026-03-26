import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
    useColorScheme,
} from "react-native";

import { AuthHeader } from "@/components/auth/auth-header";
import { RoleOptionCard, UserRole } from "@/components/auth/role-option-card";
import { getAppCopy } from "@/constants/app-copy";
import {
  AccountRole,
  AppLanguage,
  SubscriptionPlan,
  updateAppPreferences,
} from "@/constants/app-preferences";
import { AUTH_THEME_COLORS } from "@/constants/auth-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { firebaseAuth, firestoreDb } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? AUTH_THEME_COLORS.dark : AUTH_THEME_COLORS.light;
  const language = useAppLanguage();

  const [role, setRole] = useState<UserRole>("user");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  const t = getAppCopy(language as AppLanguage).auth.login;

  const userScale = useRef(
    new Animated.Value(role === "user" ? 1.02 : 1),
  ).current;
  const technicianScale = useRef(
    new Animated.Value(role === "technician" ? 1.02 : 1),
  ).current;

  useEffect(() => {
    Animated.spring(userScale, {
      toValue: role === "user" ? 1.02 : 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();

    Animated.spring(technicianScale, {
      toValue: role === "technician" ? 1.02 : 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [role, technicianScale, userScale]);

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setAuthError("");

    // Flujo temporal: navega al modulo principal.
    // En el siguiente paso lo conectamos con la API real de autenticacion.
    try {
      const credentials = await signInWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password,
      );
      const userProfileRef = doc(firestoreDb, "users", credentials.user.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      const profile = userProfileSnap.data() as
        | {
            role?: AccountRole;
            subscriptionPlan?: SubscriptionPlan;
            trustedContactPhone?: string;
            language?: AppLanguage;
          }
        | undefined;

      await updateAppPreferences({
        accountRole: profile?.role === "technician" ? "technician" : role,
        subscriptionPlan:
          profile?.subscriptionPlan === "premium" ? "premium" : "free",
        trustedContactPhone: profile?.trustedContactPhone ?? "",
        language: profile?.language === "en" ? "en" : language,
      });

      router.replace("/(tabs)");
    } catch {
      setAuthError(
        language === "es"
          ? "No se pudo iniciar sesion. Revisa correo y contraseña."
          : "Could not sign in. Check your email and password.",
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

            <View style={styles.rolesContainer}>
              <Animated.View style={{ transform: [{ scale: userScale }] }}>
                <RoleOptionCard
                  role="user"
                  title={t.userTitle}
                  description={t.userDesc}
                  selected={role === "user"}
                  colors={colors}
                  onPress={setRole}
                />
              </Animated.View>

              <Animated.View
                style={{ transform: [{ scale: technicianScale }] }}
              >
                <RoleOptionCard
                  role="technician"
                  title={t.technicianTitle}
                  description={t.technicianDesc}
                  selected={role === "technician"}
                  colors={colors}
                  onPress={setRole}
                />
              </Animated.View>
            </View>

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

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.forgotPasswordButton}
            >
              <Text
                style={[styles.forgotPasswordText, { color: colors.primary }]}
              >
                {t.forgot}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.9}
              disabled={isSubmitting}
              onPress={() => {
                void handleLogin();
              }}
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
                { backgroundColor: colors.primary },
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

            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {t.footer}
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              style={styles.registerButton}
            >
              <Text style={[styles.registerText, { color: colors.primary }]}>
                {t.register}
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
  rolesContainer: {
    marginBottom: 10,
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
  submitButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  forgotPasswordButton: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  footerText: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
  registerButton: {
    marginTop: 10,
    alignItems: "center",
  },
  registerText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
