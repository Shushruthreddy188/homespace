// geocode-db.js
// Node 18+
// Usage: node geocode-db.js ./db.json
import fs from "fs/promises";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "db.json");
const BACKUP = INPUT + ".bak";

// ------------ Config ------------
const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_MS || 750);
const MAX_RETRIES = 3;
const APP_EMAIL = process.env.APP_EMAIL || "shushruth108@example.com"; // used for UA
const UA = `HomeSpace/1.0 (+${APP_EMAIL})`;

// Providers (set any of these env vars to prefer a provider)
const GOOGLE_KEY = process.env.GOOGLE_GEOCODE_KEY || "";
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || "";
const MAPSCO_API_KEY = process.env.MAPSCO_API_KEY || "";

// ------------ Helpers ------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options = {}, label = "fetch") {
  let attempt = 0;
  let lastErr;
  while (attempt < MAX_RETRIES) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        const backoff = Math.min(1500 * 2 ** attempt, 8000);
        console.warn(`  ${label} ${res.status}; retrying in ${backoff}ms...`);
        await sleep(backoff);
        attempt++;
        continue;
      }
      const text = await res.text();
      throw new Error(`${label} HTTP ${res.status}: ${text.slice(0, 200)}`);
    } catch (e) {
      lastErr = e;
      const backoff = Math.min(1500 * 2 ** attempt, 8000);
      console.warn(
        `  ${label} error (${e.message}); retrying in ${backoff}ms...`
      );
      await sleep(backoff);
      attempt++;
    }
  }
  throw lastErr || new Error(`${label} failed`);
}

// ------------ Geocoders ------------
async function geocodeGoogle(address) {
  if (!GOOGLE_KEY) throw new Error("no_google_key");
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json" +
    `?address=${encodeURIComponent(address)}&key=${GOOGLE_KEY}`;
  const res = await fetchWithRetry(
    url,
    { headers: { "User-Agent": UA } },
    "google"
  );
  const data = await res.json();
  const r = data.results?.[0];
  if (!r) throw new Error("no_result");
  const { lat, lng } = r.geometry.location;
  return { lat, lon: lng, provider: "google" };
}

async function geocodeMapbox(address) {
  if (!MAPBOX_TOKEN) throw new Error("no_mapbox_token");
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json` + `?access_token=${MAPBOX_TOKEN}&limit=1&types=address,place,poi`;
  const res = await fetchWithRetry(
    url,
    { headers: { "User-Agent": UA } },
    "mapbox"
  );
  const data = await res.json();
  const f = data.features?.[0];
  if (!f) throw new Error("no_result");
  const [lon, lat] = f.center;
  return { lat, lon, provider: "mapbox" };
}

async function geocodeMapsCo(address) {
  if (!MAPSCO_API_KEY) throw new Error("no_mapsco_key"); // they now require a key
  const url =
    "https://geocode.maps.co/search?" +
    `q=${encodeURIComponent(address)}&api_key=${MAPSCO_API_KEY}`;
  const res = await fetchWithRetry(
    url,
    { headers: { "User-Agent": UA } },
    "maps.co"
  );
  const data = await res.json();
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit) throw new Error("no_result");
  return { lat: Number(hit.lat), lon: Number(hit.lon), provider: "maps.co" };
}

async function geocodePhoton(address) {
  // No key; community Pelias/Photon by komoot
  const url =
    "https://photon.komoot.io/api/?" +
    `q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetchWithRetry(
    url,
    { headers: { "User-Agent": UA } },
    "photon"
  );
  const data = await res.json();
  const f = data.features?.[0];
  if (!f?.geometry?.coordinates) throw new Error("no_result");
  const [lon, lat] = f.geometry.coordinates;
  return { lat: Number(lat), lon: Number(lon), provider: "photon" };
}

// Try providers in priority order depending on what keys you have:
async function geocode(address) {
  const chain = [];
  if (GOOGLE_KEY) chain.push(geocodeGoogle);
  if (MAPBOX_TOKEN) chain.push(geocodeMapbox);
  if (MAPSCO_API_KEY) chain.push(geocodeMapsCo);
  chain.push(geocodePhoton); // final fallback (no key)

  let lastErr;
  for (const fn of chain) {
    try {
      const res = await fn(address);
      return res;
    } catch (e) {
      lastErr = e;
      // try next provider
    }
  }
  throw lastErr || new Error("all_providers_failed");
}

// ------------ db.json traversal ------------
function* iterateListings(db) {
  if (Array.isArray(db.buyListings)) {
    for (const item of db.buyListings) yield ["buyListings", item];
  }
  if (Array.isArray(db.rentListings)) {
    for (const item of db.rentListings) yield ["rentListings", item];
  }
}

// ------------ confirmation prompt ------------
async function confirmWrite(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise((resolve) =>
    rl.question(promptText, resolve)
  );
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

// ------------ main ------------
async function main() {
  // Prefer IPv4 (Windows sometimes struggles with IPv6)
  if (!process.env.NODE_OPTIONS?.includes("--dns-result-order=ipv4first")) {
    process.env.NODE_OPTIONS = [
      process.env.NODE_OPTIONS,
      "--dns-result-order=ipv4first",
    ]
      .filter(Boolean)
      .join(" ");
  }

  const raw = await fs.readFile(INPUT, "utf8");
  const db = JSON.parse(raw);

  const addrToItems = new Map();
  for (const [, item] of iterateListings(db)) {
    const address = (item.address || "").trim();
    if (!address) continue;
    // skip if already has numeric lat/lon
    if (typeof item.lat === "number" && typeof item.lon === "number") continue;
    if (!addrToItems.has(address)) addrToItems.set(address, []);
    addrToItems.get(address).push(item);
  }

  const unique = [...addrToItems.keys()];
  console.log(`Found ${unique.length} unique addresses to geocode.`);

  let success = 0,
    failed = 0;
  for (let i = 0; i < unique.length; i++) {
    const address = unique[i];
    process.stdout.write(`\r[${i + 1}/${unique.length}] ${address}   `);
    try {
      const { lat, lon, provider } = await geocode(address);
      for (const item of addrToItems.get(address) || []) {
        item.lat = lat;
        item.lon = lon;
      }
      success++;
      process.stdout.write(
        `\r[${i + 1}/${unique.length}] ${address}  ✓ via ${provider}    \n`
      );
    } catch (e) {
      console.warn(`\n  ↳ Failed: ${address} (${e.message})`);
      for (const item of addrToItems.get(address) || []) {
        if (item.lat == null) item.lat = null;
        if (item.lon == null) item.lon = null;
      }
      failed++;
    }
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`Done. Success: ${success}, Failed: ${failed}`);

  // Show a tiny diff-ish preview
  const preview = JSON.stringify(db, null, 2).slice(0, 800);
  console.log(
    "\nPreview of updated JSON:\n",
    preview,
    preview.length === 800 ? "… (truncated)" : ""
  );

  const ok = await confirmWrite(
    `\nWrite changes?\n  Backup -> ${BACKUP}\n  Output -> ${INPUT}\nConfirm (y/N): `
  );
  if (!ok) {
    console.log("Aborted. No files written.");
    return;
  }

  await fs.writeFile(BACKUP, raw, "utf8");
  await fs.writeFile(INPUT, JSON.stringify(db, null, 2) + "\n", "utf8");
  console.log(`Backup written: ${BACKUP}`);
  console.log(`Updated: ${INPUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
