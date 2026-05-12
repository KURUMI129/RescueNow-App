# RescueNow Demo Improvements Implementation Plan

**Goal:** Add 6 quality-of-life improvements for demo: loading/empty states, onboarding, offline indicator, SOS feedback, map tooltips, and quick emergency profile access.

**Architecture:** Create reusable components and hooks. Add UI states to existing screens. No backend changes needed.

**Tech Stack:** React Native, Expo, react-native-reanimated, expo-haptics

---

## File Structure

```
components/ui/
  EmptyState.tsx      # NEW - Reusable empty/loading state
  OfflineBanner.tsx   # NEW - Shows when offline
  MapTooltip.tsx      # NEW - Tooltip overlay for map markers

screens/updates:
  app/(tabs)/index.tsx     # Add offline banner, map tooltips
  app/(tabs)/options.tsx   # Add emergency profile quick access
  app/(auth)/_layout.tsx   # Add onboarding check

hooks/
  useOnboarding.ts    # NEW - Track if user completed onboarding
```

---

## Task 1: Create EmptyState Component

**Files:**
- Create: `components/ui/EmptyState.tsx`

- [ ] **Step 1: Create EmptyState.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing } from '@/constants/design-tokens';

type EmptyStateType = 'loading' | 'empty' | 'error';

interface EmptyStateProps {
  type: EmptyStateType;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const DEFAULT_ICONS: Record<EmptyStateType, keyof typeof Ionicons.glyphMap> = {
  loading: 'hourglass-outline',
  empty: 'folder-open-outline',
  error: 'alert-circle-outline',
};

export function EmptyState({ type, title, subtitle, icon }: EmptyStateProps) {
  const { colors } = useActiveTheme();
  const iconName = icon ?? DEFAULT_ICONS[type];

  return (
    <View style={styles.container}>
      {type === 'loading' ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <Ionicons name={iconName} size={64} color={colors.textMuted} />
      )}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/EmptyState.tsx
git commit -m "feat: add EmptyState component for loading/empty/error states"
```

---

## Task 2: Create OfflineBanner Component

**Files:**
- Create: `components/ui/OfflineBanner.tsx`

- [ ] **Step 1: Create OfflineBanner.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing } from '@/constants/design-tokens';

export function OfflineBanner() {
  const { colors } = useActiveTheme();
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useSharedValue(-60);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      translateY.value = withTiming(offline ? 0 : -60, { duration: 300 });
    });

    return () => unsubscribe();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top, backgroundColor: colors.warning },
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>
        Sin conexión a internet
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Update app/(tabs)/index.tsx**

Read the file, add import for OfflineBanner, add `<OfflineBanner />` after the main View.

- [ ] **Step 3: Commit**

```bash
git add components/ui/OfflineBanner.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add offline banner indicator"
```

---

## Task 3: Create Onboarding System

**Files:**
- Create: `hooks/useOnboarding.ts`
- Create: `app/onboarding.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create useOnboarding.ts**

```tsx
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@rescuenow_onboarding_v1';

export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setIsCompleted(value === 'true');
      setIsLoading(false);
    });
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setIsCompleted(true);
  };

  return { isCompleted, isLoading, completeOnboarding };
}
```

- [ ] **Step 2: Create onboarding.tsx screen**

Create a simple 3-screen onboarding with:
- Screen 1: "RescueNow te protege" + shield icon
- Screen 2: "Un toque para pedir ayuda" + SOS button icon
- Screen 3: "Servicios de emergencia" + map icon

Each screen has: title, description, illustration placeholder, "Siguiente" button, "Omitir" on last screen. On finish, navigate to login.

```tsx
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const SCREENS = [
  {
    icon: 'shield-checkmark' as const,
    title: 'RescueNow te protege',
    subtitle: 'Tu app de emergencia personal, disponible 24/7',
  },
  {
    icon: 'warning' as const,
    title: 'Un toque para pedir ayuda',
    subtitle: 'Activa el SOS con un simple botón de emergencia',
  },
  {
    icon: 'map' as const,
    title: 'Servicios de emergencia',
    subtitle: 'Bomberos, policía y ambulancia cerca de ti',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useActiveTheme();
  const { completeOnboarding } = useOnboarding();

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/(auth)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {SCREENS.map((screen, index) => (
          <View key={index} style={styles.slide}>
            <Ionicons name={screen.icon} size={100} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {screen.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {screen.subtitle}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Button title="Comenzar" onPress={handleFinish} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  slide: { alignItems: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 24, textAlign: 'center' },
  subtitle: { fontSize: 16, marginTop: 12, textAlign: 'center' },
  footer: { padding: 24, paddingBottom: 48 },
});
```

- [ ] **Step 3: Modify app/_layout.tsx**

Read the layout file, add conditional redirect to onboarding if not completed.

```tsx
import { useOnboarding } from '@/hooks/useOnboarding';
import { router } from 'expo-router';

const { isCompleted, isLoading } = useOnboarding();

useEffect(() => {
  if (!isLoading && !isCompleted) {
    router.replace('/onboarding');
  }
}, [isLoading, isCompleted]);
```

- [ ] **Step 4: Commit**

```bash
git add hooks/useOnboarding.ts app/onboarding.tsx app/_layout.tsx
git commit -m "feat: add onboarding system for new users"
```

---

## Task 4: Enhance SOS Feedback

**Files:**
- Modify: `app/(tabs)/index.tsx` (SOS modal)
- Modify: `components/ui/SOSButton.tsx`

- [ ] **Step 1: Add haptic feedback to SOS modal**

Read `app/(tabs)/index.tsx` around lines 619-640 (SOS modal). Add haptic feedback:

```tsx
import * as Haptics from 'expo-haptics';

// When SOS modal appears:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// On cancel button:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

- [ ] **Step 2: Add dramatic animation to SOS modal**

Enhance the SOS modal with:
- Pulsing background effect (red glow animation)
- Countdown with scale animation

Read the modal code, add animated overlay:

```tsx
const pulseOpacity = useSharedValue(0.3);

useEffect(() => {
  pulseOpacity.value = withRepeat(
    withSequence(
      withTiming(0.6, { duration: 500 }),
      withTiming(0.3, { duration: 500 }),
    ),
    -1,
    true
  );
}, []);

const pulseStyle = useAnimatedStyle(() => ({
  opacity: pulseOpacity.value,
}));
```

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/index.tsx components/ui/SOSButton.tsx
git commit -m "feat: enhance SOS feedback with haptics and animations"
```

---

## Task 5: Create MapTooltip Component

**Files:**
- Create: `components/ui/MapTooltip.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create MapTooltip.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing, borderRadius } from '@/constants/design-tokens';

interface TooltipItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}

interface MapTooltipProps {
  items: TooltipItem[];
  onDismiss: () => void;
}

export function MapTooltip({ items, onDismiss }: MapTooltipProps) {
  const { colors } = useActiveTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <View style={styles.handle} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Leyenda del mapa
      </Text>
      <View style={styles.legend}>
        {items.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Ionicons name={item.icon} size={16} color={item.color} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={onDismiss}>
        <Text style={[styles.dismiss, { color: colors.primary }]}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  legend: { gap: spacing.xs },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 12 },
  dismiss: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Add tooltip to home screen**

Read `app/(tabs)/index.tsx`. Add state for showing tooltip:

```tsx
const [showMapTooltip, setShowMapTooltip] = useState(true);

const LEGEND_ITEMS = [
  { icon: 'flame', label: 'Bomberos', color: '#EF4444' },
  { icon: 'shield', label: 'Policía', color: '#3B82F6' },
  { icon: 'medkit', label: 'Hospitales', color: '#22C55E' },
];
```

Add the tooltip component when map is visible. Auto-dismiss after 10 seconds:

```tsx
useEffect(() => {
  const timer = setTimeout(() => setShowMapTooltip(false), 10000);
  return () => clearTimeout(timer);
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/MapTooltip.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add map legend tooltip"
```

---

## Task 6: Quick Emergency Profile Access

**Files:**
- Modify: `app/(tabs)/options.tsx`

- [ ] **Step 1: Add emergency profile quick action**

Read `app/(tabs)/options.tsx`. Find the settings list and add a quick action card for emergency profile at the top:

```tsx
// Add after imports:
import { Card } from '@/components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Add in the component, near the top:
<Pressable onPress={() => router.push('/(tabs)/medical-id')}>
  <Card style={styles.emergencyCard}>
    <View style={styles.emergencyContent}>
      <View style={[styles.emergencyIcon, { backgroundColor: `${colors.primary}20` }]}>
        <MaterialCommunityIcons name="medical-bag" size={24} color={colors.primary} />
      </View>
      <View style={styles.emergencyText}>
        <Text style={[styles.emergencyTitle, { color: colors.textPrimary }]}>
          Perfil Médico
        </Text>
        <Text style={[styles.emergencySubtitle, { color: colors.textSecondary }]}>
          Ver tu información de emergencia
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </View>
  </Card>
</Pressable>
```

Add styles:

```tsx
emergencyCard: { marginBottom: spacing.md },
emergencyContent: { flexDirection: 'row', alignItems: 'center' },
emergencyIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
emergencyText: { flex: 1, marginLeft: spacing.md },
emergencyTitle: { fontSize: 16, fontWeight: '600' },
emergencySubtitle: { fontSize: 13, marginTop: 2 },
```

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/options.tsx
git commit -m "feat: add quick emergency profile access in options"
```

---

## Verification Checklist

- [ ] EmptyState shows in all screens with async data
- [ ] OfflineBanner appears when internet disconnects
- [ ] Onboarding shows on first app launch
- [ ] SOS button triggers haptic feedback
- [ ] Map tooltip shows legend with correct colors
- [ ] Emergency profile card visible in options screen
