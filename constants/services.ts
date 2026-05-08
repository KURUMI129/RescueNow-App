import { MaterialCommunityIcons } from "@expo/vector-icons";

export type ServiceOption = {
  id: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  colorHex: string;
};

export const MAP_SERVICES: ServiceOption[] = [
  { id: "hospital", titleEs: "Hospitales", titleEn: "Hospitals", descEs: "Clínicas y hospitales cercanos", descEn: "Nearby clinics and hospitals", icon: "hospital-box", colorHex: "#DC2626" },
  { id: "tow", titleEs: "Grúa", titleEn: "Tow", descEs: "Vehículo inmovilizado", descEn: "Immobilized vehicle", icon: "tow-truck", colorHex: "#FFB800" },
  { id: "mechanic_car", titleEs: "Mec. Autos", titleEn: "Car Mech.", descEs: "Falla de motor o batería", descEn: "Engine or battery failure", icon: "car-wrench", colorHex: "#3B82F6" },
  { id: "mechanic_moto", titleEs: "Mec. Motos", titleEn: "Moto Mech.", descEs: "Reparación de motocicletas", descEn: "Motorcycle repair", icon: "motorbike", colorHex: "#6366F1" },
  { id: "electrician", titleEs: "Electricista", titleEn: "Electrician", descEs: "Sistema eléctrico", descEn: "Electrical system", icon: "flash", colorHex: "#EAB308" },
  { id: "gas", titleEs: "Gasolina", titleEn: "Gas", descEs: "Sin combustible", descEn: "Out of fuel", icon: "gas-station", colorHex: "#10B981" },
  { id: "tire", titleEs: "Llantera", titleEn: "Tire", descEs: "Ponchadura o presión baja", descEn: "Puncture or low pressure", icon: "tire", colorHex: "#F97316" },
  { id: "locksmith", titleEs: "Cerrajero", titleEn: "Locksmith", descEs: "Llaves atascadas", descEn: "Lost or stuck keys", icon: "key", colorHex: "#8B5CF6" },
];
