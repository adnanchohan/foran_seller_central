export function makeStoreSlug(storeName: string, identifier: string): string {
  const base = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = identifier.slice(-4).toLowerCase();
  return base ? `${base}-${suffix}` : `store-${suffix}`;
}
