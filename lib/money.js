// Single currency formatter for the whole app. Locale-aware EUR:
//   EN → "€120", GR → "120 €". Whole euros show no decimals; amounts with cents
//   show two ("€58.50"). Returns null for null input so callers render the
//   bilingual "Price on request" placeholder instead of €0 / NaN.
export function formatEur(cents, lang = 'en') {
  if (cents == null || Number.isNaN(cents)) return null;
  const locale = lang === 'gr' ? 'el-GR' : 'en-GB';
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}

// Catalog price of a package from a slug→priceCents map.
//   totalPriceCents set → fixed price (duets always set it; a normal package
//     may too, to give it a bundle discount off its parts)
//   otherwise           → sum of component catalog prices (null if any component is unpriced)
export function packagePriceCents(pkg, priceMap) {
  if (pkg.totalPriceCents != null) return pkg.totalPriceCents;
  const slugs = pkg.serviceSlugs || [];
  if (!slugs.length) return null;
  let sum = 0;
  for (const s of slugs) {
    const c = priceMap[s];
    if (c == null) return null;
    sum += c;
  }
  return sum;
}
