# RescueNow UI Design System Implementation Plan

**Goal:** Implement a cohesive design system with glassmorphism refinements, consistent components, and WCAG AAA accessibility across all screens.

**Architecture:** Create centralized design tokens and reusable components. Update existing screens to use new components while maintaining current functionality.

**Tech Stack:** React Native, Expo, react-native-reanimated, expo-blur

---

## File Structure

```
constants/
  design-tokens.ts   # NEW - Colors, spacing, typography, animations
  theme.ts           # NEW - Light/dark theme objects with design tokens

components/ui/
  Button.tsx         # NEW - Primary, secondary, ghost, danger variants
  Card.tsx           # NEW - Base card with glass effect
  Input.tsx         # NEW - Text input with variants
  Header.tsx        # NEW - Glass header component
  SOSButton.tsx     # NEW - Animated SOS button
  Toast.tsx         # NEW - Toast notification component
```

---

## Task 1: Create Design Tokens

**Files:**
- Create: `constants/design-tokens.ts`

- [ ] **Step 1: Create design-tokens.ts**

```typescript
export const colors = {
  dark: {
    primary: '#DC2626',
    primaryHover: '#EF4444',
    secondary: '#0EA5E9',
    success: '#22C55E',
    warning: '#F59E0B',
    background: '#0F172A',
    surface: 'rgba(30, 41, 59, 0.85)',
    surfaceElevated: 'rgba(51, 65, 85, 0.90)',
    border: 'rgba(148, 163, 184, 0.2)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
  },
  light: {
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    secondary: '#0EA5E9',
    success: '#22C55E',
    warning: '#F59E0B',
    background: '#F8FAFC',
    surface: 'rgba(255, 255, 255, 0.85)',
    surfaceElevated: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(148, 163, 184, 0.3)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.02,
  },
  h1: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.01,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 12,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.05,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const animation = {
  duration: {
    micro: 150,
    standard: 300,
    emphasis: 500,
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
};
```

- [ ] **Step 2: Create theme.ts**

```typescript
import { colors, spacing, typography, borderRadius, animation } from './design-tokens';

export type ThemeMode = 'light' | 'dark';

export const createTheme = (mode: ThemeMode) => ({
  colors: colors[mode],
  spacing,
  typography,
  borderRadius,
  animation,
  mode,
});

export type Theme = ReturnType<typeof createTheme>;

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
```

- [ ] **Step 3: Commit**

```bash
git add constants/design-tokens.ts constants/theme.ts
git commit -m "feat: add design tokens and theme system"
```

---

## Task 2: Create Button Component

**Files:**
- Create: `components/ui/Button.tsx`
- Modify: `app/(auth)/login.tsx` (to use new Button)

- [ ] **Step 1: Create Button.tsx**

```tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useActiveTheme } from '@/hooks/useActiveTheme';
import { spacing, borderRadius, animation } from '@/constants/design-tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

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

const SIZES = {
  sm: { height: 36, paddingH: 12, fontSize: 14 },
  md: { height: 44, paddingH: 16, fontSize: 16 },
  lg: { height: 52, paddingH: 24, fontSize: 18 },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { colors } = useActiveTheme();
  const sizeConfig = SIZES[size];

  const getBackgroundColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      case 'danger':
        return `${colors.primary}1A`; // 10% opacity
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.surface;
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return colors.secondary;
      case 'ghost':
        return colors.textPrimary;
      case 'danger':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'secondary') return colors.secondary;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingH,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'secondary' ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: sizeConfig.fontSize },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Update login.tsx to use Button**

Read `app/(auth)/login.tsx`, then replace the login button with:
```tsx
import { Button } from '@/components/ui/Button';
// ... in the component:
<Button
  title="Iniciar Sesión"
  onPress={handleLogin}
  loading={loading}
  style={styles.loginButton}
/>
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/Button.tsx app/\(auth\)/login.tsx
git commit -m "feat: add Button component, update login screen"
```

---

## Task 3: Create Card Component

**Files:**
- Create: `components/ui/Card.tsx`
- Modify: `app/(tabs)/services.tsx` (to use new Card)

- [ ] **Step 1: Create Card.tsx**

```tsx
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useActiveTheme } from '@/hooks/useActiveTheme';
import { spacing, borderRadius } from '@/constants/design-tokens';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  elevated = false,
  style,
}) => {
  const { colors } = useActiveTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
    borderColor: colors.border,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.card, styles.elevated, cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, elevated && styles.elevated, cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
```

- [ ] **Step 2: Update services.tsx**

Read `app/(tabs)/services.tsx`, replace service cards with Card component.

- [ ] **Step 3: Commit**

```bash
git add components/ui/Card.tsx app/\(tabs\)/services.tsx
git commit -m "feat: add Card component, update services screen"
```

---

## Task 4: Create Input Component

**Files:**
- Create: `components/ui/Input.tsx`
- Modify: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`

- [ ] **Step 1: Create Input.tsx**

```tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '@/hooks/useActiveTheme';
import { spacing, borderRadius, typography } from '@/constants/design-tokens';

type InputVariant = 'default' | 'password' | 'multiline';

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
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  variant = 'default',
  error,
  disabled = false,
  icon,
  style,
  keyboardType = 'default',
  autoCapitalize = 'none',
}) => {
  const { colors } = useActiveTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.primary;
    if (isFocused) return colors.secondary;
    return colors.border;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? colors.textMuted : colors.surfaceElevated,
            borderColor: getBorderColor(),
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colors.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={variant === 'password' && !showPassword}
          multiline={variant === 'multiline'}
          editable={!disabled}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            { color: colors.textPrimary },
            icon && styles.inputWithIcon,
            variant === 'multiline' && styles.multiline,
          ]}
        />
        {variant === 'password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.primary }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  inputWithIcon: {
    paddingLeft: spacing.sm,
  },
  multiline: {
    height: 100,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  icon: {
    marginRight: spacing.sm,
  },
  error: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
```

- [ ] **Step 2: Update login.tsx and register.tsx**

Replace input fields with Input component.

- [ ] **Step 3: Commit**

```bash
git add components/ui/Input.tsx app/\(auth\)/login.tsx app/\(auth\)/register.tsx
git commit -m "feat: add Input component, update auth screens"
```

---

## Task 5: Create SOSButton Component

**Files:**
- Create: `components/ui/SOSButton.tsx`
- Modify: `app/(tabs)/index.tsx` (home screen)

- [ ] **Step 1: Create SOSButton.tsx**

```tsx
import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useActiveTheme } from '@/hooks/useActiveTheme';
import { borderRadius, animation } from '@/constants/design-tokens';

interface SOSButtonProps {
  onPress: () => void;
  size?: number;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  onPress,
  size = 72,
}) => {
  const { colors } = useActiveTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: animation.duration.emphasis,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: animation.duration.emphasis,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.button,
          {
            width: size,
            height: size,
            backgroundColor: colors.primary,
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name="shield-checkmark"
          size={size * 0.5}
          color="#FFFFFF"
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
```

- [ ] **Step 2: Update home screen (index.tsx)**

Read `app/(tabs)/index.tsx`, replace existing SOS FAB with SOSButton component.

- [ ] **Step 3: Commit**

```bash
git add components/ui/SOSButton.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add SOSButton with pulse animation, update home screen"
```

---

## Task 6: Create Header Component

**Files:**
- Create: `components/ui/Header.tsx`
- Modify: Screens that need glass header

- [ ] **Step 1: Create Header.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useActiveTheme } from '@/hooks/useActiveTheme';
import { spacing, typography } from '@/constants/design-tokens';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useActiveTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BlurView intensity={30} style={[styles.blur, { borderBottomColor: colors.border }]}>
        <View style={styles.content}>
          <View style={styles.left}>
            {showBack && (
              <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <View style={styles.right}>
            {rightIcon && (
              <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
                <Ionicons name={rightIcon} size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blur: {
    borderBottomWidth: 1,
  },
  content: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  left: {
    width: 44,
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...typography.h3,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Update chatbot.tsx and medical-id.tsx**

Replace inline headers with Header component.

- [ ] **Step 3: Commit**

```bash
git add components/ui/Header.tsx app/\(tabs\)/chatbot.tsx app/\(tabs\)/medical-id.tsx
git commit -m "feat: add Header component, update chatbot and medical-id screens"
```

---

## Task 7: Create Toast Component

**Files:**
- Create: `components/ui/Toast.tsx`
- Modify: `components/ui/dynamic-toast.tsx`

- [ ] **Step 1: Create Toast.tsx**

```tsx
import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/hooks/useActiveTheme';
import { spacing, borderRadius, animation } from '@/constants/design-tokens';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 4000,
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useActiveTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: animation.duration.standard });
      translateY.value = withTiming(0, { duration: animation.duration.standard });
      opacity.value = withDelay(
        duration,
        withTiming(0, { duration: animation.duration.standard }, () => {
          runOnJS(onHide)();
        })
      );
      translateY.value = withDelay(
        duration,
        withTiming(-20, { duration: animation.duration.standard })
      );
    }
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.primary;
      case 'warning':
        return colors.warning;
      default:
        return colors.secondary;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing.md,
          backgroundColor: colors.surfaceElevated,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name={ICONS[type]} size={20} color={getIconColor()} />
      <Text style={[styles.message, { color: colors.textPrimary }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
    gap: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
});
```

- [ ] **Step 2: Update dynamic-toast.tsx or replace usage**

- [ ] **Step 3: Commit**

```bash
git add components/ui/Toast.tsx components/ui/dynamic-toast.tsx
git commit -m "feat: add Toast component"
```

---

## Task 8: Update Remaining Screens

**Files:**
- Modify: `app/(tabs)/options.tsx`, `app/(tabs)/edit-profile.tsx`, `app/(tabs)/technicians.tsx`

- [ ] **Step 1: Update options.tsx**

Read file, replace inline styles with design tokens and Card/Button components.

- [ ] **Step 2: Update edit-profile.tsx**

Same approach with Input/Card components.

- [ ] **Step 3: Update technicians.tsx**

Same approach.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/options.tsx app/\(tabs\)/edit-profile.tsx app/\(tabs\)/technicians.tsx
git commit -m "refactor: update remaining screens with design system components"
```

---

## Verification Checklist

- [ ] All components use design tokens (no hardcoded colors)
- [ ] Touch targets minimum 44px on all interactive elements
- [ ] Light/dark modes visually consistent
- [ ] SOS button pulse animation smooth at 60fps
- [ ] No orphaned inline styles remain in updated screens
- [ ] TypeScript compiles without errors
