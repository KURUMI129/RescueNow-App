/**
 * Overpass API service for fetching nearby Points of Interest from OpenStreetMap.
 * 100% free, no API key required.
 */

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

// Maps RescueNow service types to OpenStreetMap tags
const SERVICE_TO_OSM_TAGS: Record<string, string> = {
  gas: '[amenity=fuel]',
  mechanic: '[shop=car_repair]',
  tire: '[shop=tyres]',
  locksmith: '[shop=locksmith]',
  tow: '[shop=car_repair]["service:vehicle:towing"="yes"]',
};

export type POIResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  address?: string;
  phone?: string;
};

/**
 * Fetch nearby Points of Interest from OpenStreetMap via Overpass API.
 * @param lat User's latitude
 * @param lng User's longitude
 * @param serviceType RescueNow service type (gas, mechanic, tire, locksmith, tow)
 * @param radiusMeters Search radius in meters (default 5000 = 5km)
 */
export async function fetchNearbyPOIs(
  lat: number,
  lng: number,
  serviceType: string,
  radiusMeters: number = 5000,
): Promise<POIResult[]> {
  const osmTag = SERVICE_TO_OSM_TAGS[serviceType];
  if (!osmTag) {
    console.warn(`[Overpass] No OSM tag mapping for service type: ${serviceType}`);
    return [];
  }

  // Build Overpass QL query
  const query = `
    [out:json][timeout:10];
    (
      node${osmTag}(around:${radiusMeters},${lat},${lng});
      way${osmTag}(around:${radiusMeters},${lat},${lng});
    );
    out center 20;
  `;

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.warn(`[Overpass] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const elements = data.elements ?? [];

    return elements
      .map((el: any) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;

        const tags = el.tags ?? {};
        return {
          id: el.id,
          name: tags.name ?? tags.brand ?? getDefaultName(serviceType),
          latitude: elLat,
          longitude: elLng,
          type: serviceType,
          address: buildAddress(tags),
          phone: tags.phone ?? tags["contact:phone"] ?? undefined,
        } as POIResult;
      })
      .filter(Boolean) as POIResult[];
  } catch (e) {
    console.error("[Overpass] Fetch error:", e);
    return [];
  }
}

function getDefaultName(serviceType: string): string {
  const names: Record<string, string> = {
    gas: "Gasolinera",
    mechanic: "Taller Mecánico",
    tire: "Llantera",
    locksmith: "Cerrajería",
    tow: "Servicio de Grúa",
  };
  return names[serviceType] ?? "Servicio";
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

/**
 * Calculate distance in km between two coordinates (Haversine formula).
 */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
