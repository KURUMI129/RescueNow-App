import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { getAppPreferences, SubscriptionPlan } from "@/constants/app-preferences";
import { useUserLocation } from "@/hooks/use-user-location";
import { useAuth } from "@/lib/auth-context";
import {
  sendChatMessage,
  toChatHistory,
  getWelcomeMessage,
  getQuickSuggestions,
  getFollowUpSuggestions,
  checkIsOnline,
  searchYouTubeVideo,
} from "@/lib/chatbot-service";
import type { YouTubeVideoResult } from "@/lib/chatbot-service";

type Message = {
  id: string;
  isUser: boolean;
  text: string;
  isMapCard?: boolean;
  youtubeVideo?: YouTubeVideoResult;
};

export default function ChatbotScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const { user } = useAuth();

  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("free");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const { location } = useUserLocation();

  // Force hide the status bar imperatively (Android needs this)
  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(true, "fade");
      return () => StatusBar.setHidden(false, "fade");
    }, [])
  );

  // Check connectivity + load preferences + set welcome message
  useEffect(() => {
    const init = async () => {
      const [prefs, online] = await Promise.all([
        getAppPreferences(),
        checkIsOnline(),
      ]);

      const plan = prefs.subscriptionPlan;
      setSubscriptionPlan(plan);
      setIsOnline(online);
      setQuickSuggestions(getQuickSuggestions(plan));
      setShowSuggestions(!online);

      const displayName = user?.displayName ?? "Amigo";
      const welcomeData = getWelcomeMessage(displayName, plan);
      const newMessages: Message[] = [];
      if (welcomeData.intro) {
        newMessages.push({ id: "welcome_intro", isUser: false, text: welcomeData.intro });
      }
      newMessages.push({ id: "welcome_fact", isUser: false, text: welcomeData.fact });
      
      setMessages(newMessages);
    };

    void init();
  }, [user]);

  // Auto-clear timer ref
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planRef = useRef(subscriptionPlan);
  planRef.current = subscriptionPlan;

  // When screen focuses: check plan changes + reset conversation if away too long
  // When screen blurs: start 20-second auto-clear timer
  useFocusEffect(
    useCallback(() => {
      // === ON FOCUS ===
      // Cancel any pending clear timer (user came back in time)
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }

      const refreshPlan = async () => {
        const prefs = await getAppPreferences();
        const newPlan = prefs.subscriptionPlan;
        
        // Prevent showing the upgrade message on initial app load
        // Only show if we already had a plan loaded (planRef.current updated by init at least once)
        // and it actually changed.
        const isInitialLoad = messages.length === 0;

        if (newPlan !== planRef.current) {
          if (!isInitialLoad && planRef.current) {
            const planMsg: Message = {
              id: Date.now().toString() + "_plan",
              isUser: false,
              text: newPlan === "premium"
                ? "🌟 ¡Tu plan se ha actualizado a **Premium**! Ahora tienes acceso completo a diagnósticos avanzados, asesoría legal y más."
                : "ℹ️ Tu plan ha cambiado a **Estándar**. Algunas funciones avanzadas están limitadas.",
            };
            setMessages((prev) => [...prev, planMsg]);
          }
          setSubscriptionPlan(newPlan);
          setQuickSuggestions(getQuickSuggestions(newPlan));
        }
      };
      void refreshPlan();

      // === ON BLUR (return cleanup) ===
      return () => {
        // Start 20-second timer — if user doesn't come back, reset conversation
        blurTimerRef.current = setTimeout(() => {
          const displayName = user?.displayName ?? "Amigo";
          const plan = planRef.current;
          const welcomeData = getWelcomeMessage(displayName, plan);
          const newMessages: Message[] = [];
          if (welcomeData.intro) {
            newMessages.push({ id: "welcome_" + Date.now() + "_intro", isUser: false, text: welcomeData.intro });
          }
          newMessages.push({ id: "welcome_" + Date.now() + "_fact", isUser: false, text: welcomeData.fact });

          setMessages(newMessages);
          setQuickSuggestions(getQuickSuggestions(plan));
          setShowSuggestions(true);
          setInputText("");
        }, 20000); // 20 seconds
      };
    }, [user]),
  );

  // Periodically check connectivity
  useEffect(() => {
    const interval = setInterval(async () => {
      const online = await checkIsOnline();
      setIsOnline(online);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback(async (overrideText?: string) => {
    const messageText = (overrideText ?? inputText).trim();
    if (!messageText) return;

    const newUserMsg: Message = { id: Date.now().toString(), isUser: true, text: messageText };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      const userLocation = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : null;

      const history = toChatHistory(
        messages.filter((m) => !m.id.startsWith("welcome") && !m.id.includes('_err')).map((m) => ({ isUser: m.isUser, text: m.text })),
      );

      const response = await sendChatMessage(
        messageText,
        userLocation,
        subscriptionPlan,
        history,
      );

      // Process YOUTUBE_SEARCH tag: resolve to a real direct video URL
      let finalText = response.text;
      let youtubeVideo: YouTubeVideoResult | undefined;

      const ytMatch = finalText.match(/\[YOUTUBE_SEARCH:\s*(.+?)\]/);
      if (ytMatch) {
        const searchQuery = ytMatch[1].trim();
        finalText = finalText.replace(/\[YOUTUBE_SEARCH:\s*(.+?)\]/, "").trim();
        try {
          youtubeVideo = await searchYouTubeVideo(searchQuery);
        } catch {
          youtubeVideo = {
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
            title: searchQuery,
          };
        }
      }

      // Split [SUGERENCIAS] into a separate bubble
      let mainText = finalText;
      let suggestionsText: string | null = null;

      const sugMatch = finalText.split(/\[SUGERENCIAS\]/i);
      if (sugMatch.length > 1) {
        mainText = sugMatch[0].trim();
        suggestionsText = sugMatch[1].trim();
      }

      const botResponse: Message = {
        id: Date.now().toString() + "_bot",
        isUser: false,
        text: mainText,
        isMapCard: response.isMapCard,
        youtubeVideo,
      };

      const newMessages: Message[] = [botResponse];

      // Add follow-up suggestions as a separate bubble
      if (suggestionsText) {
        newMessages.push({
          id: Date.now().toString() + "_sug",
          isUser: false,
          text: suggestionsText,
        });
      }

      setMessages((prev) => [...prev, ...newMessages]);

      // Show contextual follow-up suggestions only when offline
      if (!isOnline) {
        const followUps = getFollowUpSuggestions(messageText, subscriptionPlan);
        setQuickSuggestions(followUps);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }

      // Re-check connectivity after response
      const online = await checkIsOnline();
      setIsOnline(online);
    } catch (e) {
      const errorMsg: Message = {
        id: Date.now().toString() + "_err",
        isUser: false,
        text: "⚠️ No pude procesar tu mensaje. Verifica tu conexión e inténtalo de nuevo.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, location, subscriptionPlan, messages]);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const handleSuggestionPress = (suggestion: string) => {
    void handleSend(suggestion);
  };

  const handleClearChat = useCallback(() => {
    const displayName = user?.displayName ?? "Amigo";
    const welcomeData = getWelcomeMessage(displayName, subscriptionPlan);
    const newMessages: Message[] = [];
    if (welcomeData.intro) {
      newMessages.push({ id: "welcome_" + Date.now() + "_intro", isUser: false, text: welcomeData.intro });
    }
    newMessages.push({ id: "welcome_" + Date.now() + "_fact", isUser: false, text: welcomeData.fact });
    
    setMessages(newMessages);
    setQuickSuggestions(getQuickSuggestions(subscriptionPlan));
    setShowSuggestions(!isOnline);
    setInputText("");
  }, [user, subscriptionPlan]);

  const handleReloadAI = useCallback(() => {
    const lastUserIndex = [...messages].reverse().findIndex(m => m.isUser);
    if (lastUserIndex === -1) return;
    
    const realIndex = messages.length - 1 - lastUserIndex;
    const lastUserText = messages[realIndex].text;

    // Remove the last user message and any subsequent bot replies/errors 
    // so we can cleanly resend it
    setMessages(prev => prev.slice(0, realIndex));
    
    setTimeout(() => {
        void handleSend(lastUserText);
    }, 50);
  }, [messages, handleSend]);

  const isPremium = subscriptionPlan === "premium";

  return (
    <View style={styles.flexItem}>
      <StatusBar hidden />
      <LinearGradient 
        colors={colors.gradientBg} 
        style={StyleSheet.absoluteFillObject} 
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: "transparent" }]}>

      {/* HEADER */}
      <BlurView intensity={activeTheme === "dark" ? 40 : 80} tint={activeTheme} style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons
            name="dog-service"
            size={22}
            color={isPremium ? colors.accent : colors.primary}
          />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Re<Text style={{ color: isPremium ? colors.accent : colors.primary, fontWeight: '900' }}>x</Text>
          </Text>
          {isPremium && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.premiumBadgeText}>PRO</Text>
            </View>
          )}
        </View>

        {/* Header Right Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPress={handleReloadAI} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="refresh" size={24} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleClearChat} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
          </Pressable>
          <View style={[styles.connectionDot, { backgroundColor: isOnline ? "#10B981" : "#F59E0B", position: "relative", top: 0, right: 0 }]} />
        </View>
      </BlurView>

      <KeyboardAvoidingView
        style={styles.flexItem}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
           {/* CONNECTIVITY BANNER — only when offline */}
           {!isOnline && (
             <View style={[styles.offlineNotice, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
               <MaterialCommunityIcons name="wifi-off" size={16} color="#F59E0B" />
               <Text style={styles.offlineText}>
                 Sin conexión a internet. Usando respuestas predefinidas.
               </Text>
             </View>
           )}

           {/* Online + Gemini indicator */}
           {isOnline && (
             <View style={[styles.offlineNotice, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
               <MaterialCommunityIcons name="creation" size={16} color="#10B981" />
               <Text style={[styles.offlineText, { color: "#10B981" }]}>
                 Rex conectado • {isPremium ? "Modo Premium 🌟" : "Modo Estándar"}
               </Text>
             </View>
           )}

           {/* MESSAGES */}
           {messages.map((msg) => (
             <View key={msg.id} style={[styles.messageWrapper, msg.isUser ? styles.messageUser : styles.messageBot]}>
                {!msg.isUser && (
                  <View style={[styles.botAvatar, {
                    backgroundColor: isPremium ? `${colors.accent}20` : colors.surface,
                    borderColor: isPremium ? colors.accent : colors.cardBorder,
                  }]}>
                    <MaterialCommunityIcons
                      name="dog-service"
                      size={16}
                      color={isPremium ? colors.accent : colors.textPrimary}
                    />
                  </View>
                )}

                <View style={[
                  styles.messageBubble,
                  msg.isUser ? [styles.bubbleUser, { backgroundColor: colors.primary }] : [styles.bubbleBot, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]
                ]}>
                  {(() => {
                    // If the message has a pre-resolved YouTube video, render it
                    if (!msg.isUser && msg.youtubeVideo) {
                      return (
                        <>
                          <Text style={[styles.messageText, { color: colors.textPrimary }]}>
                            {msg.text}
                          </Text>
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 0, 0, 0.08)",
                              borderRadius: 12,
                              paddingVertical: 10,
                              paddingHorizontal: 14,
                              marginTop: 10,
                              borderWidth: 1,
                              borderColor: "rgba(255, 0, 0, 0.15)",
                            }}
                            onPress={() => Linking.openURL(msg.youtubeVideo!.url)}
                          >
                            <MaterialCommunityIcons name="youtube" size={22} color="#FF0000" style={{ marginRight: 8 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}>
                                Ver Video Tutorial
                              </Text>
                              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                                {msg.youtubeVideo.title}
                              </Text>
                            </View>
                            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </>
                      );
                    }
                    return (
                      <Text style={[styles.messageText, { color: msg.isUser ? "#fff" : colors.textPrimary }]}>
                        {msg.text}
                      </Text>
                    );
                  })()}

                  {msg.isMapCard && (
                    <View style={[styles.mapCard, { backgroundColor: colors.mapBackground }]}>
                       <MaterialCommunityIcons name="map-marker-radius" size={32} color={colors.accent} />
                       <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 8 }}>Ver en Mapa Interactivo</Text>
                    </View>
                  )}
                </View>
             </View>
           ))}

           {/* TYPING INDICATOR */}
           {isTyping && (
             <View style={[styles.messageWrapper, styles.messageBot]}>
                 <View style={[styles.botAvatar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <MaterialCommunityIcons name="dog-service" size={16} color={colors.textPrimary} />
                 </View>
                 <View style={[styles.bubbleBot, { backgroundColor: colors.surface, borderColor: colors.cardBorder, paddingVertical: 12, paddingHorizontal: 16 }]}>
                   <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                     {isOnline ? "Rex está pensando..." : "Buscando respuesta..."}
                   </Text>
                 </View>
             </View>
           )}

           {/* QUICK SUGGESTIONS */}
           {showSuggestions && quickSuggestions.length > 0 && !isTyping && (
             <View style={styles.suggestionsContainer}>
               <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
                 Sugerencias rápidas:
               </Text>
               {quickSuggestions.map((suggestion, i) => (
                 <Pressable
                   key={i}
                   style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                   onPress={() => handleSuggestionPress(suggestion)}
                 >
                   <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{suggestion}</Text>
                   <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
                 </Pressable>
               ))}
             </View>
           )}

        </ScrollView>

        {/* Input Area Overlaying Chat */}
        <BlurView intensity={activeTheme === "dark" ? 40 : 80} tint={activeTheme} style={[styles.inputContainer, { backgroundColor: 'transparent', borderTopColor: colors.cardBorder }]}>
          <TextInput
             value={inputText}
             onChangeText={setInputText}
             placeholder={isPremium ? "Pregúntame lo que quieras... 🌟" : "Pregunta algo (ej. batería muerta...)"}
             placeholderTextColor={colors.textSecondary}
             style={[styles.inputAsset, { color: colors.textPrimary, backgroundColor: colors.mapBackground, borderColor: colors.cardBorder }]}
             multiline
             onSubmitEditing={() => void handleSend()}
          />
          <Pressable
            style={[styles.sendButton, { backgroundColor: inputText.trim().length > 0 ? colors.primary : colors.cardBorder }]}
            onPress={() => void handleSend()}
          >
             <Ionicons name="send" size={16} color={inputText.trim().length > 0 ? "#fff" : colors.textSecondary} />
          </Pressable>
        </BlurView>

        {!isPremium && (
          <BlurView intensity={activeTheme === "dark" ? 40 : 80} tint={activeTheme} style={[styles.upgradeStrip, { backgroundColor: 'transparent', borderTopColor: colors.cardBorder }]}>
            <Text style={[styles.upgradeText, { color: colors.textSecondary }]}>
              💡 Respuestas básicas •{" "}
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/options")}>
              <Text style={[styles.upgradeLink, { color: colors.accent }]}>Actualizar a Premium</Text>
            </Pressable>
          </BlurView>
        )}

      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  },
  backButton: { padding: 8 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  premiumBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 24 },

  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 8,
  },
  offlineText: { fontSize: 12, fontWeight: '600', color: "#F59E0B", flex: 1 },

  messageWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  messageUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageBot: { alignSelf: 'flex-start', alignItems: 'flex-end' },

  botAvatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8, marginBottom: 4,
    borderWidth: 1,
  },

  messageBubble: { padding: 14, borderRadius: 20 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleBot: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    shadowColor: '#0B1120',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  messageText: { fontSize: 15, fontWeight: '500', lineHeight: 22 },

  mapCard: {
    marginTop: 12, borderRadius: 12, padding: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },

  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1,
  },
  inputAsset: {
    flex: 1, minHeight: 46, maxHeight: 120,
    borderRadius: 20, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12,
    fontSize: 15, fontWeight: '500',
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 10, marginBottom: 1,
  },

  upgradeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  upgradeLink: {
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
