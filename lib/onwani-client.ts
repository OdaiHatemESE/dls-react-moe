"use client";

// Lightweight client helpers to call public Onwani endpoints directly from the browser
// All functions return raw JSON as provided by the API to avoid accidental shape drift.

export type Municipality = "ADM" | "AAM" | "WRM";

export async function getDistricts(municipality: Municipality) {
  const url = `https://onwani.abudhabi.ae/tamm/api/getdistricts?municipality=${encodeURIComponent(
    municipality
  )}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Onwani districts error ${res.status}`);
  return res.json();
}

export async function getCommunities(
  municipality: Municipality,
  districtNameEn: string
) {
  const url = `https://onwani.abudhabi.ae/tamm/api/getcommunities?municipality=${encodeURIComponent(
    municipality
  )}&DISTRICT_NAME_EN=${encodeURIComponent(districtNameEn)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Onwani communities error ${res.status}`);
  return res.json();
}

// AAM-only
export async function getRoadIds(
  districtNameEn: string,
  communityNameEn: string
) {
  const url = `https://onwani.abudhabi.ae/tamm/api/getroadids?municipality=AAM&DISTRICT_NAME_EN=${encodeURIComponent(
    districtNameEn
  )}&community_name_en=${encodeURIComponent(communityNameEn)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Onwani road ids error ${res.status}`);
  return res.json();
}

export async function getCommunityShape(
  municipality: Municipality,
  districtNameEn: string,
  communityNameEn: string
) {
  const url = `https://onwani.abudhabi.ae/tamm/api/getcommunityshape?municipality=${encodeURIComponent(
    municipality
  )}&DISTRICT_NAME_EN=${encodeURIComponent(
    districtNameEn
  )}&community_name_en=${encodeURIComponent(communityNameEn)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Onwani shape error ${res.status}`);
  return res.json();
}

export async function getPlotNumbers(
  municipality: Municipality,
  districtNameEn: string,
  communityNameEn: string,
  roadId?: string
) {
  const qs = new URLSearchParams({
    municipality,
    DISTRICT_NAME_EN: districtNameEn,
    COMMUNITY_NAME_EN: communityNameEn,
  });
  // Road filter (AAM): API supports filtering plot numbers by road
  if (roadId) qs.append("roadId", roadId);
  const url = `https://onwani.abudhabi.ae/tamm/api/getplotnumbers?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Onwani plot numbers error ${res.status}`);
  return res.json();
}

export async function getGisIds(gisid: string) {
  const url = `https://onwani.abudhabi.ae/onwaniapi/api/gisid?gisid=${encodeURIComponent(gisid)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Onwani GISID error ${res.status}`);
  return res.json();
}
