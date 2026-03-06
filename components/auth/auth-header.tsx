import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AuthThemeColors } from '@/constants/auth-theme';

type AuthHeaderProps = {
  colors: AuthThemeColors;
};

export function AuthHeader({ colors }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconBadge, { backgroundColor: colors.iconBadgeBackground }]}>
        <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>RescueNow</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Conecta con asistencia tecnica confiable en minutos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    alignItems: 'center',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 14,
    lineHeight: 20,
  },
});
