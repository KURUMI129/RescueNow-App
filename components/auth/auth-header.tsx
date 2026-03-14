import { StyleSheet, Text, View } from "react-native";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthThemeColors } from "@/constants/auth-theme";

type AuthHeaderProps = {
  colors: AuthThemeColors;
};

export function AuthHeader({ colors }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <BrandLogo width={132} height={118} />

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tu salvavidas tecnico.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 14,
    lineHeight: 18,
  },
});
