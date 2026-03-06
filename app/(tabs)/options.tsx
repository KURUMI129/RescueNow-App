import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { HOME_THEME_COLORS } from '@/constants/home-theme';

type OptionItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: 'primary' | 'accent';
};

const USER_OPTIONS: OptionItem[] = [
  {
    id: 'premium',
    title: 'Comprar premium',
    subtitle: 'Prioridad de asistencia y beneficios exclusivos',
    icon: 'diamond-outline',
    accent: 'accent',
  },
  {
    id: 'payment',
    title: 'Metodos de pago',
    subtitle: 'Administrar tarjetas y facturacion',
    icon: 'card-outline',
    accent: 'primary',
  },
  {
    id: 'support',
    title: 'Soporte y ayuda',
    subtitle: 'Centro de ayuda y contacto rapido',
    icon: 'help-circle-outline',
    accent: 'primary',
  },
];

export default function OptionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.topLabel, { color: colors.textSecondary }]}>Cuenta</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Opciones</Text>

        {USER_OPTIONS.map((item) => {
          const iconColor = item.accent === 'accent' ? colors.accent : colors.primary;

          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.optionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}>
              <View style={[styles.optionIcon, { backgroundColor: colors.mapBackground }]}>
                <Ionicons name={item.icon} size={18} color={iconColor} />
              </View>

              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={({ pressed }) => [
            styles.logoutButton,
            {
              backgroundColor: colors.danger,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 14,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
