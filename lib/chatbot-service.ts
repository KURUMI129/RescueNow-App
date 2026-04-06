/**
 * Chatbot service using Gemini API with offline fallback responses.
 * Differentiates between Free and Premium users.
 */

import NetInfo from "@react-native-community/netinfo";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

type ChatMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

type ChatbotResponse = {
  text: string;
  isMapCard?: boolean;
};

// ====== SYSTEM PROMPTS BY PLAN ======

const SYSTEM_PROMPT_BASE = `Eres RescueAI, el asistente de emergencia inteligente de RescueNow, una aplicación mexicana de asistencia vehicular.

Reglas generales:
- Responde SIEMPRE en español de México, amigable y directo.
- Sé conciso pero informativo (máximo 3-4 párrafos).
- Si es una situación que requiere llamar al 911, recomiéndalo claramente.
- No inventes datos de ubicaciones específicas.
- Incluye emojis relevantes para ser más visual.
- Sé empático y profesional.`;

const SYSTEM_PROMPT_FREE = `${SYSTEM_PROMPT_BASE}

PLAN DEL USUARIO: GRATUITO (Free)

Funciones disponibles para este usuario:
✅ Consejos de emergencia vehicular básicos (motor sobrecalentado, batería muerta, llanta ponchada)
✅ Instrucciones de primeros auxilios básicos
✅ Tips de seguridad vial
✅ Orientación en caso de accidente (pasos legales básicos)
✅ Recomendar que use los filtros del mapa en la pantalla principal para buscar gasolineras, talleres, etc.

Funciones NO disponibles (solo Premium):
❌ Diagnóstico avanzado de fallas mecánicas paso a paso
❌ Asesoría legal detallada post-accidente
❌ Guía personalizada de primeros auxilios avanzados
❌ Soporte prioritario 24/7
❌ Análisis del historial de incidentes

Cuando el usuario pregunte sobre funciones Premium, responde la pregunta de forma GENERAL y breve, luego sugiere amablemente actualizar a Premium para obtener una respuesta más detallada y personalizada. Ejemplo: "Puedo darte una orientación general... Para un diagnóstico paso a paso más detallado, te recomiendo activar el plan Premium 🌟".`;

const SYSTEM_PROMPT_PREMIUM = `${SYSTEM_PROMPT_BASE}

PLAN DEL USUARIO: PREMIUM 🌟

Este usuario tiene acceso COMPLETO. Proporciona respuestas detalladas y personalizadas:
✅ Diagnóstico avanzado de fallas mecánicas con pasos detallados
✅ Asesoría legal completa post-accidente  
✅ Primeros auxilios avanzados con instrucciones paso a paso
✅ Soporte prioritario — trata al usuario como VIP
✅ Análisis detallado y recomendaciones personalizadas
✅ Respuestas más largas y completas cuando sea necesario

Responde con el nivel de detalle y personalización que un usuario Premium merece.`;

// ====== WELCOME MESSAGES ======

export function getWelcomeMessage(userName: string, plan: "free" | "premium"): string {
  if (plan === "premium") {
    return `¡Hola ${userName}! 🌟 Soy **RescueAI Premium**, tu asistente personal de emergencia.\n\nComo miembro Premium, tienes acceso completo a:\n\n🔧 Diagnóstico avanzado de fallas mecánicas\n⚖️ Asesoría legal detallada post-accidente\n🏥 Primeros auxilios paso a paso\n🛡️ Soporte prioritario 24/7\n\n¿En qué te puedo ayudar hoy?`;
  }

  return `¡Hola ${userName}! 👋 Soy **RescueAI**, tu asistente de emergencia.\n\nPuedo ayudarte con:\n\n🔧 Problemas mecánicos básicos (motor, batería, llantas)\n🚗 Qué hacer en caso de accidente\n⛽ Encontrar gasolineras y talleres (usa el mapa)\n🆘 Cómo usar las funciones de emergencia\n\n💡 *¿Sabías que con Premium obtienes diagnósticos avanzados y asesoría legal detallada?*\n\n¿En qué te puedo ayudar?`;
}

// ====== QUICK SUGGESTIONS ======

export function getQuickSuggestions(plan: "free" | "premium"): string[] {
  if (plan === "premium") {
    return [
      "Mi motor hace un ruido extraño 🔧",
      "Tuve un accidente, ¿qué hago? ⚖️",
      "Primeros auxilios si alguien no respira 🏥",
      "¿Cómo cambio una llanta? 🛞",
    ];
  }
  return [
    "¿Qué hago si mi batería murió? 🔋",
    "Mi motor se sobrecalentó 🔧",
    "¿Cómo encuentro una gasolinera? ⛽",
    "¿Qué ofrece Premium? 🌟",
  ];
}

// ====== OFFLINE FALLBACK RESPONSES ======

const OFFLINE_RESPONSES: Record<string, string> = {
  emergencia: "🚨 Si estás en una emergencia real, presiona el botón SOS rojo en la pantalla principal. Este enviará tu ubicación a tu contacto de emergencia y simulará una llamada al 911 con tus datos médicos.",
  accidente: "🚗 Pasos en caso de accidente:\n\n1. Mantén la calma y verifica que estés bien\n2. Enciende las luces intermitentes\n3. Sal del vehículo si es seguro\n4. Coloca triángulos de seguridad a 50m\n5. Toma fotos de todo\n6. NO muevas a heridos\n7. Usa el botón SOS de RescueNow\n\n📞 Recuerda: el 911 es gratuito desde cualquier teléfono.",
  motor: "🔧 Si tu motor se sobrecalienta:\n\n1. Apaga el aire acondicionado\n2. Enciende la calefacción al máximo\n3. Detente en un lugar seguro\n4. NO abras el cofre de inmediato — espera 30 min\n5. Si sigue en rojo, NO sigas conduciendo\n\n⚠️ Conducir con el motor sobrecalentado puede causar daños irreparables.",
  bateria: "🔋 Batería muerta:\n\n1. Enciende las intermitentes\n2. Si tienes cables, busca otro vehículo\n3. Conecta: rojo→positivo tuyo, rojo→positivo otro, negro→negativo otro, negro→metal de tu carro\n4. Deja el motor corriendo mínimo 20 min\n\n💡 Usa los filtros del mapa para encontrar un mecánico cercano.",
  llanta: "🛞 Llanta ponchada:\n\n1. Busca lugar plano y seguro\n2. Pon freno de mano\n3. Afloja tuercas en CRUZ antes de levantar\n4. Levanta con el gato 2cm\n5. Cambia llanta y aprieta en cruz\n\n🔧 Usa el filtro 'Llantera' en el mapa.",
  gasolinera: "⛽ Usa el filtro 'Gasolina' en el mapa de la pantalla principal para encontrar la gasolinera más cercana.",
  mecanico: "🔧 Usa el filtro 'Mecánico' en el mapa de la pantalla principal para encontrar talleres cercanos.",
  grua: "🚛 Selecciona la opción 'Grúa' en la pantalla principal. Si es una emergencia grave, usa el botón SOS.",
  premium: "🌟 Con el plan **Premium** obtienes:\n\n🔧 Diagnóstico avanzado de fallas mecánicas\n⚖️ Asesoría legal detallada post-accidente\n🏥 Primeros auxilios avanzados paso a paso\n🛡️ Soporte prioritario 24/7\n📊 Análisis del historial de incidentes\n\nPuedes activarlo desde **Mi Perfil → Plan de Suscripción**.",
  default: "👋 No entendí tu pregunta. Intenta preguntar sobre:\n\n🔧 Problemas mecánicos\n🚗 Qué hacer en caso de accidente\n⛽ Encontrar gasolineras y talleres\n🆘 Funciones de emergencia\n\n¿En qué te puedo ayudar?",
};

// ====== CHECK CONNECTIVITY ======

export async function checkIsOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable);
  } catch {
    return false;
  }
}

// ====== MAIN SEND MESSAGE ======

export async function sendChatMessage(
  userMessage: string,
  location: { latitude: number; longitude: number } | null,
  subscriptionPlan: "free" | "premium",
  conversationHistory: ChatMessage[],
): Promise<ChatbotResponse> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  // Check real connectivity
  const isOnline = await checkIsOnline();

  if (!isOnline || !apiKey) {
    // Offline fallback
    return { text: getOfflineResponse(userMessage, subscriptionPlan) };
  }

  // Online — use Gemini API
  try {
    const systemPrompt = subscriptionPlan === "premium" ? SYSTEM_PROMPT_PREMIUM : SYSTEM_PROMPT_FREE;

    const locationContext = location
      ? `\nUbicación actual del usuario: lat ${location.latitude.toFixed(4)}, lng ${location.longitude.toFixed(4)}`
      : "\nUbicación del usuario: no disponible";

    const contents = [
      {
        role: "user" as const,
        parts: [{ text: systemPrompt + locationContext }],
      },
      {
        role: "model" as const,
        parts: [{ text: "Entendido. Soy RescueAI, listo para ayudar. ¿En qué puedo asistirte?" }],
      },
      ...conversationHistory,
      {
        role: "user" as const,
        parts: [{ text: userMessage }],
      },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: subscriptionPlan === "premium" ? 0.8 : 0.7,
          maxOutputTokens: subscriptionPlan === "premium" ? 800 : 400,
          topP: 0.9,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text) {
        return { text };
      }
    }

    // API returned non-ok — fall back
    console.warn("[Chatbot] Gemini API returned non-ok status");
    return { text: getOfflineResponse(userMessage, subscriptionPlan) };
  } catch (e) {
    console.warn("[Chatbot] Gemini API error, falling back to offline:", e);
    return { text: getOfflineResponse(userMessage, subscriptionPlan) };
  }
}

// ====== OFFLINE KEYWORD MATCHER ======

function getOfflineResponse(message: string, plan: "free" | "premium"): string {
  const lower = message.toLowerCase();

  const keywords: [string[], string][] = [
    [["emergencia", "sos", "ayuda urgente", "911"], "emergencia"],
    [["accidente", "choque", "volcadura", "golpe"], "accidente"],
    [["motor", "sobrecalentado", "humo", "temperatura", "ruido"], "motor"],
    [["batería", "bateria", "no enciende", "no prende", "arranca"], "bateria"],
    [["llanta", "ponchadura", "ponchada", "neumático", "neumatico"], "llanta"],
    [["gasolinera", "gasolina", "combustible", "tanque"], "gasolinera"],
    [["mecánico", "mecanico", "taller", "reparar", "falla"], "mecanico"],
    [["grúa", "grua", "remolque", "arrastrar"], "grua"],
    [["premium", "plan", "suscripción", "suscripcion", "mejorar", "upgrade"], "premium"],
  ];

  for (const [words, key] of keywords) {
    if (words.some((w) => lower.includes(w))) {
      const base = OFFLINE_RESPONSES[key] ?? OFFLINE_RESPONSES.default;
      // If free user asked about premium features, append upsell
      if (plan === "free" && ["motor", "accidente"].includes(key)) {
        return base + "\n\n💡 *Con Premium obtendrías un diagnóstico más detallado y personalizado.*";
      }
      return base;
    }
  }

  return OFFLINE_RESPONSES.default;
}

// ====== CONVERSATION HISTORY CONVERTER ======

export function toChatHistory(
  messages: { isUser: boolean; text: string }[],
): ChatMessage[] {
  return messages.map((msg) => ({
    role: msg.isUser ? "user" : "model",
    parts: [{ text: msg.text }],
  }));
}
