type StudioIdentityInput = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
};

function hashIdentity(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
}

export function studioTrackId(user?: StudioIdentityInput | null) {
  const seed = String(user?.id || user?.email || user?.name || "mr-creativist-studio").trim().toLowerCase();
  return `MRC-STUDIO-${hashIdentity(seed)}`;
}
