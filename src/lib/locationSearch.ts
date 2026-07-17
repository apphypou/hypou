export interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    countrycode?: string;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const disallowedOsmKeys = new Set(["amenity", "shop", "office", "craft", "tourism", "leisure", "building"]);
const allowedPlaceValues = new Set([
  "address", "city", "town", "village", "municipality", "suburb", "neighbourhood",
  "quarter", "state", "county", "region", "postcode", "road", "street", "house",
  "locality",
]);

export function isLocationResult(feature: PhotonFeature) {
  const { osm_key: key, osm_value: value, type } = feature.properties;
  if (key && disallowedOsmKeys.has(key)) return false;

  if (key === "place" || key === "highway") return true;

  return Boolean(
    (value && allowedPlaceValues.has(value)) ||
    (type && allowedPlaceValues.has(type)),
  );
}

export function formatLocationFeature(feature: PhotonFeature): string {
  const { name, city, state } = feature.properties;
  const parts = [name, city, state].filter(Boolean);
  return parts.filter((part, index) => index === 0 || part !== parts[index - 1]).join(", ");
}
