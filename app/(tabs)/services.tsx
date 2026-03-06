import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';

import { HOME_THEME_COLORS } from '@/constants/home-theme';
import { SERVICE_OPTIONS, ServiceCategory } from '@/constants/service-flow';

export default function ServicesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const [issueDescription, setIssueDescription] = useState<string>('');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.topLabel, { color: colors.textSecondary }]}>Solicitud normal</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Que servicio necesitas?</Text>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Describe tu problema (opcional)</Text>
        <TextInput
          multiline
          value={issueDescription}
          onChangeText={setIssueDescription}
          placeholder="Ejemplo: Se me poncho una llanta en carretera."
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.issueInput,
            {
              color: colors.textPrimary,
              borderColor: colors.cardBorder,
              backgroundColor: colors.surface,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Categorias disponibles</Text>

        {SERVICE_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/technicians',
                params: {
                  category: option.id as ServiceCategory,
                  issue: issueDescription.trim(),
                },
              })
            }
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.86 : 1,
              },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.mapBackground }]}>
              <Ionicons name={option.icon} size={18} color={colors.primary} />
            </View>

            <View style={styles.textWrap}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{option.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        ))}
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
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '800',
  },
  issueInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 84,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    marginLeft: 10,
    marginRight: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
});
