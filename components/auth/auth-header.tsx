import { Image, StyleSheet, Text, View } from "react-native";

import { AuthThemeColors } from "@/constants/auth-theme";

type AuthHeaderProps = {
  colors: AuthThemeColors;
};

export function AuthHeader({ colors }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: colors.iconBadgeBackground,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        RESCUE NOW
      </Text>
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
  iconBadge: {
    width: 78,
    height: 78,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  logo: {
    width: 52,
    height: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 14,
    lineHeight: 18,
  },
});
