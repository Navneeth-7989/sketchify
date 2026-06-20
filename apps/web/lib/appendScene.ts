import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

const GAP = 100;

function maxRightEdge(elements: readonly ExcalidrawElement[]): number | null {
  let max = -Infinity;
  for (const el of elements) {
    if (el.isDeleted) continue;
    const w = typeof el.width === "number" ? el.width : 0;
    max = Math.max(max, el.x + w);
  }
  return max === -Infinity ? null : max;
}

function minLeftEdge(elements: readonly ExcalidrawElement[]): number | null {
  let min = Infinity;
  for (const el of elements) {
    if (el.isDeleted) continue;
    min = Math.min(min, el.x);
  }
  return min === Infinity ? null : min;
}

export function offsetAppendElements(
  existing: readonly ExcalidrawElement[],
  incoming: readonly ExcalidrawElement[]
): ExcalidrawElement[] {
  const existingAlive = existing.filter((el) => !el.isDeleted);
  const incomingAlive = incoming.filter((el) => !el.isDeleted);

  const existingIds = new Set(existingAlive.map((el) => el.id));
  const fresh = incomingAlive.filter((el) => !existingIds.has(el.id));

  const right = maxRightEdge(existingAlive);
  const left = minLeftEdge(fresh);
  const dx = right !== null && left !== null ? right + GAP - left : 0;

  const shifted =
    dx === 0 ? fresh : fresh.map((el) => ({ ...el, x: el.x + dx }));

  return [...existingAlive, ...shifted];
}
