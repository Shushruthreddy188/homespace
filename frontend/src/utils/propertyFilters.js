/**
 * Shared price/beds filtering so the list (Buy) and the Map apply identical rules.
 *
 * @param {Array} list           properties already narrowed by route (rent/buy/…)
 * @param {{price?: string, beds?: string}} filters
 *        price: a "min-max" range string like "400-600" ("" = any)
 *        beds:  "1" | "2" | "3+"  ("" = any)
 */
export function applyListingFilters(list, { price, beds } = {}) {
  let out = list || [];

  if (price) {
    const [min, max] = price.split("-").map(Number);
    out = out.filter((p) => !(p.maxPrice < min || p.minPrice > max));
  }

  if (beds) {
    if (beds === "3+") {
      out = out.filter((p) => p.maxBeds >= 3);
    } else {
      const b = Number(beds);
      out = out.filter((p) => p.minBeds <= b && p.maxBeds >= b);
    }
  }

  return out;
}
