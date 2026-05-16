import { ReactNode } from "react";
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, elevated = false, style }: CardProps) {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];

  const cardStyle: ViewStyle = {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    overflow: "hidden",
  };

  if (elevated) {
    cardStyle.shadowColor = "#0B1120";
    cardStyle.shadowOpacity = 0.08;
    cardStyle.shadowRadius = 12;
    cardStyle.shadowOffset = { width: 0, height: 4 };
    cardStyle.elevation = 4;
  }

  const combinedStyle = StyleSheet.flatten([cardStyle, style]);

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={combinedStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={combinedStyle}>{children}</View>;
}