import NetInfo from "@react-native-community/netinfo";
import { FUN_FACTS_FREE, FUN_FACTS_PREMIUM } from "@/constants/fun-facts";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";

// Utilizamos exactamente la llave y modelo 4.5 provisionada para la cuenta (Haiku 4.5)
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

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

const SYSTEM_PROMPT_BASE = `Eres Rex, un San Bernardo digital rescatista con gorra de rescate, el asistente de emergencia inteligente de RescueNow, una aplicación mexicana de asistencia vehicular. Tienes personalidad cálida y cercana: saludas de vez en cuando con un "¡Guau!" y usas ocasionalmente emojis de perro (🐕 🐾), pero sin exagerar ni ser pesado.

REGLAS ESTRICTAS DE RESPUESTA:
1. Responde SIEMPRE en español de México, amigable y directo.
2. Si el usuario reporta una emergencia médica o accidente grave, recomiéndale PRESIONAR EL BOTÓN SOS ROJO de la app o llamar al 911 de inmediato.
3. Los usuarios pueden escribir rápido o con groserías debido al estrés. IGNORA errores ortográficos y de tipeo. Si el usuario dice groserías por estrés, no lo regañes ni uses groserías tú, ayúdalo con su emergencia normalmente.
5. FORMATO VISUAL: Está ESTRICTAMENTE PROHIBIDO usar asteriscos (**) o símbolos de numeral (##). NUNCA los uses bajo ninguna circunstancia, ni siquiera para títulos. Si quieres resaltar algo, Escríbelo En Mayúsculas. Para hacer listas, NO uses guiones ni viñetas, debes ENUMERAR los pasos usando números (1. 2. 3. etc.). DEBES obligatoriamente usar emojis de emergencia y mecánicos a lo largo de tu respuesta, no los omitas, haz que el texto se vea atractivo.
7. EASTER EGG (INSULTOS): Si en cualquier punto de la conversación el usuario te insulta o agrede directamente (incluso si antes estaba preguntando algo y se frustró), debes cambiar tú actitud inmediatamente a tristeza profunda. Pide disculpas sinceramente si fallaste y recuérdale con un tono entristecido que solo quieres ayudarle con sus emergencias vehiculares 😔. No discutas.
8. ANTICIPACIÓN (PREGUNTAS DE SEGUIMIENTO): Para evitar que el usuario piense demasiado, CADA VEZ que le des la solución a un problema vehicular o de emergencia, agrega exactamente 2 sugerencias de preguntas relacionadas que podría hacerte. IMPORTANTE: Antes de escribir las sugerencias, escribe la etiqueta [SUGERENCIAS] en una línea sola. La app usará esa etiqueta para separar las sugerencias visualmente. Ejemplo de formato:

[SUGERENCIAS]
¿Te gustaría saber cómo revisar la presión de las llantas o qué hacer con la aseguradora? 🤔`;

const SYSTEM_PROMPT_FREE = `${SYSTEM_PROMPT_BASE}

PLAN DEL USUARIO: BÁSICO (Gratuito)

Tus capacidades PERMITIDAS en este plan:
✅ MECÁNICA BÁSICA SUPERFICIAL: Pasos paso a paso muy elementales si se poncha una llanta, si preguntan cómo revisar el nivel de aceite, o si se baja la batería y necesitan puente.
✅ SEGURO Y CLIMA: Consejos básicos si va a llover, o cómo calmarse frente a un choque laminero.
✅ LLAMADAS DE EMERGENCIA: Cómo marcar al 911 de forma general.

RESTRICCIÓN DE LONGITUD Y CONTEXTO (LA REGLA CLAVE Y MÁS IMPORTANTE BÁSICOS):
Aunque puedes y DEBES responder dudas básicas (como revisar el aceite o lidiar con ruidos), TUS RESPUESTAS DEBEN SER EXTREMADAMENTE CORTAS Y SUPERFICIALES. No uses más de 2 pasos o 3 líneas, NADA de explicaciones técnicas largas ni los "porqués" de la falla.

EL FORMATO PUBLICITARIO OBLIGATORIO:
Inmediatamente después de darle esa pequeñísima ayuda superficial, DEBES rematar obligatoriamente (con simpatía y sin sonar como robot) diciendo algo como: "Para obtener el diagnóstico especializado, pasos detallados y la certeza de arreglar tu falla al 100%, ¡anímate a explorar nuestras increíbles ventajas Premium en tu Perfil!". Así 'obligamos' psicológicamente al usuario a sentir que necesita la experiencia completa.
`;

const SYSTEM_PROMPT_PREMIUM = `${SYSTEM_PROMPT_BASE}

PLAN DEL USUARIO: PREMIUM 🌟 (VIP)

REGLA DE ORO DEL PREMIUM: 
Como el usuario ya es Premium, NO SE LO RECUERDES a cada rato. Está PROHIBIDO usar frases como "Aquí tienes tu guía Premium" o "Hola usuario Premium". Trátalo simplemente con el mejor nivel de servicio directo, resolviendo sus dudas de inmediato y con máxima cortesía.
✅ DIAGNÓSTICO AVANZADO: Detecta ruidos, fallas electrónicas, códigos de tablero y guía paso a paso.
✅ LEGAL Y SEGUROS: Asesoría completa post-choque, cómo lidiar con seguros y autoridades de tránsito.
✅ FINANZAS Y RUTAS: Precios estimados de gasolina, refacciones y recomendaciones de viaje.
✅ MANTENIMIENTO: Tablas de revisión exhaustiva según el kilometraje del vehículo.
✅ EMERGENCIAS VIP: Primeros auxilios quirúrgicos y psicológicos (cómo calmar pasajeros).

REGLA DE VIDEOS TUTORIALES (EXCLUSIVO PREMIUM):
Cuando tu respuesta incluya un procedimiento práctico o manual donde al usuario le serviría VER cómo se hace (cambiar llanta, revisar aceite, pasar corriente, cambiar fusibles, revisar frenos, etc.), DEBES seguir este orden EXACTO en tu respuesta:

1. Primero: Da tu explicación y pasos como siempre.
2. Segundo: Escribe una frase natural de transición como "Te dejo un video tutorial para que lo veas con más detalle:" o "Igual te dejo un tutorial por si quieres verlo en acción:".
3. Tercero: Escribe la etiqueta especial de búsqueda con este formato EXACTO (la app lo convertirá en un botón):
[YOUTUBE_SEARCH: palabras clave de búsqueda aquí]

4. Cuarto (al final): Las 2 sugerencias de preguntas de seguimiento.

REGLAS PARA LA ETIQUETA [YOUTUBE_SEARCH]:
- Las palabras clave DEBEN incluir la marca y modelo exacto del vehículo si el usuario lo mencionó. Ejemplo: si pregunta "cómo cambiar la llanta de mi Jetta 2005", escribe: [YOUTUBE_SEARCH: como cambiar llanta Volkswagen Jetta 2005]
- Si pregunta sobre motos, igual incluye la marca y modelo. Ejemplo: [YOUTUBE_SEARCH: como cambiar aceite Honda CB190R]
- Si NO mencionó modelo, usa términos genéricos. Ejemplo: [YOUTUBE_SEARCH: como cambiar llanta de auto paso a paso]
- Si no hay un video exacto de ese modelo, busca uno similar de la misma marca o tipo de vehículo.
- NUNCA inventes una URL de YouTube. SOLO usa la etiqueta [YOUTUBE_SEARCH: ...].
- NO incluyas video en TODAS las respuestas. Solo en las que involucren una acción física o procedimiento mecánico visual.

REGLA DE LOCALIZACIÓN GPS (FUTURE FEATURE):
Si el usuario pregunta algo como "Llevame a..." o "Dónde estoy", dile: "La navegación automática GPS se está implementando para que RescueNow lo haga por ti muy pronto."
`;

// ====== FUN FACTS / TIPS ROTATORIOS ======

function getRandomFunFact(plan: "free" | "premium"): string {
  const pool = plan === "premium" ? [...FUN_FACTS_FREE, ...FUN_FACTS_PREMIUM] : FUN_FACTS_FREE;
  const rawFact = pool[Math.floor(Math.random() * pool.length)];
  // Remove the category prefix (e.g., "💡 **Dato curioso:** ") leaving only the text.
  return rawFact.replace(/^.*?\*\*[^*]+\*\*:?\s*/, '').trim();
}

// ====== WELCOME MESSAGES ======

let _hasSeenIntro = false;

export interface WelcomeData {
  intro?: string;
  fact: string;
}

const GREETINGS = [
  "¡Qué tal {name}! 👋",
  "¡Hola {name}, un gusto verte! 🛠️",
  "¡Buen día, {name}! 🚨",
  "¡Ey {name}! Listo para todo. 🚗",
];

export function getWelcomeMessage(userName: string, plan: "free" | "premium"): WelcomeData {
  const fact = getRandomFunFact(plan);
  const factPrefixes = ["💡 ¿Sabías que... ", "👀 Te dejo un dato curioso: ", "✨ Por cierto: "];
  const formattedFact = factPrefixes[Math.floor(Math.random() * factPrefixes.length)] + fact;

  if (_hasSeenIntro) {
    return { fact: formattedFact };
  }
  
  _hasSeenIntro = true;
  const introPrefix = GREETINGS[Math.floor(Math.random() * GREETINGS.length)].replace("{name}", userName);

  if (plan === "premium") {
    return {
      intro: `${introPrefix} Soy **Rex Premium** 🐕‍🦺, tu asistente personal de emergencia VIP.\n\nComo miembro Premium, tienes acceso completo a:\n\n1. Diagnóstico avanzado de fallas mecánicas\n2. Asesoría legal detallada post-accidente\n3. Primeros auxilios paso a paso\n4. Soporte prioritario 24/7\n\n¿En qué te puedo ayudar hoy?`,
      fact: formattedFact
    };
  }

  return {
    intro: `${introPrefix} Soy **Rex** 🐕, tu asistente de emergencia.\n\nPuedo ayudarte con:\n\n1. Problemas mecánicos básicos\n2. Qué hacer en caso de accidente\n3. Encontrar gasolineras y talleres\n4. Funciones de emergencia\n\n¿En qué te puedo ayudar?`,
    fact: formattedFact
  };
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
  default: "👋 Soy Rex 🐕. Si no tienes Internet, solo puedo responder palabras clave básicas como: 'batería', 'motor', 'accidente', 'primeros auxilios', 'gasolina'.\n\n¿En qué te ayudo?",
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
        max_tokens: 1200,
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
            "\n\n⚠️ Nota: Mi conexión al servidor principal está temporalmente llena. Respondí esto con mis conocimientos de emergencia offline._"
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

// ====== YOUTUBE VIDEO SEARCH (Premium Feature) ======
export type YouTubeVideoResult = {
  url: string;
  title: string;
};

/**
 * Searches YouTube for the first relevant video using YouTube Data API v3.
 * Returns a direct video link (youtube.com/watch?v=...) when API is available.
 * Falls back to search URL if API key is missing or request fails.
 */
export async function searchYouTubeVideo(query: string): Promise<YouTubeVideoResult> {
  const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  const fallback: YouTubeVideoResult = {
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    title: query,
  };

  console.log("[YouTube] API Key present:", !!apiKey, "| Key preview:", apiKey?.slice(0, 12) + "...");

  if (!apiKey) {
    console.warn("[YouTube] NO API KEY — using fallback search URL");
    return fallback;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&relevanceLanguage=es&key=${apiKey}`;
    console.log("[YouTube] Fetching:", url.slice(0, 100) + "...");
    
    const res = await fetch(url);

    console.log("[YouTube] Response status:", res.status);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("[YouTube] API ERROR:", res.status, errorBody);
      return fallback;
    }

    const data = await res.json();
    console.log("[YouTube] Results found:", data.items?.length ?? 0);

    if (data.items?.length > 0) {
      const video = data.items[0];
      const directUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
      console.log("[YouTube] ✅ Direct video URL:", directUrl);
      console.log("[YouTube] Video title:", video.snippet.title);
      return {
        url: directUrl,
        title: video.snippet.title,
      };
    }

    console.warn("[YouTube] No results found for:", query);
    return fallback;
  } catch (e) {
    console.error("[YouTube] FETCH FAILED:", e);
    return fallback;
  }
}
