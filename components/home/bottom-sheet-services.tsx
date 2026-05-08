import React from "react";
import { StyleSheet, Text, View, Pressable, Animated as RNAnimated, PanResponderInstance, ScrollView, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MAP_SERVICES } from "@/constants/services";

interface BottomSheetProps {
  sheetAnim: RNAnimated.Value;
  activeTheme: "light" | "dark";
  colors: any;
  language: string;
  panResponder: PanResponderInstance;
  selectedService: string | null;
  loadingPOIs: boolean;
  poiCount: number;
  onToggleService: (id: string) => void;
}

export function BottomSheetServices({
  sheetAnim,
  activeTheme,
  colors,
  language,
  panResponder,
  selectedService,
  loadingPOIs,
  poiCount,
  onToggleService,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <RNAnimated.View 
      style={[
        styles.bottomSheet, 
        { height: sheetAnim }
      ]}
    >
      <BlurView 
        intensity={activeTheme === "dark" ? 40 : 80} 
        tint={activeTheme} 
        style={[{ flex: 1, backgroundColor: 'transparent', paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        {/* Manija de Arrastre */}
        <View style={styles.dragHandleWrapper} {...panResponder.panHandlers}>
          <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary, opacity: 0.3 }]} />
        </View>

        <View style={styles.sheetTitleRow}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
            {language === "es" ? "¿Qué asistencia necesitas?" : "What assistance do you need?"}
          </Text>
          {loadingPOIs && (
            <View style={[styles.loadingPill, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={[styles.loadingPillText, { color: colors.textSecondary }]}>
                {language === "es" ? "Buscando..." : "Searching..."}
              </Text>
            </View>
          )}
          {!loadingPOIs && selectedService && poiCount > 0 && (
            <View style={[styles.loadingPill, { backgroundColor: `${colors.accent}15` }]}>
              <Text style={[styles.loadingPillText, { color: colors.accent }]}>
                {poiCount} {language === "es" ? "encontrados" : "found"}
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridMode}
        >
          {MAP_SERVICES.map((service, idx) => {
            const isSelected = selectedService === service.id;
            const bgColor = isSelected ? `${service.colorHex}15` : 'transparent';
            const shadowForce = isSelected ? { shadowColor: service.colorHex, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 0 } : {};

            return (
              <Animated.View key={service.id} entering={FadeInDown.delay(100 + idx * 60).springify()}>
                <Pressable
                  onPress={() => onToggleService(service.id)}
                  style={[
                    styles.serviceListCard,
                    { backgroundColor: bgColor, borderLeftColor: isSelected ? service.colorHex : 'transparent' },
                    shadowForce
                  ]}
                >
                  <View style={[styles.serviceIconWrap, { backgroundColor: `${service.colorHex}15` }]}>
                    <MaterialCommunityIcons 
                      name={service.icon} 
                      size={24} 
                      color={isSelected ? service.colorHex : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.serviceTextWrap}>
                    <Text style={[styles.serviceTitle, { color: colors.textPrimary }]}>
                      {language === "es" ? service.titleEs : service.titleEn}
                    </Text>
                    <Text style={[styles.serviceDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                      {language === "es" ? service.descEs : service.descEn}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      </BlurView>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', borderTopLeftRadius: 36, borderTopRightRadius: 36, zIndex: 20, shadowColor: "#0B1120", shadowOpacity: 0.15, shadowRadius: 32, shadowOffset: { width: 0, height: -12 }, elevation: 0, overflow: 'hidden' },
  dragHandleWrapper: { width: '100%', alignItems: 'center', paddingVertical: 14 },
  dragHandle: { width: 40, height: 4, borderRadius: 2 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.2, flex: 1 },
  loadingPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  loadingPillText: { fontSize: 12, fontWeight: '700' },
  gridMode: { paddingHorizontal: 20, paddingBottom: 24 },
  serviceListCard: { borderLeftWidth: 3, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14, marginBottom: 10 },
  serviceIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 },
  serviceTextWrap: { flex: 1, marginRight: 8, justifyContent: 'center' },
  serviceTitle: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  serviceDesc: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
});