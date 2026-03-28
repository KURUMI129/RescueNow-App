import { useActiveTheme } from "@/hooks/use-active-theme";
import { getAppPreferences, updateAppPreferences } from "@/constants/app-preferences";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

export default function MedicalIdScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];

  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ])
    ).start();

    void getAppPreferences().then(prefs => {
      setBloodType(prefs.bloodType);
      setAllergies(prefs.allergies);
      setMedicalConditions(prefs.medicalConditions);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Guardar en AppPreferences locales
    await updateAppPreferences({
      bloodType,
      allergies,
      medicalConditions
    });
    
    // TODO: Copilot Backend - Guardado en Firebase
    // La app prototipo solo guarda en local (AsyncStorage), para el final:
    // 1. Asegúrate de tener la Firebase App inicializada
    // 2. Si manejas un Users Collection en Firestore, ejecuta lo siguiente:
    // setDoc(doc(firestoreDb, "users", firebaseAuth.currentUser.uid), { 
    //   bloodType: bloodType, 
    //   allergies: allergies, 
    //   medicalConditions: medicalConditions 
    // }, { merge: true })
    
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* HEADER EXCLUSIVO MÉDICO */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Ionicons name="medical" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary, flex: 1 }]}>Ficha Médica S.O.S</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.flexItem} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerDisplay}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialCommunityIcons name="heart-pulse" size={48} color="#FF3B30" />
              </Animated.View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Esta información vital se mostrará en pantalla a los paramédicos si envías una alerta y te encuentras inconsciente.
            </Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Grupo Sanguíneo</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="water-outline" size={20} color="#FF3B30" style={styles.inputIcon} />
                <TextInput
                  value={bloodType}
                  onChangeText={setBloodType}
                  placeholder="Ej: O+, A-, B+"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Alergias Severas</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="pill" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder="Ej: Penicilina, Nueces (o N/A)"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Condiciones o Medicamentos Regulares</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder, minHeight: 100, alignItems: 'flex-start', paddingVertical: 12 }]}>
                <MaterialCommunityIcons name="medical-bag" size={20} color={colors.textSecondary} style={[styles.inputIcon, { marginTop: 4 }]} />
                <TextInput
                  value={medicalConditions}
                  onChangeText={setMedicalConditions}
                  multiline
                  placeholder="Ej: Diabético tipo 1, Asma severa, Hipertensión..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary, paddingVertical: 0, marginTop: 4, height: 80 }]}
                />
              </View>
            </View>

          </View>

          {/* Botón Guardar */}
          <Pressable 
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.saveButton, { backgroundColor: isSaving ? colors.cardBorder : '#FF3B30' }]}
          >
            {isSaving ? (
              <Text style={[styles.saveButtonText, { color: colors.textPrimary }]}>Guardando...</Text>
            ) : (
              <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>Salvar Ficha Médica</Text>
            )}
          </Pressable>

          <Text style={[styles.hintInfo, { color: colors.textSecondary }]}>
            Al salvar tu ficha médica, autorizas que RescueNow comparta estos datos con los cuerpos de rescate en caso de emitir una señal de auxilio S.O.S.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flexItem: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    borderBottomWidth: 1 
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 60 },
  headerDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  formContainer: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 8,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#FF3B30",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveButtonText: {
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  hintInfo: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    lineHeight: 18,
  },
});
