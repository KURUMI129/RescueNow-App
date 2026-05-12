import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

type EmptyStateType = "loading" | "empty" | "error";

interface EmptyStateProps {
  type: EmptyStateType;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const DEFAULT_ICONS: Record<EmptyStateType, keyof typeof Ionicons.glyphMap> = {
  loading: "hourglass-outline",
  empty: "folder-open-outline",
  error: "alert-circle-outline",
};

export function EmptyState({ type, title, subtitle, icon }: EmptyStateProps) {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const iconName = icon ?? DEFAULT_ICONS[type];

  return (
    <View style={styles.container}>
      {type === "loading" ? (
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      ) : (
        <Ionicons
          name={iconName}
          size={64}
          color={type === "error" ? tokens.colors.warning : tokens.colors.textMuted}
        />
      )}
      <Text
        style={[
          styles.title,
          { color: tokens.colors.textPrimary, marginTop: tokens.spacing.md },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            { color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
