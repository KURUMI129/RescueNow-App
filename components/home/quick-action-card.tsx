import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeThemeColors } from '@/constants/home-theme';

type QuickActionCardProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: HomeThemeColors;
  onPress: () => void;
};

export function QuickActionCard({ title, subtitle, icon, colors, onPress }: QuickActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: colors.cardBorder,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.86 : 1,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.mapBackground }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
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
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
  },
});
