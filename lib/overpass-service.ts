/**
 * Overpass API service for fetching nearby Points of Interest from OpenStreetMap.
 * 100% free, no API key required.
 * Uses multiple server mirrors to avoid rate limits.
 */

// Multiple Overpass API servers — if one is rate-limited, try the next
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// In-memory cache to avoid hammering the API
const poiCache = new Map<string, { data: POIResult[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Maps RescueNow service types to OpenStreetMap tags
const SERVICE_TO_OSM_TAGS: Record<string, string> = {
  gas: '[amenity=fuel]',
  mechanic: '[shop=car_repair]',
  tire: '[shop=tyres]',
  locksmith: '[shop=locksmith]',
  tow: '[shop=car_repair]["service:vehicle:towing"="yes"]',
  hospital: '[amenity~"hospital|clinic"]',
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
 * Tries multiple servers to avoid 429 rate limits.
 * Results are cached for 5 minutes.
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

  // Check cache first (rounded to 3 decimals for ~111m accuracy)
  const cacheKey = `${serviceType}_${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusMeters}`;
  const cached = poiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Overpass] Cache hit for ${serviceType} (${cached.data.length} results)`);
    return cached.data;
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

  // Try each server until one works
  for (const server of OVERPASS_SERVERS) {
    try {
      console.log(`[Overpass] Trying ${server.split("//")[1]?.split("/")[0]}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(server, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        console.warn(`[Overpass] Server rate-limited (429), trying next...`);
        continue;
      }

      if (!response.ok) {
        console.warn(`[Overpass] Server error: ${response.status}, trying next...`);
        continue;
      }

      const data = await response.json();
      const elements = data.elements ?? [];

      const results = elements
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

      // Cache successful results
      poiCache.set(cacheKey, { data: results, timestamp: Date.now() });
      console.log(`[Overpass] ✓ Found ${results.length} ${serviceType} POIs`);
      return results;
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.warn(`[Overpass] Server timeout, trying next...`);
      } else {
        console.warn(`[Overpass] Server error:`, e.message ?? e);
      }
    }
  }

  // All servers failed
  console.warn("[Overpass] All servers failed — returning empty results");
  return [];
}

function getDefaultName(serviceType: string): string {
  const names: Record<string, string> = {
    gas: "Gasolinera",
    mechanic: "Taller Mecánico",
    tire: "Llantera",
    locksmith: "Cerrajería",
    tow: "Servicio de Grúa",
    hospital: "Hospital / Clínica",
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
