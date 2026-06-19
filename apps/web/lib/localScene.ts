import type { SceneData } from "./scene";

const STORAGE_KEY = "sketchify:scene";

export function loadLocalScene(): SceneData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SceneData;
  } catch {
    return null;
  }
}

export function saveLocalScene(scene: SceneData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
  } catch {
    return;
  }
}

export function clearLocalScene(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}
