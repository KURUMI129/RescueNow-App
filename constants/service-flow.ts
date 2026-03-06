export type ServiceCategory = 'mech' | 'tow' | 'lock' | 'plumb';
export type ServiceComplexity = 'basic' | 'medium' | 'complex';

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
  about: string;
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

const BASE_PRICE_BY_CATEGORY: Record<ServiceCategory, Array<{ job: string; base: number }>> = {
  mech: [
    { job: 'Cambio de llanta', base: 220 },
    { job: 'Paso de corriente', base: 180 },
    { job: 'Revision basica de motor', base: 350 },
  ],
  tow: [
    { job: 'Arrastre en ciudad', base: 650 },
    { job: 'Arrastre periferico', base: 900 },
    { job: 'Rescate de vehiculo', base: 1200 },
  ],
  lock: [
    { job: 'Apertura de auto', base: 280 },
    { job: 'Apertura de casa', base: 350 },
    { job: 'Cambio de cilindro', base: 500 },
  ],
  plumb: [
    { job: 'Reparacion de fuga simple', base: 260 },
    { job: 'Destape de drenaje', base: 380 },
    { job: 'Cambio de llave o valvula', base: 430 },
  ],
};

export const SERVICE_OPTIONS: ServiceOption[] = [
  { id: 'mech', title: 'Mecanico', subtitle: 'Fallas generales, bateria o llantas', icon: 'construct-outline' },
  { id: 'tow', title: 'Grua', subtitle: 'Traslado de vehiculo a taller', icon: 'car-sport-outline' },
  { id: 'lock', title: 'Cerrajero', subtitle: 'Apertura de auto o domicilio', icon: 'key-outline' },
  { id: 'plumb', title: 'Plomero', subtitle: 'Fuga de agua o tuberia', icon: 'water-outline' },
];

export const TECHNICIANS: TechnicianProfile[] = [
  {
    id: 't1',
    name: 'Luis Martinez',
    category: 'mech',
    rating: 4.9,
    etaMin: 8,
    distanceKm: 1.4,
    jobsDone: 327,
    about: 'Especialista en fallas rapidas de carretera y asistencia con bateria.',
  },
  {
    id: 't2',
    name: 'Monica Perez',
    category: 'mech',
    rating: 4.8,
    etaMin: 12,
    distanceKm: 2.1,
    jobsDone: 285,
    about: 'Tecnica automotriz con enfoque en llantas, frenos y diagnostico basico.',
  },
  {
    id: 't3',
    name: 'Rafael Ochoa',
    category: 'tow',
    rating: 4.7,
    etaMin: 10,
    distanceKm: 1.9,
    jobsDone: 410,
    about: 'Operador de grua para traslados urbanos y perifericos.',
  },
  {
    id: 't4',
    name: 'Diana Cruz',
    category: 'lock',
    rating: 4.9,
    etaMin: 9,
    distanceKm: 1.3,
    jobsDone: 221,
    about: 'Cerrajeria residencial y vehicular con atencion inmediata.',
  },
  {
    id: 't5',
    name: 'Carlos Rojas',
    category: 'plumb',
    rating: 4.6,
    etaMin: 11,
    distanceKm: 2.4,
    jobsDone: 198,
    about: 'Plomeria de emergencia en fugas, valvulas y lineas domesticas.',
  },
];

function getComplexityFactor(complexity: ServiceComplexity): number {
  if (complexity === 'medium') {
    return 1.15;
  }

  if (complexity === 'complex') {
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
  date: Date = new Date()
): PriceEstimateResult {
  const distanceFactor = 1 + Math.max(0, distanceKm - 1) * 0.06;
  const urgencyFactor = urgent ? 1.22 : 1;
  const complexityFactor = getComplexityFactor(complexity);
  const nightFactor = getNightFactor(date);
  const weekendFactor = getWeekendFactor(date);

  const prices = BASE_PRICE_BY_CATEGORY[category].map((item) => {
    const estimatedPrice = Math.round(
      item.base * distanceFactor * urgencyFactor * complexityFactor * nightFactor * weekendFactor
    );

    return {
      job: item.job,
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
  return match ? match.title : 'Servicio';
}
