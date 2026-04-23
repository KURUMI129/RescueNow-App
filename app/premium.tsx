import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getAppPreferences, updateAppPreferences, SubscriptionPlan } from "@/constants/app-preferences";

export default function PremiumScreen() {
  const router = useRouter();
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppPreferences().then(prefs => {
      setPlan(prefs.subscriptionPlan);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' }]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  const isPremium = plan === "premium";

  return (
    <LinearGradient colors={["#0D1117", "#1A202A", "#1e1e24"]} style={styles.container}>
      <StatusBar hidden />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo & Intro */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={isPremium ? ["#00B4DB", "#0083B0", "#005C97"] : ["#FFD700", "#FDB931", "#E69A00"]}
              style={[styles.iconBadge, isPremium && { shadowColor: "#00B4DB" }]}
            >
              <MaterialCommunityIcons 
                name={isPremium ? "shield-check" : "star-shooting"} 
                size={40} 
                color={isPremium ? "#FFF" : "#000"} 
              />
            </LinearGradient>
            <Text style={styles.title}>
              RescueNow <Text style={isPremium ? styles.activeText : styles.premiumText}>Premium</Text>
            </Text>
            <Text style={styles.subtitle}>
              {isPremium 
                ? "Tienes la protección máxima. Tu asistente VIP está en línea y configurado."
                : "Tu asistente y protección vehicular llevados al máximo nivel competitivo."}
            </Text>
          </View>

          {isPremium ? (
            /* =================== PREMIUM DASHBOARD =================== */
            <>
              <BlurView intensity={30} tint="dark" style={[styles.priceCard, { borderColor: "rgba(0,180,219,0.3)" }]}>
                <Text style={styles.statusTitle}>Estado de Suscripción</Text>
                <Text style={[styles.priceValue, { color: "#00B4DB" }]}>Activa</Text>
                <Text style={styles.priceDesc}>Renovación automática: 20 de Mayo, 2026</Text>
              </BlurView>

              <Text style={styles.featuresHeading}>Tus Beneficios VIP Activos</Text>
              
              <View style={styles.comparisonContainer}>
                <View style={[styles.featureRow, { borderColor: "rgba(0,180,219,0.15)", backgroundColor: "rgba(0,180,219,0.05)" }]}>
                  <View style={styles.featureInfo}>
                     <Text style={[styles.featureTitle, {color: '#FFF'}]}>IA en Tíempo Real Sin Límites</Text>
                     <Text style={styles.featureSub}>Acceso directo a Claude Neural Engine (Haiku 4.5) sin pausas publicitarias ni restricciones.</Text>
                  </View>
                  <Ionicons name="flash" size={24} color="#00B4DB" />
                </View>
                <View style={[styles.featureRow, { borderColor: "rgba(0,180,219,0.15)", backgroundColor: "rgba(0,180,219,0.05)" }]}>
                  <View style={styles.featureInfo}>
                     <Text style={[styles.featureTitle, {color: '#FFF'}]}>Diagnósticos Avanzados</Text>
                     <Text style={styles.featureSub}>Lectura de códigos e instrucciones exactas de mecánica profunda a cualquier hora.</Text>
                  </View>
                  <Ionicons name="car-sport" size={24} color="#00B4DB" />
                </View>
                <View style={[styles.featureRow, { borderColor: "rgba(0,180,219,0.15)", backgroundColor: "rgba(0,180,219,0.05)" }]}>
                  <View style={styles.featureInfo}>
                     <Text style={[styles.featureTitle, {color: '#FFF'}]}>Escudo Legal</Text>
                     <Text style={styles.featureSub}>Respaldos técnicos para evitar que seguros o ajustadores te manipulen.</Text>
                  </View>
                  <Ionicons name="shield-half" size={24} color="#00B4DB" />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.cancelLink}
                onPress={async () => {
                  await updateAppPreferences({ subscriptionPlan: "free" });
                  setPlan("free");
                }}
              >
                <Text style={styles.cancelText}>Cancelar Suscripción</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* =================== FREE UPSELL =================== */
            <>
              <BlurView intensity={30} tint="dark" style={styles.priceCard}>
                <Text style={styles.priceValue}>$89 <Text style={styles.pricePeriod}>MXN / mes</Text></Text>
                <Text style={styles.priceDesc}>Cancela en cualquier momento. Sin contratos ocultos.</Text>
              </BlurView>

              <Text style={styles.featuresHeading}>Lo que incluye</Text>
              
              <View style={styles.comparisonContainer}>
                
                <View style={styles.featureRow}>
                  <View style={styles.featureInfo}>
                     <Text style={styles.featureTitle}>Diagnóstico Mecánico Complejo</Text>
                     <Text style={styles.featureSub}>Análisis de todos los ruidos y códigos de falla OBD2.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                </View>

                <View style={styles.featureRow}>
                  <View style={styles.featureInfo}>
                     <Text style={styles.featureTitle}>Asesoría Legal y de Seguros</Text>
                     <Text style={styles.featureSub}>Qué hacer ante choque, peritajes o policías de tránsito.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                </View>

                <View style={styles.featureRow}>
                  <View style={styles.featureInfo}>
                     <Text style={styles.featureTitle}>Gestión de Mantenimiento</Text>
                     <Text style={styles.featureSub}>Tablas de revisión exhaustiva según tu kilometraje.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                </View>

                <View style={styles.featureRow}>
                  <View style={styles.featureInfo}>
                     <Text style={styles.featureTitle}>Emergencias Médicas VIP</Text>
                     <Text style={styles.featureSub}>Soporte prioritario y pasos de primeros auxilios inmediatos.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                </View>

              </View>

              <View style={styles.freePlanNotice}>
                 <Text style={styles.freePlanText}>
                   El usuario gratis está limitado a tips básicos, recomendaciones superficiales de clima y apoyo inicial urgente.
                 </Text>
              </View>
            </>
          )}
        </ScrollView>

        {!isPremium && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={async () => {
                await updateAppPreferences({ subscriptionPlan: "premium" });
                setPlan("premium");
              }}
            >
              <LinearGradient
                 colors={["#FFD700", "#D4AF37", "#B8860B"]}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 1 }}
                 style={styles.buyGradient}
              >
                 <MaterialCommunityIcons name="star-circle" size={24} color="#1A1A1A" style={{marginRight: 8}}/>
                 <Text style={styles.buyText}>Desbloquear Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    width: "100%",
    alignItems: "flex-end",
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 30,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  premiumText: {
    color: "#FFD700",
  },
  activeText: {
    color: "#00B4DB",
  },
  subtitle: {
    fontSize: 15,
    color: "#A0AAB5",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "85%",
  },
  priceCard: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    overflow: "hidden",
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 18,
    fontWeight: "600",
    color: "#A0AAB5",
  },
  priceDesc: {
    fontSize: 14,
    color: "#7E8C9A",
  },
  featuresHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  comparisonContainer: {
    gap: 16,
    marginBottom: 30,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  featureInfo: {
    flex: 1,
    paddingRight: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E2E8F0",
    marginBottom: 4,
  },
  featureSub: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
  },
  freePlanNotice: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  freePlanText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
  },
  cancelLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  cancelText: {
    color: '#E11D48',
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "rgba(13, 17, 23, 0.9)",
  },
  buyButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  buyGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buyText: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "800",
  },
});
