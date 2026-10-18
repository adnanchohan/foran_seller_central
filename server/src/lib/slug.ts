export function makeStoreSlug(storeName: string, firebaseUid: string) {
  const base = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `${base || 'store'}-${firebaseUid.slice(0, 6).toLowerCase()}`;
}
