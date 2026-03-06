import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { HOME_THEME_COLORS } from '@/constants/home-theme';
import { getCategoryLabel, SERVICE_OPTIONS, ServiceCategory, TECHNICIANS } from '@/constants/service-flow';

function getParamValue(value: string | string[] | undefined): string {
  if (!value) {
    return '';
  }

  return Array.isArray(value) ? value[0] : value;
}

function isServiceCategory(value: string): value is ServiceCategory {
  return SERVICE_OPTIONS.some((item) => item.id === value);
}

export default function TechniciansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; issue?: string }>();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;

  const rawCategory = getParamValue(params.category);
  const issue = getParamValue(params.issue);

  const category: ServiceCategory = isServiceCategory(rawCategory) ? rawCategory : 'mech';
  const availableTechnicians = TECHNICIANS.filter((item) => item.category === category);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.topLabel, { color: colors.textSecondary }]}>Paso 2 de 3</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{getCategoryLabel(category)}s disponibles</Text>

        {issue.trim().length > 0 ? (
          <View style={[styles.issueCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.issueTitle, { color: colors.textPrimary }]}>Trabajo solicitado:</Text>
            <Text style={[styles.issueText, { color: colors.textSecondary }]}>{issue}</Text>
          </View>
        ) : null}

        {availableTechnicians.map((tech) => (
          <Pressable
            key={tech.id}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/technician-detail',
                params: {
                  techId: tech.id,
                  category,
                  issue,
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
            <View style={[styles.avatarCircle, { backgroundColor: colors.mapBackground }]}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
            </View>

            <View style={styles.textWrap}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{tech.name}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>ETA {tech.etaMin} min · {tech.distanceKm.toFixed(1)} km</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Calificacion {tech.rating.toFixed(1)} · {tech.jobsDone} servicios</Text>
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
    marginBottom: 12,
    fontSize: 24,
    fontWeight: '900',
  },
  issueCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  issueText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
  },
});
