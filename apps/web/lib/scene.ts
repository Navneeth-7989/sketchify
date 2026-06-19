import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export type SceneData = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

export function serializeScene(
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles
): SceneData {
  const {
    viewBackgroundColor,
    theme,
    zoom,
    scrollX,
    scrollY,
    currentItemStrokeColor,
    currentItemBackgroundColor,
    currentItemFillStyle,
    currentItemStrokeWidth,
    currentItemStrokeStyle,
    currentItemRoughness,
    currentItemOpacity,
    currentItemFontFamily,
    currentItemFontSize,
    currentItemTextAlign,
    gridSize,
  } = appState;

  return {
    elements: elements.filter((el) => !el.isDeleted),
    appState: {
      viewBackgroundColor,
      theme,
      zoom,
      scrollX,
      scrollY,
      currentItemStrokeColor,
      currentItemBackgroundColor,
      currentItemFillStyle,
      currentItemStrokeWidth,
      currentItemStrokeStyle,
      currentItemRoughness,
      currentItemOpacity,
      currentItemFontFamily,
      currentItemFontSize,
      currentItemTextAlign,
      gridSize,
    },
    files: files ?? {},
  };
}

export function isSceneNonEmpty(scene: SceneData | null | undefined): boolean {
  return !!scene && Array.isArray(scene.elements) && scene.elements.length > 0;
}
