import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

type InputVariant = "default" | "password" | "multiline";
type KeyboardType = "default" | "email-address" | "numeric" | "phone-pad" | "number-pad" | "decimal-pad";
type AutoCapitalize = "none" | "sentences" | "words" | "characters";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: InputVariant;
  error?: string;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  keyboardType?: KeyboardType;
  autoCapitalize?: AutoCapitalize;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  variant = "default",
  error,
  disabled = false,
  icon,
  style,
  keyboardType = "default",
  autoCapitalize = "none",
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];

  const hasError = !!error;

  const getBorderColor = () => {
    if (hasError) return tokens.colors.primary;
    if (isFocused) return tokens.colors.secondary;
    return tokens.colors.border;
  };

  const iconColor = hasError
    ? tokens.colors.primary
    : isFocused
    ? tokens.colors.secondary
    : tokens.colors.textMuted;

  const isSecure = variant === "password" && !showPassword;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: hasError ? tokens.colors.primary : tokens.colors.textPrimary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            height: variant === "multiline" ? 100 : 48,
            borderColor: getBorderColor(),
            backgroundColor: tokens.colors.background,
            borderRadius: tokens.borderRadius.sm,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={iconColor}
            style={styles.icon}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.textMuted}
          secureTextEntry={isSecure}
          editable={!disabled}
          multiline={variant === "multiline"}
          keyboardType={keyboardType === "default" ? "default" : keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: tokens.colors.textPrimary,
              opacity: disabled ? 0.5 : 1,
              textAlignVertical: variant === "multiline" ? "top" : "center",
              paddingTop: variant === "multiline" ? 12 : 0,
            },
          ]}
        />
        {variant === "password" && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      {hasError && (
        <Text style={[styles.errorText, { color: tokens.colors.primary }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
});