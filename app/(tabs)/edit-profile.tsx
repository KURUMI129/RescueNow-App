import { useActiveTheme } from "@/hooks/use-active-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firestoreDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
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

  const { user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const parts = (user.displayName ?? "").split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phoneNumber ?? "");
      setPhotoUrl(user.photoURL ?? null);
    }
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUrl(uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Update Firebase Auth displayName + photoURL (always works)
      await updateProfile(user, { displayName: fullName, photoURL: photoUrl ?? undefined });

      // Try syncing to Firestore (best-effort)
      try {
        await setDoc(doc(firestoreDb, "users", user.uid), {
          fullName,
          phone: phone.trim(),
          email: email.trim(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (firestoreError) {
        console.warn("Firestore sync failed (profile saved to Auth):", firestoreError);
      }

      router.back();
    } catch (e) {
      console.error("Error saving profile:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}>
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
            <Pressable onPress={pickImage}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.mapBackground }]}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarPhoto} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarFallbackText}>
                      {(user?.displayName ?? "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                  <Ionicons name="camera" size={16} color="#ffffff" />
                </View>
              </View>
            </Pressable>
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
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
              isSaving && { opacity: 0.7 },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>Guardar Cambios</Text>
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
    borderBottomWidth: 1,
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
  avatarPhoto: { width: 110, height: 110, borderRadius: 55 },
  avatarFallback: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: '#FFFFFF', fontSize: 42, fontWeight: '900' },
  formContainer: { borderRadius: 20, padding: 20, paddingBottom: 8, marginBottom: 24, borderWidth: 1, shadowColor: '#0B1120', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8, paddingLeft: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 14, borderWidth: 1 },
  inputIcon: { marginRight: 12 },
  modernInput: { flex: 1, height: 52, fontSize: 16, fontWeight: "600" },
  saveButton: { width: "100%", paddingVertical: 18, borderRadius: 16, alignItems: "center", shadowColor: '#0B1120', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  saveButtonText: { fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
});
