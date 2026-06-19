import type { SceneData } from "./scene";

export async function loadDbScene(): Promise<SceneData | null> {
  try {
    const res = await fetch("/api/drawing", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { scene: SceneData | null };
    return data.scene ?? null;
  } catch {
    return null;
  }
}

export async function saveDbScene(scene: SceneData): Promise<boolean> {
  try {
    const res = await fetch("/api/drawing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scene),
    });
    return res.ok;
  } catch {
    return false;
  }
}
