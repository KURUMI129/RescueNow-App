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
import { useActiveTheme } from "@/hooks/use-active-theme";
import { getAppPreferences, SubscriptionPlan } from "@/constants/app-preferences";

type Message = {
  id: string;
  isUser: boolean;
  text: string;
  isMapCard?: boolean;
};

export default function ChatbotScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];

  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("free");
  const [userName, setUserName] = useState("Usuario");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    void getAppPreferences().then((prefs) => {
      setSubscriptionPlan(prefs.subscriptionPlan);
      // Asumiendo que guardarán su nombre en edit-profile en el futuro.
      // Aquí podemos leer contextualmente.
      setUserName("Amigo"); 
      
      // Mensaje inicial del Bot
      setMessages([
        {
          id: "1",
          isUser: false,
          text: `¡Hola! Soy RescueAI. ¿En qué te puedo ayudar hoy?`,
        },
      ]);
    });
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    const newUserMsg: Message = { id: Date.now().toString(), isUser: true, text: userMessage };
    
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setIsTyping(true);

    // TODO: Copilot Backend - Aquí integrar la llamada al LLM local (Offline RAG) o a la API en la nube
    // 1. Obtener lat/lng actuales del usuario con expo-location.
    // 2. Analizar el userMessage buscando entidades (Gasolinera, Taller, Grúa).
    // 3. Consultar Firebase Functions o inyectar contexto local offline.
    
    setTimeout(() => {
      setIsTyping(false);
      
      const isGasolineraQuery = userMessage.toLowerCase().includes("gasolinera");
      let botResponse: Message;

      if (isGasolineraQuery) {
        if (subscriptionPlan === "premium") {
           // TODO: Copilot Backend - Aquí devolverías la respuesta enriquecida (isMapCard: true)
           // con coordenadas exactas, precios en tiempo real y miniaturas.
           botResponse = {
             id: Date.now().toString() + "_bot",
             isUser: false,
             text: "He encontrado una gasolinera (Pemex) a 400 metros de tu ubicación. El precio actual de la Magna es $22.40. Te he marcado la ruta en el mapa.",
             isMapCard: true
           };
        } else {
           // Respuesta Estándar (Solo texto y aproximación)
           botResponse = {
             id: Date.now().toString() + "_bot",
             isUser: false,
             text: "Hay una gasolinera a un par de cuadras en dirección al centro. Ve con precaución.",
           };
        }
      } else {
         botResponse = {
            id: Date.now().toString() + "_bot",
            isUser: false,
            text: "Entendido. Si se trata de una emergencia médica, por favor presiona el botón S.O.S. en la pantalla principal para contactar al 911 de inmediato.",
         };
      }

      setMessages((prev) => [...prev, botResponse]);
    }, 1500);
  };

  useEffect(() => {
    // Auto-scroll al final
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons 
             name={subscriptionPlan === "premium" ? "robot-excited-outline" : "robot-outline"} 
             size={22} 
             color={subscriptionPlan === "premium" ? colors.accent : colors.primary} 
          />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Rescue<Text style={{ color: subscriptionPlan === "premium" ? colors.accent : colors.primary, fontWeight: '900' }}>AI</Text>
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.flexItem} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
           {/* ALERTA DE MODO OFFLINE (Mockup para Copilot Backend) */}
           <View style={[styles.offlineNotice, { backgroundColor: 'rgba(255, 150, 0, 0.1)', borderColor: 'rgba(255, 150, 0, 0.4)' }]}>
             <MaterialCommunityIcons name="wifi-off" size={16} color="#FF9800" />
             <Text style={styles.offlineText}>Aviso: Modo Inteligencia Periférica activado. Capacidad limitada sin conexión.</Text>
           </View>

           {messages.map((msg) => (
             <View key={msg.id} style={[styles.messageWrapper, msg.isUser ? styles.messageUser : styles.messageBot]}>
                {!msg.isUser && (
                  <View style={[styles.botAvatar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <MaterialCommunityIcons name="robot-outline" size={16} color={colors.textPrimary} />
                  </View>
                )}
                
                <View style={[
                  styles.messageBubble, 
                  msg.isUser ? [styles.bubbleUser, { backgroundColor: colors.primary }] : [styles.bubbleBot, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]
                ]}>
                  <Text style={[styles.messageText, { color: msg.isUser ? "#fff" : colors.textPrimary }]}>
                    {msg.text}
                  </Text>
                  
                  {/* PREMIUM MAP CARD UI MOCK */}
                  {msg.isMapCard && (
                    <View style={[styles.mapCard, { backgroundColor: colors.mapBackground }]}>
                       <MaterialCommunityIcons name="map-marker-radius" size={32} color={colors.accent} />
                       <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 8 }}>Ver en Mapa Interactivo</Text>
                    </View>
                  )}

                </View>
             </View>
           ))}

           {isTyping && (
             <View style={[styles.messageWrapper, styles.messageBot]}>
                 <View style={[styles.botAvatar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <MaterialCommunityIcons name="robot-outline" size={16} color={colors.textPrimary} />
                 </View>
                 <View style={[styles.bubbleBot, { backgroundColor: colors.surface, borderColor: colors.cardBorder, paddingVertical: 12, paddingHorizontal: 16 }]}>
                   <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Pensando...</Text>
                 </View>
             </View>
           )}

        </ScrollView>

        {/* INPUT BOX */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.cardBorder }]}>
          <TextInput
             value={inputText}
             onChangeText={setInputText}
             placeholder="Pregunta algo (ej. gasolinera cerca...)"
             placeholderTextColor={colors.textSecondary}
             style={[styles.inputAsset, { color: colors.textPrimary, backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}
             multiline
          />
          <Pressable 
            style={[styles.sendButton, { backgroundColor: inputText.trim().length > 0 ? colors.primary : colors.cardBorder }]}
            onPress={handleSend}
          >
             <Ionicons name="send" size={16} color={inputText.trim().length > 0 ? "#fff" : colors.textSecondary} />
          </Pressable>
        </View>

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
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderBottomWidth: 1 
  },
  backButton: { padding: 8 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 24 },
  
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 24,
    gap: 8
  },
  offlineText: { fontSize: 11, fontWeight: '700', color: "#FF9800", flex: 1 },

  messageWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  messageUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageBot: { alignSelf: 'flex-start', alignItems: 'flex-end' },
  
  botAvatar: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8, marginBottom: 4
  },

  messageBubble: { padding: 14, borderRadius: 20 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleBot: { borderWidth: 1, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, fontWeight: '500', lineHeight: 22 },

  mapCard: { 
    marginTop: 12, borderRadius: 12, padding: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },

  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    padding: 16, 
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1 
  },
  inputAsset: {
    flex: 1, minHeight: 48, maxHeight: 120,
    borderWidth: 1, borderRadius: 24, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14,
    fontSize: 15, fontWeight: '500'
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 12, marginBottom: 2
  }
});
