# RescueNow Additional Features Implementation Plan

**Goal:** Implement 10 additional features for demo: Safety Check-in, Location History, Share App, In-app Tutorial, Custom SOS Sound, Crash Sensitivity Settings, Contact Widget, Weather Widget, Battery Indicator, Usage Stats.

**Architecture:** Create new screens and components. Store preferences locally. No backend changes.

**Tech Stack:** React Native, Expo, AsyncStorage, expo-location, expo-haptics

---

## File Structure

```
screens/features:
  app/(tabs)/safety-check.tsx      # NEW - Safety check-in
  app/(tabs)/location-history.tsx   # NEW - Emergency location history
  app/(tabs)/usage-stats.tsx        # NEW - Usage statistics
  app/(tabs)/settings.tsx           # NEW - Additional settings screen
  app/tutorial.tsx                  # NEW - In-app tutorial

components/features:
  components/features/
    ContactShortcut.tsx             # NEW - Contact call widget
    BatteryWarning.tsx            # NEW - Battery indicator
    WeatherWidget.tsx             # NEW - Weather info widget
    UsageStatsCard.tsx             # NEW - Stats display

constants/
  safety-settings.ts               # NEW - Check-in timing options
```

---

## Task 1: Battery Warning Component

**Files:**
- Create: `components/features/BatteryWarning.tsx`

- [ ] **Step 1: Create BatteryWarning.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing, borderRadius } from '@/constants/design-tokens';

const LOW_BATTERY_THRESHOLD = 20;

export function BatteryWarning() {
  const { colors } = useActiveTheme();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    const getBatteryLevel = async () => {
      try {
        const Battery = await import('expo-battery');
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(level * 100));
      } catch {
        setBatteryLevel(null);
      }
    };
    getBatteryLevel();
  }, []);

  if (!batteryLevel || batteryLevel > LOW_BATTERY_THRESHOLD) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.warning }]}>
      <Ionicons name="battery-alert" size={16} color="#000" />
      <Text style={styles.text}>Batería baja: {batteryLevel}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  text: { fontSize: 12, fontWeight: '600', color: '#000' },
});
```

- [ ] **Step 2: Add to home screen**

Read app/(tabs)/index.tsx, add BatteryWarning near the top.

- [ ] **Step 3: Commit**

```bash
git add components/features/BatteryWarning.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add battery warning indicator"
```

---

## Task 2: Usage Statistics

**Files:**
- Create: `components/features/UsageStatsCard.tsx`
- Create: `app/(tabs)/usage-stats.tsx`

- [ ] **Step 1: Create UsageStatsCard.tsx**

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing, borderRadius } from '@/constants/design-tokens';
import { Card } from '@/components/ui/Card';

interface StatItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
}

interface UsageStatsCardProps {
  sosCount: number;
  crashDetections: number;
  checkIns: number;
}

export function UsageStatsCard({ sosCount, crashDetections, checkIns }: UsageStatsCardProps) {
  const { colors } = useActiveTheme();

  const stats: StatItem[] = [
    { icon: 'warning', label: 'Emergencias', value: sosCount, color: colors.primary },
    { icon: 'car', label: 'Detections crash', value: crashDetections, color: colors.warning },
    { icon: 'shield-checkmark', label: 'Check-ins', value: checkIns, color: colors.success },
  ];

  return (
    <Card elevated>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Estadísticas</Text>
      <View style={styles.stats}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text style={[styles.value, { color: colors.textPrimary }]}>{stat.value}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 24, fontWeight: '700', marginTop: spacing.xs },
  label: { fontSize: 11, marginTop: 2 },
});
```

- [ ] **Step 2: Create usage-stats.tsx screen**

```tsx
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { HOME_THEME_COLORS } from '@/constants/home-theme';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { UsageStatsCard } from '@/components/features/UsageStatsCard';

const STATS_KEY = '@rescuenow_usage_stats_v1';

export default function UsageStatsScreen() {
  const insets = useSafeAreaInsets();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];

  const [stats, setStats] = useState({ sosCount: 0, crashDetections: 0, checkIns: 0 });

  useEffect(() => {
    AsyncStorage.getItem(STATS_KEY).then((data) => {
      if (data) setStats(JSON.parse(data));
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Estadísticas" showBack onBack={() => router.back()} />
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <UsageStatsCard {...stats} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/features/UsageStatsCard.tsx app/\(tabs\)/usage-stats.tsx
git commit -m "feat: add usage statistics screen"
```

---

## Task 3: Share App Component

**Files:**
- Create: `components/features/ShareAppCard.tsx`
- Modify: `app/(tabs)/options.tsx`

- [ ] **Step 1: Create ShareAppCard.tsx**

```tsx
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing, borderRadius } from '@/constants/design-tokens';
import { Card } from '@/components/ui/Card';

const APP_LINK = 'https://rescuenow.app/download';

export function ShareAppCard() {
  const { colors } = useActiveTheme();

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: 'Descarga RescueNow - Tu app de emergencia personal. ' + APP_LINK,
        title: 'RescueNow',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir');
    }
  };

  return (
    <Card onPress={handleShare}>
      <View style={styles.container}>
        <View style={[styles.icon, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="share-social" size={24} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Compartir RescueNow</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Invita a tus seres queridos a protegerse
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2 },
});
```

- [ ] **Step 2: Add to options screen**

Read app/(tabs)/options.tsx, add ShareAppCard in the options list.

- [ ] **Step 3: Commit**

```bash
git add components/features/ShareAppCard.tsx app/\(tabs\)/options.tsx
git commit -m "feat: add share app feature"
```

---

## Task 4: Contact Shortcuts Widget

**Files:**
- Create: `components/features/ContactShortcut.tsx`
- Modify: `app/(tabs)/index.tsx` (home screen)

- [ ] **Step 1: Create ContactShortcut.tsx**

```tsx
import { Alert, Call, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing, borderRadius } from '@/constants/design-tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface Contact {
  name: string;
  phone: string;
}

export function ContactShortcut() {
  const { colors } = useActiveTheme();
  const [trustedContact, setTrustedContact] = useState<Contact | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@rescuenow_trusted_contact').then((data) => {
      if (data) {
        const contact = JSON.parse(data);
        setTrustedContact(contact);
      }
    });
  }, []);

  const handleCall = async () => {
    if (!trustedContact?.phone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const supported = await Linking.canOpenURL(`tel:${trustedContact.phone}`);
    if (supported) {
      await Linking.openURL(`tel:${trustedContact.phone}`);
    } else {
      Alert.alert('Error', 'No se puede realizar llamadas');
    }
  };

  if (!trustedContact) return null;

  return (
    <TouchableOpacity
      onPress={handleCall}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <View style={[styles.icon, { backgroundColor: `${colors.success}20` }]}>
        <Ionicons name="call" size={20} color={colors.success} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Contactos de emergencia</Text>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{trustedContact.name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, marginLeft: spacing.sm },
  label: { fontSize: 11 },
  name: { fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Step 2: Add to home screen**

Read app/(tabs)/index.tsx, add ContactShortcut in the header area or near the map.

- [ ] **Step 3: Commit**

```bash
git add components/features/ContactShortcut.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add contact shortcut widget"
```

---

## Task 5: In-App Tutorial

**Files:**
- Create: `hooks/useTutorial.ts`
- Create: `app/tutorial.tsx`

- [ ] **Step 1: Create useTutorial.ts**

```tsx
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_KEY = '@rescuenow_tutorial_v1';

export function useTutorial() {
  const [shownThisSession, setShownThisSession] = useState(false);

  const showTutorial = async () => {
    await AsyncStorage.setItem(TUTORIAL_KEY, 'shown');
    setShownThisSession(true);
  };

  return { showTutorial, shownThisSession };
}
```

- [ ] **Step 2: Create tutorial.tsx screen**

3 pasos con highlight de elementos:
1. "Presiona el botón rojo SOS para activar emergencia"
2. "Los marcadores en el mapa muestran servicios cercanos"
3. "Tu contacto de confianza será notificado"

```tsx
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useTutorial } from '@/hooks/useTutorial';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  {
    icon: 'warning',
    title: 'Botón SOS',
    description: 'Presiona el botón rojo para activar la emergencia',
  },
  {
    icon: 'map',
    title: 'Mapa de servicios',
    description: 'Los marcadores muestran servicios de emergencia cercanos',
  },
  {
    icon: 'people',
    title: 'Contacto de confianza',
    description: 'Tu contacto será notificado cuando actives el SOS',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const { colors } = useActiveTheme();
  const { showTutorial } = useTutorial();

  const handleFinish = () => {
    showTutorial();
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {TUTORIAL_STEPS.map((step, index) => (
          <View key={index} style={styles.step}>
            <View style={[styles.iconCircle, { borderColor: colors.primary }]}>
              <Ionicons name={step.icon as any} size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{step.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{step.description}</Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Button title="Entendido" onPress={handleFinish} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  step: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginTop: 16 },
  description: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  footer: { padding: 24 },
});
```

- [ ] **Step 3: Add tutorial button to options**

Read app/(tabs)/options.tsx, add a "Ver tutorial" option that navigates to /tutorial.

- [ ] **Step 4: Commit**

```bash
git add hooks/useTutorial.ts app/tutorial.tsx app/\(tabs\)/options.tsx
git commit -m "feat: add in-app tutorial feature"
```

---

## Task 6: Custom SOS Sound Settings

**Files:**
- Create: `constants/sos-settings.ts`
- Modify: `app/(tabs)/options.tsx`

- [ ] **Step 1: Create sos-settings.ts**

```tsx
export type SOSSoundOption = 'default' | 'alarm' | 'siren' | 'silent';

export interface SOSSettings {
  sound: SOSSoundOption;
  vibration: boolean;
}

export const SOS_SOUND_OPTIONS: { id: SOSSoundOption; label: string; icon: string }[] = [
  { id: 'default', label: 'Alerta predeterminada', icon: 'notifications' },
  { id: 'alarm', label: 'Alarma', icon: 'alarm' },
  { id: 'siren', label: 'Sirena', icon: 'megaphone' },
  { id: 'silent', label: 'Silencioso', icon: 'volume-mute' },
];

export const DEFAULT_SOS_SETTINGS: SOSSettings = {
  sound: 'default',
  vibration: true,
};
```

- [ ] **Step 2: Add sound settings to options**

Read app/(tabs)/options.tsx, add a section for SOS sound selection with radio buttons.

- [ ] **Step 3: Commit**

```bash
git add constants/sos-settings.ts app/\(tabs\)/options.tsx
git commit -m "feat: add custom SOS sound settings"
```

---

## Task 7: Crash Sensitivity Settings

**Files:**
- Create: `constants/crash-settings.ts`
- Create: `components/features/CrashSensitivitySlider.tsx`
- Modify: `app/(tabs)/options.tsx`

- [ ] **Step 1: Create crash-settings.ts**

```tsx
export interface CrashSensitivitySettings {
  enabled: boolean;
  threshold: number; // 1-10, default 5
  delaySeconds: number; // 0-30, default 10
}

export const DEFAULT_CRASH_SETTINGS: CrashSensitivitySettings = {
  enabled: true,
  threshold: 5,
  delaySeconds: 10,
};
```

- [ ] **Step 2: Create CrashSensitivitySlider.tsx**

```tsx
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing } from '@/constants/design-tokens';
import { Card } from '@/components/ui/Card';

interface CrashSensitivitySliderProps {
  threshold: number;
  onThresholdChange: (value: number) => void;
  label: string;
}

export function CrashSensitivitySlider({ threshold, onThresholdChange, label }: CrashSensitivitySliderProps) {
  const { colors } = useActiveTheme();

  return (
    <Card>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.sliderRow}>
        <Text style={[styles.min, { color: colors.textMuted }]}>Bajo</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={threshold}
          onValueChange={onThresholdChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <Text style={[styles.max, { color: colors.textMuted }]}>Alto</Text>
      </View>
      <Text style={[styles.value, { color: colors.textSecondary }]}>
        Nivel: {threshold} {threshold <= 3 ? '(Suave)' : threshold <= 7 ? '(Normal)' : '(Sensible)'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  slider: { flex: 1, height: 40 },
  min: { fontSize: 11 },
  max: { fontSize: 11 },
  value: { fontSize: 12, marginTop: spacing.xs, textAlign: 'center' },
});
```

- [ ] **Step 3: Add to options screen**

Add crash sensitivity settings section in options.

- [ ] **Step 4: Commit**

```bash
git add constants/crash-settings.ts components/features/CrashSensitivitySlider.tsx app/\(tabs\)/options.tsx
git commit -m "feat: add crash detection sensitivity settings"
```

---

## Task 8: Weather Widget

**Files:**
- Create: `components/features/WeatherWidget.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create WeatherWidget.tsx**

```tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Weather from 'expo-weather';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { spacing, borderRadius } from '@/constants/design-tokens';

interface WeatherData {
  temperature: number;
  condition: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function WeatherWidget() {
  const { colors } = useActiveTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const { status } = await Weather.requestPermissionsAsync();
        if (status !== 'granted') return;

        const data = await Weather.getWeatherAsync();
        const temp = Math.round(data.temperature);
        const condition = data.condition;

        let icon: keyof typeof Ionicons.glyphMap = 'sunny';
        if (condition.includes('rain')) icon = 'rainy';
        else if (condition.includes('cloud')) icon = 'cloudy';
        else if (condition.includes('snow')) icon = 'snow';
        else if (condition.includes('thunder')) icon = 'thunderstorm';

        setWeather({ temperature: temp, condition, icon });
      } catch {
        setWeather(null);
      }
    };
    fetchWeather();
  }, []);

  if (!weather) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Ionicons name={weather.icon} size={24} color={colors.secondary} />
      <View style={styles.text}>
        <Text style={[styles.temp, { color: colors.textPrimary }]}>{weather.temperature}°C</Text>
        <Text style={[styles.condition, { color: colors.textSecondary }]}>{weather.condition}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  text: {},
  temp: { fontSize: 16, fontWeight: '700' },
  condition: { fontSize: 11 },
});
```

- [ ] **Step 2: Add to home screen**

Read app/(tabs)/index.tsx, add WeatherWidget in the header or near map.

- [ ] **Step 3: Commit**

```bash
git add components/features/WeatherWidget.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add weather widget"
```

---

## Task 9: Safety Check-in Feature

**Files:**
- Create: `app/(tabs)/safety-check.tsx`

- [ ] **Step 1: Create safety-check.tsx screen**

```tsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';

const CHECK_IN_KEY = '@rescuenow_checkin_v1';
const CHECK_IN_INTERVAL_OPTIONS = [1, 2, 4, 8, 12]; // hours

interface CheckInSettings {
  enabled: boolean;
  intervalHours: number;
  lastCheckIn: string | null;
}

export default function SafetyCheckScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useActiveTheme();
  const [settings, setSettings] = useState<CheckInSettings>({
    enabled: false,
    intervalHours: 4,
    lastCheckIn: null,
  });
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CHECK_IN_KEY).then((data) => {
      if (data) setSettings(JSON.parse(data));
    });
  }, []);

  const handleCheckIn = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date().toISOString();
    const updated = { ...settings, lastCheckIn: now };
    setSettings(updated);
    await AsyncStorage.setItem(CHECK_IN_KEY, JSON.stringify(updated));
  };

  const toggleEnabled = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings({ ...settings, enabled: value });
    await AsyncStorage.setItem(CHECK_IN_KEY, JSON.stringify({ ...settings, enabled: value }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Safety Check-in" showBack />
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <Card elevated>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Auto Check-in</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Notifica si no respondes en {settings.intervalHours}h
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </Card>

        {settings.enabled && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Intervalo de verificación
            </Text>
            <View style={styles.intervalButtons}>
              {CHECK_IN_INTERVAL_OPTIONS.map((hours) => (
                <Button
                  key={hours}
                  title={`${hours}h`}
                  variant={settings.intervalHours === hours ? 'primary' : 'ghost'}
                  size="sm"
                  onPress={() => {
                    setSettings({ ...settings, intervalHours: hours });
                    AsyncStorage.setItem(CHECK_IN_KEY, JSON.stringify({ ...settings, intervalHours: hours }));
                  }}
                />
              ))}
            </View>
          </>
        )}

        <Card style={styles.checkInCard}>
          <Ionicons name="shield-checkmark" size={48} color={colors.success} />
          <Text style={[styles.checkInTitle, { color: colors.textPrimary }]}>
            {settings.lastCheckIn ? 'Checked in' : 'No checked in yet'}
          </Text>
          <Button title="Check-in ahora" onPress={handleCheckIn} size="lg" />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  intervalButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  checkInCard: { alignItems: 'center', marginTop: 24 },
  checkInTitle: { fontSize: 16, marginVertical: 16 },
});
```

- [ ] **Step 2: Add navigation link in options**

Read app/(tabs)/options.tsx, add "Safety Check-in" option.

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/safety-check.tsx app/\(tabs\)/options.tsx
git commit -m "feat: add safety check-in feature"
```

---

## Task 10: Location History

**Files:**
- Create: `app/(tabs)/location-history.tsx`

- [ ] **Step 1: Create location-history.tsx screen**

```tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';

const HISTORY_KEY = '@rescuenow_location_history_v1';

interface LocationEntry {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  type: 'sos' | 'crash' | 'checkin';
}

export default function LocationHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useActiveTheme();
  const [history, setHistory] = useState<LocationEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((data) => {
      if (data) setHistory(JSON.parse(data));
    });
  }, []);

  const getIcon = (type: LocationEntry['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'sos': return 'warning';
      case 'crash': return 'car';
      case 'checkin': return 'shield-checkmark';
    }
  };

  const getColor = (type: LocationEntry['type']) => {
    switch (type) {
      case 'sos': return colors.primary;
      case 'crash': return colors.warning;
      case 'checkin': return colors.success;
    }
  };

  const renderItem = ({ item }: { item: LocationEntry }) => (
    <Card style={styles.historyItem}>
      <View style={[styles.icon, { backgroundColor: `${getColor(item.type)}20` }]}>
        <Ionicons name={getIcon(item.type)} size={20} color={getColor(item.type)} />
      </View>
      <View style={styles.itemText}>
        <Text style={[styles.itemType, { color: colors.textPrimary }]}>
          {item.type.toUpperCase()}
        </Text>
        <Text style={[styles.itemCoords, { color: colors.textSecondary }]}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
        <Text style={[styles.itemDate, { color: colors.textMuted }]}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Historial de ubicaciones" showBack />
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        {history.length === 0 ? (
          <EmptyState type="empty" title="Sin historial" subtitle="Las ubicaciones aparecerán aquí" />
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  list: { gap: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, marginLeft: 12 },
  itemType: { fontSize: 14, fontWeight: '600' },
  itemCoords: { fontSize: 12, marginTop: 2 },
  itemDate: { fontSize: 11, marginTop: 2 },
});
```

- [ ] **Step 2: Add navigation link in options**

Read app/(tabs)/options.tsx, add "Historial de ubicaciones" option.

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/location-history.tsx app/\(tabs\)/options.tsx
git commit -m "feat: add location history screen"
```

---

## Verification Checklist

- [ ] BatteryWarning shows when battery < 20%
- [ ] UsageStats displays counts correctly
- [ ] ShareApp opens system share sheet
- [ ] ContactShortcut shows trusted contact and can call
- [ ] Tutorial shows 3 steps
- [ ] SOS sound settings save preference
- [ ] Crash sensitivity slider works
- [ ] WeatherWidget shows current weather
- [ ] Safety Check-in timer works
- [ ] Location history shows past locations
