import type { AppLanguage } from "@/constants/app-preferences";

export type ServiceCategory = "mech" | "tow" | "lock" | "plumb";
export type ServiceComplexity = "basic" | "medium" | "complex";

type LocalizedText = Record<AppLanguage, string>;

export type ServiceOption = {
  id: ServiceCategory;
  title: string;
  subtitle: string;
  icon: string;
};

export type TechnicianProfile = {
  id: string;
  name: string;
  category: ServiceCategory;
  rating: number;
  etaMin: number;
  distanceKm: number;
  jobsDone: number;
  about: LocalizedText;
};

export type PriceItem = {
  job: string;
  estimatedPrice: number;
  basePrice: number;
};

export type PriceEstimateMeta = {
  distanceFactor: number;
  urgencyFactor: number;
  complexityFactor: number;
  nightFactor: number;
  weekendFactor: number;
};

export type PriceEstimateResult = {
  prices: PriceItem[];
  meta: PriceEstimateMeta;
};

const BASE_PRICE_BY_CATEGORY: Record<
  ServiceCategory,
  Array<{ job: LocalizedText; base: number }>
> = {
  mech: [
    {
      job: { es: "Cambio de llanta", en: "Tire change" },
      base: 220,
    },
    {
      job: { es: "Paso de corriente", en: "Jump start" },
      base: 180,
    },
    {
      job: { es: "Revisión básica de motor", en: "Basic engine inspection" },
      base: 350,
    },
  ],
  tow: [
    {
      job: { es: "Arrastre en ciudad", en: "In-city towing" },
      base: 650,
    },
    {
      job: { es: "Arrastre periférico", en: "Outskirts towing" },
      base: 900,
    },
    {
      job: { es: "Rescate de vehículo", en: "Vehicle recovery" },
      base: 1200,
    },
  ],
  lock: [
    {
      job: { es: "Apertura de auto", en: "Car unlock" },
      base: 280,
    },
    {
      job: { es: "Apertura de casa", en: "Home unlock" },
      base: 350,
    },
    {
      job: { es: "Cambio de cilindro", en: "Cylinder replacement" },
      base: 500,
    },
  ],
  plumb: [
    {
      job: { es: "Reparación de fuga simple", en: "Minor leak repair" },
      base: 260,
    },
    {
      job: { es: "Destape de drenaje", en: "Drain unclogging" },
      base: 380,
    },
    {
      job: {
        es: "Cambio de llave o válvula",
        en: "Faucet or valve replacement",
      },
      base: 430,
    },
  ],
};

export const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: "mech",
    title: "Mecánico",
    subtitle: "Fallas generales, batería o llantas",
    icon: "construct-outline",
  },
  {
    id: "tow",
    title: "Grúa",
    subtitle: "Traslado de vehículo a taller",
    icon: "car-sport-outline",
  },
  {
    id: "lock",
    title: "Cerrajero",
    subtitle: "Apertura de auto o domicilio",
    icon: "key-outline",
  },
  {
    id: "plumb",
    title: "Plomero",
    subtitle: "Fuga de agua o tubería",
    icon: "water-outline",
  },
];

export const TECHNICIANS: TechnicianProfile[] = [
  {
    id: "t1",
    name: "Luis Martinez",
    category: "mech",
    rating: 4.9,
    etaMin: 8,
    distanceKm: 1.4,
    jobsDone: 327,
    about: {
      es: "Especialista en fallas rápidas de carretera y asistencia con batería.",
      en: "Roadside specialist for fast breakdown response and battery assistance.",
    },
  },
  {
    id: "t2",
    name: "Monica Perez",
    category: "mech",
    rating: 4.8,
    etaMin: 12,
    distanceKm: 2.1,
    jobsDone: 285,
    about: {
      es: "Técnica automotriz con enfoque en llantas, frenos y diagnóstico básico.",
      en: "Automotive technician focused on tires, brakes, and basic diagnostics.",
    },
  },
  {
    id: "t3",
    name: "Rafael Ochoa",
    category: "tow",
    rating: 4.7,
    etaMin: 10,
    distanceKm: 1.9,
    jobsDone: 410,
    about: {
      es: "Operador de grúa para traslados urbanos y periféricos.",
      en: "Tow truck operator for urban and outskirts transport.",
    },
  },
  {
    id: "t4",
    name: "Diana Cruz",
    category: "lock",
    rating: 4.9,
    etaMin: 9,
    distanceKm: 1.3,
    jobsDone: 221,
    about: {
      es: "Cerrajería residencial y vehicular con atención inmediata.",
      en: "Residential and vehicle locksmith with immediate response.",
    },
  },
  {
    id: "t5",
    name: "Carlos Rojas",
    category: "plumb",
    rating: 4.6,
    etaMin: 11,
    distanceKm: 2.4,
    jobsDone: 198,
    about: {
      es: "Plomería de emergencia en fugas, válvulas y líneas domésticas.",
      en: "Emergency plumber for leaks, valves, and household lines.",
    },
  },
];

function getLocalizedText(text: LocalizedText, language: AppLanguage): string {
  return text[language];
}

function getComplexityFactor(complexity: ServiceComplexity): number {
  if (complexity === "medium") {
    return 1.15;
  }

  if (complexity === "complex") {
    return 1.3;
  }

  return 1;
}

function getNightFactor(date: Date): number {
  const hour = date.getHours();
  const isNight = hour >= 21 || hour < 6;
  return isNight ? 1.18 : 1;
}

function getWeekendFactor(date: Date): number {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  return isWeekend ? 1.1 : 1;
}

export function getSuggestedPrices(
  category: ServiceCategory,
  distanceKm: number,
  urgent: boolean,
  complexity: ServiceComplexity,
  date: Date = new Date(),
  language: AppLanguage = "es",
): PriceEstimateResult {
  const distanceFactor = 1 + Math.max(0, distanceKm - 1) * 0.06;
  const urgencyFactor = urgent ? 1.22 : 1;
  const complexityFactor = getComplexityFactor(complexity);
  const nightFactor = getNightFactor(date);
  const weekendFactor = getWeekendFactor(date);

  const prices = BASE_PRICE_BY_CATEGORY[category].map((item) => {
    const estimatedPrice = Math.round(
      item.base *
        distanceFactor *
        urgencyFactor *
        complexityFactor *
        nightFactor *
        weekendFactor,
    );

    return {
      job: getLocalizedText(item.job, language),
      estimatedPrice,
      basePrice: item.base,
    };
  });

  return {
    prices,
    meta: {
      distanceFactor,
      urgencyFactor,
      complexityFactor,
      nightFactor,
      weekendFactor,
    },
  };
}

export function getCategoryLabel(category: ServiceCategory): string {
  const match = SERVICE_OPTIONS.find((item) => item.id === category);
  return match ? match.title : "Servicio";
}
