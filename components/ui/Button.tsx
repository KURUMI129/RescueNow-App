import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const HEIGHT_MAP: Record<ButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];

  const buttonHeight = HEIGHT_MAP[size];
  const borderRadius = tokens.borderRadius.sm;

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: buttonHeight,
      borderRadius,
      alignItems: "center",
      justifyContent: "center",
      opacity: disabled ? 0.5 : 1,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: tokens.colors.primary,
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: tokens.colors.secondary,
        };
      case "ghost":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
        };
      case "danger":
        return {
          ...baseStyle,
          backgroundColor: `${tokens.colors.primary}1A`,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: "700",
      fontSize: size === "sm" ? 13 : size === "md" ? 15 : 16,
      letterSpacing: 0.5,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          color: "#FFFFFF",
        };
      case "secondary":
        return {
          ...baseStyle,
          color: tokens.colors.secondary,
        };
      case "ghost":
        return {
          ...baseStyle,
          color: tokens.colors.primary,
        };
      case "danger":
        return {
          ...baseStyle,
          color: tokens.colors.primary,
        };
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : tokens.colors.primary}
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}