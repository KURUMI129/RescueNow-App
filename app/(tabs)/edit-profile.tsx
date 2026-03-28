import { useActiveTheme } from "@/hooks/use-active-theme";
import { BrandLogo } from "@/components/brand/brand-logo";
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
import { HOME_THEME_COLORS } from "@/constants/home-theme";

export default function EditProfileScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];

  const [firstName, setFirstName] = useState("Andrés");
  const [lastName, setLastName] = useState("Garza");
  const [email, setEmail] = useState("demo@rescuenow.app");
  const [phone, setPhone] = useState("+52 55 1234 5678");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Aquí cargarías el perfil real de Firebase Auth
    // setFirstName(firebaseAuth.currentUser?.displayName?.split(' ')[0] || "");
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Simular actualización del perfil básico (Firebase)
    
    // TODO: Copilot Backend - Guardado en Firebase
    // 1. Usar updateProfile(firebaseAuth.currentUser) para actulizar displayName.
    // 2. Usar setDoc(doc(firestoreDb...)) con merge:true para guardar teléfono y otros campos extras.
    
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
              {/* TODO: Copilot Backend - Integrar expo-image-picker aquí. Al presionar, abre galería. 
                  Sube archivo a Firebase Storage, obtén la URL y ejecuta updateProfile(photoURL). */}
              <Pressable style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </Pressable>
            </View>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Cambiar Foto de Perfil</Text>
          </View>

          {/* Formulario */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre(s)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.modernInput, { color: colors.textPrimary }]}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Apellidos</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Tus apellidos"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.modernInput, { color: colors.textPrimary }]}
                  />
                </View>
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

          {/* Botón Guardar */}
          <Pressable 
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.saveButton, { backgroundColor: isSaving ? colors.cardBorder : colors.primary }]}
          >
            {isSaving ? (
              <Text style={[styles.saveButtonText, { color: colors.textPrimary }]}>Guardando...</Text>
            ) : (
              <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>Guardar Cambios Básicos</Text>
            )}
          </Pressable>

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
    position: 'relative',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  changePhotoText: { marginTop: 12, fontSize: 13, fontWeight: '700' },
  formContainer: { borderWidth: 1, borderRadius: 20, padding: 20, paddingBottom: 8, marginBottom: 24 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8, paddingLeft: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  inputIcon: { marginRight: 12 },
  modernInput: { flex: 1, height: 52, fontSize: 16, fontWeight: "600" },
  saveButton: { width: "100%", paddingVertical: 18, borderRadius: 20, alignItems: "center", elevation: 4 },
  saveButtonText: { fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
});
