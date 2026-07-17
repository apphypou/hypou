import { describe, expect, it } from "vitest";
import { isLocationResult, type PhotonFeature } from "@/lib/locationSearch";

function feature(osmKey: string, osmValue: string): PhotonFeature {
  return {
    geometry: { coordinates: [-46.3, -23.4] },
    properties: { osm_id: 1, osm_key: osmKey, osm_value: osmValue, countrycode: "BR" },
  };
}

describe("isLocationResult", () => {
  it("rejects businesses and services returned by Photon", () => {
    expect(isLocationResult(feature("amenity", "clinic"))).toBe(false);
    expect(isLocationResult(feature("shop", "massage"))).toBe(false);
    expect(isLocationResult(feature("building", "yes"))).toBe(false);
  });

  it("keeps geographic address results", () => {
    expect(isLocationResult(feature("place", "city"))).toBe(true);
    expect(isLocationResult(feature("highway", "residential"))).toBe(true);
    expect(isLocationResult(feature("addr", "street"))).toBe(true);
  });
});
