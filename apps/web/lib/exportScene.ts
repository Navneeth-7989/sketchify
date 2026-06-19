import type { SceneData } from "./scene";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportAppState(scene: SceneData) {
  return {
    ...scene.appState,
    exportBackground: true,
    exportWithDarkMode: scene.appState.theme === "dark",
    exportEmbedScene: false,
  };
}

export async function exportSelectionToPng(scene: SceneData) {
  const { exportToBlob } = await import("@excalidraw/excalidraw");
  const blob = await exportToBlob({
    elements: scene.elements,
    appState: exportAppState(scene),
    files: scene.files,
    mimeType: "image/png",
    quality: 1,
  });
  downloadBlob(blob, "sketchify.png");
}

export async function exportSelectionToSvg(scene: SceneData) {
  const { exportToSvg } = await import("@excalidraw/excalidraw");
  const svg = await exportToSvg({
    elements: scene.elements,
    appState: exportAppState(scene),
    files: scene.files,
  });
  const data = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([data], { type: "image/svg+xml" });
  downloadBlob(blob, "sketchify.svg");
}
