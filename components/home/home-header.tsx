import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandLogo } from "@/components/brand/brand-logo";
import { HomeThemeColors } from "@/constants/home-theme";

type HomeHeaderProps = {
  colors: HomeThemeColors;
  tagline: string;
  openSettingsLabel: string;
  onOpenDrawer: () => void;
};

export function HomeHeader({
  colors,
  tagline,
  openSettingsLabel,
  onOpenDrawer,
}: HomeHeaderProps) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.brandWrap}>
        <BrandLogo width={76} height={66} />
        <View style={styles.brandTextWrap}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {tagline}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={openSettingsLabel}
        onPress={onOpenDrawer}
        style={({ pressed }) => [
          styles.menuButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Ionicons name="menu" size={20} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  brandTextWrap: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 4,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
