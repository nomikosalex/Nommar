/**
 * Convert a CSS declaration string ("color:red;font-size:12px") into a React
 * inline-style object. Keeps the original CSS verbatim in components so the
 * design stays faithful and is easy to tweak. Pure function — usable anywhere.
 */
export function css(str) {
  const out = {};
  if (!str) return out;
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const rawKey = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!rawKey || value === '') continue;
    // kebab-case -> camelCase, incl. vendor prefixes (-webkit-… -> Webkit…)
    const key = rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = value;
  }
  return out;
}
