import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { HOME_THEME_COLORS } from '@/constants/home-theme';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;

  const emergencyOptions = [
    { id: '1', title: 'Mecanico urgente', subtitle: 'Falla severa en carretera', icon: 'construct' as const },
    { id: '2', title: 'Grua inmediata', subtitle: 'Traslado en emergencia', icon: 'car-sport' as const },
    { id: '3', title: 'Plomeria critica', subtitle: 'Fuga o rotura mayor', icon: 'water' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Emergencia rapida</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Selecciona tu tipo de incidente para priorizar la asistencia.
        </Text>

        {emergencyOptions.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View style={[styles.optionIconWrap, { backgroundColor: colors.mapBackground }]}>
              <Ionicons name={option.icon} size={18} color={colors.danger} />
            </View>

            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>{option.title}</Text>
              <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        ))}

        <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.closeText, { color: colors.onPrimary }]}>Cerrar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIconWrap: {
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
  closeButton: {
    marginTop: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
