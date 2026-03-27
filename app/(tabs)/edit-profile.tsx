import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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

import { BrandLogo } from "@/components/brand/brand-logo";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { getAppPreferences, updateAppPreferences } from "@/constants/app-preferences";

export default function EditProfileScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];

  // Variables ficticias para el UI de edición (parcialmente en app-preferences)
  const [firstName, setFirstName] = useState("Andrés");
  const [lastName, setLastName] = useState("Garza");
  const [email, setEmail] = useState("demo@rescuenow.app");
  const [phone, setPhone] = useState("+52 55 1234 5678");
  
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getAppPreferences().then(prefs => {
      setBloodType(prefs.bloodType);
      setAllergies(prefs.allergies);
      setMedicalConditions(prefs.medicalConditions);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Guardar en AppPreferences
    await updateAppPreferences({
      bloodType,
      allergies,
      medicalConditions
    });
    // Simular guardado de Firebase para Nombre, Apellido...
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.flexItem} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Edit Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.mapBackground }]}>
              <BrandLogo width={64} height={64} />
              <Pressable style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </Pressable>
            </View>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Cambiar Foto de Perfil</Text>
          </View>

          {/* Formulario */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre(s)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Apellido(s)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Ingresa tus apellidos"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Correo Electrónico</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Número de Teléfono</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+52 55 ..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Información Médica (S.O.S.)</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Esta información se mostrará en pantalla si envías una alerta y te quedas inconsciente.</Text>

          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tipo de Sangre</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="water-outline" size={20} color={colors.danger} style={styles.inputIcon} />
                <TextInput
                  value={bloodType}
                  onChangeText={setBloodType}
                  placeholder="Ej: O+, A-, B+"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Alergias</Text>
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Condiciones Médicas y Medicamentos</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder, minHeight: 80, alignItems: 'flex-start', paddingVertical: 12 }]}>
                <MaterialCommunityIcons name="medical-bag" size={20} color={colors.textSecondary} style={[styles.inputIcon, { marginTop: 4 }]} />
                <TextInput
                  value={medicalConditions}
                  onChangeText={setMedicalConditions}
                  multiline
                  placeholder="Ej: Diabético, Asma, Hipertensión..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modernInput, { color: colors.textPrimary, paddingVertical: 0, marginTop: 4 }]}
                />
              </View>
            </View>

          </View>

          {/* Botón Guardar */}
          <Pressable 
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.saveButton, { backgroundColor: isSaving ? colors.cardBorder : colors.primary }]}
          >
            {isSaving ? (
              <Text style={[styles.saveButtonText, { color: colors.textPrimary }]}>Guardando...</Text>
            ) : (
              <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>Guardar Cambios</Text>
            )}
          </Pressable>

          <Text style={[styles.hintInfo, { color: colors.textSecondary }]}>
            Los cambios se sincronizarán la próxima vez que te conectes.
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
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    borderBottomWidth: 1 
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    justifyContent: 'center', 
    alignItems: 'center', 
    position: 'relative' 
  },
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3 
  },
  changePhotoText: { marginTop: 16, fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6, paddingHorizontal: 4 },
  sectionSubtitle: { fontSize: 13, fontWeight: '500', marginBottom: 16, paddingHorizontal: 4, lineHeight: 20 },
  formContainer: { 
    borderWidth: 1, 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 24 
  },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8, marginLeft: 4, letterSpacing: 0.3 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: { marginRight: 12 },
  modernInput: { 
    flex: 1,
    fontSize: 15, 
    fontWeight: '600',
    paddingVertical: 14,
  },
  saveButton: { 
    borderRadius: 18, 
    paddingVertical: 18,  
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  saveButtonText: { fontSize: 15, fontWeight: '800' },
  hintInfo: { textAlign: 'center', fontSize: 12, fontWeight: '500' }
});
