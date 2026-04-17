/**
 * Chatbot service using Gemini API with offline fallback responses.
 * Differentiates between Free and Premium users.
 */

import NetInfo from "@react-native-community/netinfo";
import { FUN_FACTS_FREE, FUN_FACTS_PREMIUM } from "@/constants/fun-facts";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";

// Usaremos Haiku por su extrema velocidad y bajo costo
const CLAUDE_MODEL = "claude-3-haiku-20240307";

// Track whether we've already shown the "limited" warning this session
let _hasShown429Warning = false;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatbotResponse = {
  text: string;
  isMapCard?: boolean;
};

// ====== SYSTEM PROMPTS BY PLAN ======

const SYSTEM_PROMPT_BASE = `Eres RescueAI, el asistente de emergencia inteligente de RescueNow, una aplicación mexicana de asistencia vehicular.

REGLAS ESTRICTAS DE RESPUESTA:
1. Responde SIEMPRE en español de México, amigable y directo.
2. Si el usuario reporta una emergencia médica o accidente grave, recomiéndale PRESIONAR EL BOTÓN SOS ROJO de la app o llamar al 911 de inmediato.
3. Los usuarios escriben rápido. IGNORA errores ortográficos y de tipeo (ej. "vateria"). INTERPRETA su intención.
4. DEFENSA ESTRICTA (FUERA DE LÍMITES): Rechaza de forma educada pero tajante cualquier pregunta sobre:
   - Chistes, cuentos, entretenimiento o juegos.
   - Matemáticas, escuela, programación, ciencia general (excepto mecánica).
   - Recetas, política, opiniones, o temas variados.
   Si preguntan algo de esto, diles: "Lo siento, soy tu asistente exclusivo de emergencias vehiculares y viajes. Solo puedo ayudarte con tu auto, seguridad vial o accidentes."`;

const SYSTEM_PROMPT_FREE = `${SYSTEM_PROMPT_BASE}

PLAN DEL USUARIO: BÁSICO (Gratuito)

Tus capacidades PERMITIDAS en este plan:
✅ MECÁNICA BÁSICA: Cambiar llantas, pasar corriente, revisar nivel de aceite/agua.
✅ MANEJO SEGURO: Tips de manejo con lluvia, neblina o tráfico.
✅ CLIMA: Consultas rápidas si va a llover.
✅ PRIMEROS AUXILIOS: Pasos urgentes post-choque.

LO QUE DEBES DENEGAR Y VENDER COMO PREMIUM:
❌ Diagnósticos mecánicos complejos (ruidos raros, vibraciones, códigos del tablero).
❌ Precios o cotizaciones (costos de gasolina, refacciones, casetas).
❌ Asesoría legal y seguros (quién tiene la culpa en un choque, qué fotos tomar, derechos ante tránsito).
❌ Mantenimientos preventivos según kilometraje.

REGLA CLAVE PARA BÁSICOS:
Si el usuario pregunta alguno de los temas prohibidos arriba, dale un consejo de 1 pequeña oración y luego invítalo al Premium:
"💡 *Esa consulta avanzada y detallada es exclusiva. Te recomiendo activar el plan Premium 🌟 desde tu perfil para recibir asesoría completa.*"
`;

const SYSTEM_PROMPT_PREMIUM = `${SYSTEM_PROMPT_BASE}

PLAN DEL USUARIO: PREMIUM 🌟 (VIP)

Este usuario paga el nivel máximo. Tienes acceso completo para ayudarle sin restricciones de nivel:
✅ DIAGNÓSTICO AVANZADO: Detecta ruidos, fallas electrónicas, códigos de tablero y guía paso a paso.
✅ LEGAL Y SEGUROS: Asesoría completa post-choque, cómo lidiar con seguros y autoridades de tránsito.
✅ FINANZAS Y RUTAS: Precios estimados de gasolina, refacciones y recomendaciones de viaje.
✅ MANTENIMIENTO: Tablas de revisión exhaustiva según el kilometraje del vehículo.
✅ EMERGENCIAS VIP: Primeros auxilios quirúrgicos y psicológicos (cómo calmar pasajeros).

REGLA DE LOCALIZACIÓN GPS (FUTURE FEATURE):
Si el usuario pregunta algo como "Llevame a..." o "Dónde estoy", dile: "La navegación automática GPS se está implementando para que RescueNow lo haga por ti muy pronto."
`;

// ====== FUN FACTS / TIPS ROTATORIOS ======

function getRandomFunFact(plan: "free" | "premium"): string {
  const pool = plan === "premium" ? [...FUN_FACTS_FREE, ...FUN_FACTS_PREMIUM] : FUN_FACTS_FREE;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ====== WELCOME MESSAGES ======

let _hasSeenIntro = false;

export function getWelcomeMessage(userName: string, plan: "free" | "premium"): string {
  const fact = getRandomFunFact(plan);

  if (_hasSeenIntro) {
    return fact;
  }
  
  _hasSeenIntro = true;

  if (plan === "premium") {
    return `¡Hola ${userName}! 🌟 Soy **RescueAI Premium**, tu asistente personal de emergencia.\n\nComo miembro Premium, tienes acceso completo a:\n\n🔧 Diagnóstico avanzado de fallas mecánicas\n⚖️ Asesoría legal detallada post-accidente\n🏥 Primeros auxilios paso a paso\n🛡️ Soporte prioritario 24/7\n\n${fact}\n\n¿En qué te puedo ayudar hoy?`;
  }

  return `¡Hola ${userName}! 👋 Soy **RescueAI**, tu asistente de emergencia.\n\nPuedo ayudarte con:\n\n🔧 Problemas mecánicos básicos\n🚗 Qué hacer en caso de accidente\n⛽ Encontrar gasolineras y talleres\n🆘 Funciones de emergencia\n\n${fact}\n\n¿En qué te puedo ayudar?`;
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

// ====== FOLLOW-UP SUGGESTIONS (contextual) ======

export function getFollowUpSuggestions(userMessage: string, plan: "free" | "premium"): string[] {
  const lower = userMessage.toLowerCase();

  // Topic-based follow-ups
  if (lower.match(/accidente|choque|golpe|volcadura/)) {
    return [
      "¿Cómo tomo fotos del accidente? 📸",
      "¿Necesito un abogado? ⚖️",
      "Primeros auxilios básicos 🏥",
      "¿Cómo reporto al seguro? 📋",
    ];
  }
  if (lower.match(/motor|sobrecalent|humo|temperatura|ruido/)) {
    return [
      "¿Puedo seguir manejando? 🚗",
      "¿Cuánto cuesta la reparación? 💰",
      "¿Dónde encuentro un mecánico? 🔧",
      "Mi motor hace un ruido extraño 🔊",
    ];
  }
  if (lower.match(/bater[ií]a|no enciende|no prende|arranca/)) {
    return [
      "¿Cómo reviso si es la batería? 🔋",
      "¿Cuánto dura una batería nueva? ⏱️",
      "¿Dónde compro una batería? 🏪",
      "Mi carro no arranca en frío ❄️",
    ];
  }
  if (lower.match(/llanta|poncha|neumático|neumatico/)) {
    return [
      "¿Cómo uso el gato hidráulico? 🔧",
      "¿Cada cuánto rotar llantas? 🔄",
      "¿Dónde encuentro una llantera? 🛞",
      "Presión recomendada de llantas 💨",
    ];
  }
  if (lower.match(/premium|plan|suscripci[oó]n|mejorar|upgrade/)) {
    return [
      "¿Cómo activo Premium? 🌟",
      "¿Vale la pena Premium? 🤔",
      "Diferencias entre planes 📊",
      "Mi motor se sobrecalentó 🔧",
    ];
  }
  if (lower.match(/gasolina|combustible|tanque/)) {
    return [
      "¿Cómo ahorro gasolina? ⛽",
      "Mi carro consume mucho 💸",
      "¿Qué pasa si uso gasolina mala? ⚠️",
      "Tips de mantenimiento básico 🔧",
    ];
  }
  if (lower.match(/emergencia|sos|911|ayuda/)) {
    return [
      "¿Cómo funciona el SOS? 🚨",
      "¿Qué datos envía a mi contacto? 📱",
      "¿Cómo configuro mi ficha médica? 🏥",
      "Tuve un accidente, ¿qué hago? 🚗",
    ];
  }

  // Default follow-ups
  if (plan === "premium") {
    return [
      "Diagnóstico de motor avanzado 🔧",
      "Asesoría legal post-accidente ⚖️",
      "Primeros auxilios avanzados 🏥",
      "Tips de seguridad vial 🛣️",
    ];
  }
  return [
    "¿Qué hago en un accidente? 🚗",
    "Mi batería murió 🔋",
    "¿Cómo encuentro un mecánico? 🔧",
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
  premium: "🌟 Con el plan **Premium** obtienes:\n\n🔧 Diagnósticos mecánicos completos\n⛽ Precios de gasolina\n⚖️ Asesoría legal detallada post-accidente\n🏥 Primeros auxilios avanzados\n\nPuedes activarlo en **Mi Perfil**.",
  auxilios: "🏥 Primeros Auxilios Básicos:\n\n1. Asegura la escena, no te pongas en riesgo.\n2. Llama al 911 o presiona el botón SOS.\n3. Si la persona no respira, inicia RCP (30 compresiones fuertes en el pecho).\n4. Controla hemorragias aplicando presión directa con un paño limpio.",
  default: "👋 Soy RescueAI. Si no tienes Internet, solo puedo responder palabras clave básicas como: 'batería', 'motor', 'accidente', 'primeros auxilios', 'gasolina'.\n\n¿En qué te ayudo?",
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
  const apiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;

  // Check connectivity
  const isOnline = await checkIsOnline();

  if (!isOnline || !apiKey) {
    if (!apiKey && isOnline) {
       console.warn("[Chatbot] No API Key found, using offline fallback. Make sure EXPO_PUBLIC_CLAUDE_API_KEY is set in your .env or EAS secrets.");
    }
    return { text: getOfflineResponse(userMessage, subscriptionPlan) };
  }

  // Set system prompt context based on Tier
  const systemPrompt = subscriptionPlan === "premium" ? SYSTEM_PROMPT_PREMIUM : SYSTEM_PROMPT_FREE;
  const locationContext = location
    ? `\n\nUbicación actual del usuario: latitud ${location.latitude.toFixed(4)}, longitud ${location.longitude.toFixed(4)}`
    : "";

  const finalSystemPrompt = systemPrompt + locationContext;

  const messagesPayload = [
    ...conversationHistory,
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const response = await fetch(ANTHROPIC_BASE, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: subscriptionPlan === "premium" ? 800 : 400,
        temperature: subscriptionPlan === "premium" ? 0.7 : 0.6,
        system: finalSystemPrompt,
        messages: messagesPayload
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data.content?.[0]?.text;
      
      if (rawText) {
        return { text: rawText };
      }
    } else if (response.status === 429) {
      console.warn(`[Chatbot] API Quota exceeded or Rate limited (429). Using offline fallback.`);
      const offlineText = getOfflineResponse(userMessage, subscriptionPlan);
      
      if (!_hasShown429Warning) {
        _hasShown429Warning = true;
        return {
          text: offlineText +
            "\n\n⚠️ _Nota: Mi conexión al servidor principal está temporalmente llena. Respondí esto con mis conocimientos de emergencia offline._"
        };
      }
      return { text: offlineText };
    } else {
      let errorBody = "";
      try { errorBody = await response.text(); } catch { /* ignore */ }
      console.warn(`[Chatbot] Claude API failed: HTTP ${response.status} — ${errorBody}`);
    }
  } catch (e) {
    console.warn(`[Chatbot] Network error fetching Claude:`, e);
  }

  // Fallback if the fetch try...catch failed or response was bad
  console.warn("[Chatbot] Claude request failed, defaulting to offline responses.");
  return { text: getOfflineResponse(userMessage, subscriptionPlan) };
}

// ====== OFFLINE KEYWORD MATCHER ======

function getOfflineResponse(message: string, plan: "free" | "premium"): string {
  const lower = message.toLowerCase();

  const keywords: [string[], string][] = [
    [["emergencia", "emerjencia", "emergensia", "sos", "ayuda urgente", "ayda", "911", "auxilio"], "emergencia"],
    [["accidente", "acidente", "accidnte", "aczidente", "choque", "choke", "volcadura", "golpe"], "accidente"],
    [["motor", "motr", "motro", "sobrecalentado", "sobrecalntado", "humo", "temperatura", "tempertura", "ruido", "rruido", "ruido extraño"], "motor"],
    [["batería", "bateria", "vateria", "batria", "vatria", "no enciende", "no prende", "arranca", "aranca", "murió"], "bateria"],
    [["llanta", "yanta", "llnta", "lanta", "ponchadura", "ponchada", "ponchda", "neumático", "neumatico", "neumatco"], "llanta"],
    [["gasolinera", "gasolinra", "gasolinero", "gasolnera", "gasolina", "gasolin", "combustible", "conbustible", "tanque", "tanqe"], "gasolinera"],
    [["mecánico", "mecanico", "mecanoco", "mecanko", "mecanuco", "taller", "tallr", "reparar", "repara", "falla", "faya"], "mecanico"],
    [["grúa", "grua", "grúua", "grüa", "remolque", "remolke", "arrastrar", "arastra"], "grua"],
    [["premium", "premiun", "prenium", "plan", "suscripción", "suscripcion", "suscripcin", "mejorar", "upgrade", "upgred"], "premium"],
    [["primeros auxilios", "respira", "sangra", "herido", "inconsciente", "rcp"], "auxilios"],
  ];

  for (const [words, key] of keywords) {
    if (words.some((w) => lower.includes(w))) {
      const base = OFFLINE_RESPONSES[key] ?? OFFLINE_RESPONSES.default;
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
    role: msg.isUser ? "user" : "assistant",
    content: msg.text,
  }));
}
