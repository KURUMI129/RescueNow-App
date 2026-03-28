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

import { AuthHeader } from "@/components/auth/auth-header";
import { getAppCopy } from "@/constants/app-copy";
import { AppLanguage } from "@/constants/app-preferences";
import { AUTH_THEME_COLORS } from "@/constants/auth-theme";
import { useAppLanguage } from "@/hooks/use-app-language";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = AUTH_THEME_COLORS[activeTheme];
  const language = useAppLanguage();

  const [email, setEmail] = useState<string>("");
  const [sent, setSent] = useState<boolean>(false);

  const t = getAppCopy(language as AppLanguage).auth.forgotPassword;

  const canSubmit = email.trim().length > 4;

  const handleRecover = () => {
    if (!canSubmit) {
      return;
    }

    // TODO: Copilot Backend - Aquí integrar sendPasswordResetEmail
    // 1. Usar firebaseAuth y enviar el email ingresado.
    // 2. Manejar estado de "Enviando..."
    // 3. Capturar catch y mostrar throw si el correo no existe.
    
    setSent(true);
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
                onChangeText={(value) => {
                  setEmail(value);
                  if (sent) {
                    setSent(false);
                  }
                }}
              />
            </View>

            {sent ? (
              <Text
                style={[styles.successText, { color: colors.textSecondary }]}
              >
                {t.sentMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.9}
              disabled={!canSubmit}
              onPress={handleRecover}
              style={[
                styles.submitButton,
                {
                  backgroundColor: canSubmit
                    ? colors.primary
                    : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[styles.submitButtonText, { color: colors.onPrimary }]}
              >
                {t.sendLink}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.linkButton}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {t.backToLogin}
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
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
    fontWeight: "800",
    fontSize: 13,
    marginTop: 16,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
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
  successText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 28,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  submitButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
