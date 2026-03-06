import { useState } from 'react';
import { useRouter } from 'expo-router';
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
} from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { AUTH_THEME_COLORS } from '@/constants/auth-theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? AUTH_THEME_COLORS.dark : AUTH_THEME_COLORS.light;

  const [email, setEmail] = useState<string>('');
  const [sent, setSent] = useState<boolean>(false);

  const canSubmit = email.trim().length > 4;

  const handleRecover = () => {
    if (!canSubmit) {
      return;
    }

    // Placeholder para llamada al backend de recuperacion.
    setSent(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AuthHeader colors={colors} />

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recuperar contrasena</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Ingresa tu correo y te enviaremos instrucciones para restablecer tu acceso.
            </Text>

            <Text style={[styles.label, { color: colors.textPrimary }]}>Correo electronico</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ejemplo@correo.com"
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
              onChangeText={(value) => {
                setEmail(value);
                if (sent) {
                  setSent(false);
                }
              }}
            />

            {sent ? (
              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                Te enviamos un enlace de recuperacion. Revisa tu bandeja de entrada.
              </Text>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.9}
              disabled={!canSubmit}
              onPress={handleRecover}
              style={[
                styles.submitButton,
                { backgroundColor: canSubmit ? colors.primary : colors.primaryDisabled },
              ]}>
              <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Enviar enlace</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkButton}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Volver a iniciar sesion</Text>
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
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
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
  successText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
