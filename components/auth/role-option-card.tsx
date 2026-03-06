import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthThemeColors } from '@/constants/auth-theme';

export type UserRole = 'user' | 'technician';

type RoleOptionCardProps = {
  role: UserRole;
  title: string;
  description: string;
  selected: boolean;
  colors: AuthThemeColors;
  onPress: (role: UserRole) => void;
};

const roleIconMap: Record<UserRole, keyof typeof Ionicons.glyphMap> = {
  user: 'person-circle-outline',
  technician: 'construct-outline',
};

export function RoleOptionCard({
  role,
  title,
  description,
  selected,
  colors,
  onPress,
}: RoleOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(role)}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: selected ? colors.primary : colors.roleCardBorder,
          backgroundColor: selected ? colors.roleCardSelectedBackground : colors.roleCardBackground,
        },
        pressed && styles.cardPressed,
      ]}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: selected ? colors.roleIconSelectedBackground : colors.roleIconBackground },
        ]}>
        <Ionicons
          name={roleIconMap[role]}
          size={21}
          color={selected ? colors.onPrimary : colors.primary}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>

      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.primary : colors.inputPlaceholder}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
});
