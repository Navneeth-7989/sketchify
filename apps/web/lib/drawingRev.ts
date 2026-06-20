const KEY = "sketchify:drawingRev";

export function currentRev(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function bumpRev(): string {
  const rev =
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, rev);
    } catch {
      return rev;
    }
  }
  return rev;
}
