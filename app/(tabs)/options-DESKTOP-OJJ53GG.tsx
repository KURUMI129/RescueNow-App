import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    useColorScheme,
    useWindowDimensions,
    View,
} from "react-native";

import { BrandLogo } from "@/components/brand/brand-logo";
import { getAppCopy } from "@/constants/app-copy";
import {
  AppLanguage,
  appPreferencesStorageAvailable,
  DEFAULT_APP_PREFERENCES,
  getAppPreferences,
  subscribeToAppPreferences,
  updateAppPreferences,
} from "@/constants/app-preferences";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { useAppLanguage } from "@/hooks/use-app-language";

export default function OptionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const language = useAppLanguage(DEFAULT_APP_PREFERENCES.language);
  const [trustedContactPhone, setTrustedContactPhone] = useState(
    DEFAULT_APP_PREFERENCES.trustedContactPhone,
  );
  const [useTrustedContact, setUseTrustedContact] = useState(
    DEFAULT_APP_PREFERENCES.useTrustedContact,
  );
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);
  const { width } = useWindowDimensions();
  const titleSize = Math.max(22, Math.min(28, width * 0.075));
  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(12), []);

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoadingPrefs(true);
      const preferences = await getAppPreferences();
      setTrustedContactPhone(preferences.trustedContactPhone);
      setUseTrustedContact(preferences.useTrustedContact);
      setIsStorageAvailable(appPreferencesStorageAvailable());
      setIsLoadingPrefs(false);
    };

    void loadPreferences();

    const unsubscribe = subscribeToAppPreferences((preferences) => {
      setTrustedContactPhone(preferences.trustedContactPhone);
      setUseTrustedContact(preferences.useTrustedContact);
      setIsStorageAvailable(appPreferencesStorageAvailable());
    });

    return unsubscribe;
  }, []);

  const copy = getAppCopy(language).tabs.options;

  const handleBackToHome = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  const handleLanguageChange = async (nextLanguage: AppLanguage) => {
    if (nextLanguage === language || isSavingLanguage) {
      return;
    }

    setIsSavingLanguage(true);

    try {
      await updateAppPreferences({ language: nextLanguage });
    } finally {
      setIsStorageAvailable(appPreferencesStorageAvailable());
      setIsSavingLanguage(false);
    }
  };

  const handleSaveContact = async () => {
    if (isSavingContact) {
      return;
    }

    setIsSavingContact(true);

    try {
      const nextPrefs = await updateAppPreferences({
        trustedContactPhone,
        useTrustedContact,
      });
      setTrustedContactPhone(nextPrefs.trustedContactPhone);
      setUseTrustedContact(nextPrefs.useTrustedContact);
    } finally {
      setIsStorageAvailable(appPreferencesStorageAvailable());
      setIsSavingContact(false);
    }
  };

  const handleClearContact = async () => {
    if (isSavingContact) {
      return;
    }

    setIsSavingContact(true);

    try {
      const nextPrefs = await updateAppPreferences({
        trustedContactPhone: "",
        useTrustedContact: false,
      });
      setTrustedContactPhone(nextPrefs.trustedContactPhone);
      setUseTrustedContact(nextPrefs.useTrustedContact);
    } finally {
      setIsStorageAvailable(appPreferencesStorageAvailable());
      setIsSavingContact(false);
    }
  };

  useEffect(() => {
    if (reduceMotionEnabled) {
      entranceOpacity.setValue(1);
      entranceTranslateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslateY, {
        toValue: 0,
        duration: 340,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entranceOpacity, entranceTranslateY, reduceMotionEnabled]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.entranceLayer,
            {
              opacity: entranceOpacity,
              transform: [{ translateY: entranceTranslateY }],
            },
          ]}
        >
          <View style={styles.topBarRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.backHome}
              onPress={handleBackToHome}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          <Text style={[styles.topLabel, { color: colors.textSecondary }]}>
            {copy.topLabel}
          </Text>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, fontSize: titleSize },
            ]}
          >
            {copy.title}
          </Text>

          {isLoadingPrefs ? (
            <View
              style={[
                styles.loadingPrefsCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[
                  styles.loadingPrefsText,
                  { color: colors.textSecondary },
                ]}
              >
                {copy.loading}
              </Text>
            </View>
          ) : null}

          {!isStorageAvailable ? (
            <View
              style={[
                styles.storageWarningCard,
                {
                  backgroundColor: colors.tracking,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={16} color={colors.textPrimary} />
              <Text style={[styles.storageWarningText, { color: colors.textPrimary }]}>
                {copy.storageWarning}
              </Text>
            </View>
          ) : null}

          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.mapBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <BrandLogo width={52} height={46} />
            <View style={styles.profileTextWrap}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {copy.profileName}
              </Text>
              <Text
                style={[styles.profileEmail, { color: colors.textSecondary }]}
              >
                demo@rescuenow.app
              </Text>
            </View>
            <View
              style={[
                styles.profileBadge,
                { backgroundColor: colors.tracking },
              ]}
            >
              <Text style={styles.profileBadgeText}>{copy.activeBadge}</Text>
            </View>
          </View>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.settingsTitle, { color: colors.textPrimary }]}>
              {copy.languageTitle}
            </Text>
            <Text
              style={[styles.settingsSubtitle, { color: colors.textSecondary }]}
            >
              {copy.languageSubtitle}
            </Text>

            <View style={styles.languageRow}>
              <Pressable
                onPress={() => {
                  void handleLanguageChange("es");
                }}
                style={[
                  styles.languagePill,
                  {
                    backgroundColor:
                      language === "es" ? colors.primary : colors.mapBackground,
                    borderColor:
                      language === "es" ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.languagePillText,
                    {
                      color:
                        language === "es"
                          ? colors.onPrimary
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {copy.spanish}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void handleLanguageChange("en");
                }}
                style={[
                  styles.languagePill,
                  {
                    backgroundColor:
                      language === "en" ? colors.primary : colors.mapBackground,
                    borderColor:
                      language === "en" ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.languagePillText,
                    {
                      color:
                        language === "en"
                          ? colors.onPrimary
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {copy.english}
                </Text>
              </Pressable>
            </View>

            {isSavingLanguage ? (
              <Text style={[styles.saveHint, { color: colors.textSecondary }]}>
                {copy.saving}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.settingsTitle, { color: colors.textPrimary }]}>
              {copy.emergencyContactTitle}
            </Text>
            <Text
              style={[styles.settingsSubtitle, { color: colors.textSecondary }]}
            >
              {copy.emergencyContactSubtitle}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {copy.trustedInputLabel}
            </Text>
            <TextInput
              value={trustedContactPhone}
              onChangeText={setTrustedContactPhone}
              keyboardType="phone-pad"
              placeholder={copy.trustedInputPlaceholder}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.phoneInput,
                {
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.mapBackground,
                },
              ]}
            />

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
                {copy.directSwitchLabel}
              </Text>
              <Switch
                value={useTrustedContact}
                onValueChange={setUseTrustedContact}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.contactButtonsRow}>
              <Pressable
                onPress={() => {
                  void handleSaveContact();
                }}
                style={({ pressed }) => [
                  styles.contactButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed || isSavingContact ? 0.82 : 1,
                  },
                ]}
              >
                <Text style={styles.contactButtonText}>
                  {isSavingContact ? copy.saving : copy.saveContact}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void handleClearContact();
                }}
                style={({ pressed }) => [
                  styles.contactButton,
                  {
                    backgroundColor: colors.danger,
                    opacity: pressed || isSavingContact ? 0.82 : 1,
                  },
                ]}
              >
                <Text style={styles.contactButtonText}>
                  {copy.clearContact}
                </Text>
              </Pressable>
            </View>
          </View>

          {copy.userOptions.map((item) => {
            const iconColor =
              item.accent === "accent" ? colors.accent : colors.primary;

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: colors.mapBackground },
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color={iconColor} />
                </View>

                <View style={styles.optionTextWrap}>
                  <Text
                    style={[styles.optionTitle, { color: colors.textPrimary }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => router.replace("/(auth)/login")}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: colors.danger,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.logoutText}>{copy.logout}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  entranceLayer: {
    gap: 0,
  },
  topBarRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  topLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  loadingPrefsCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingPrefsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  storageWarningCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  storageWarningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  title: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  profileTextWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "900",
  },
  profileEmail: {
    marginTop: 2,
    fontSize: 12,
  },
  profileBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  profileBadgeText: {
    color: "#333333",
    fontSize: 11,
    fontWeight: "800",
  },
  settingsCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  settingsSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  languageRow: {
    flexDirection: "row",
    gap: 8,
  },
  languagePill: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  languagePillText: {
    fontSize: 13,
    fontWeight: "800",
  },
  saveHint: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  switchLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  contactButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  contactButton: {
    flex: 1,
    borderRadius: 10,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 14,
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
