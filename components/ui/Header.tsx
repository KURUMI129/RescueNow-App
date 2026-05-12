import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export function Header({
  title,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const colors = tokens.colors;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <BlurView
      intensity={activeTheme === "dark" ? 40 : 80}
      tint={activeTheme}
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBack && (
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>

        <View style={styles.centerSection}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        <View style={styles.rightSection}>
          {rightIcon && (
            <Pressable
              onPress={onRightPress}
              style={({ pressed }) => [
                styles.rightButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons name={rightIcon} size={24} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 2,
    alignItems: "center",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  rightButton: {
    padding: 8,
    marginRight: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});