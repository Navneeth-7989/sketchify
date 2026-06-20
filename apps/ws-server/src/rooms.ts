import type { WebSocket } from "ws";
import type { PublicParticipant, ScenePayload } from "./protocol.js";

export interface Participant {
  connectionId: string;
  ws: WebSocket;
  userId: string;
  name: string;
  image: string | null;
  color: string;
  canDraw: boolean;
  isHost: boolean;
}

export interface Room {
  id: string;
  scene: ScenePayload;
  participants: Map<string, Participant>;
}

const rooms = new Map<string, Room>();

const CURSOR_COLORS = [
  "#e03131",
  "#1971c2",
  "#2f9e44",
  "#f08c00",
  "#9c36b5",
  "#0c8599",
  "#e8590c",
  "#5f3dc4",
];

export function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index] as string;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function ensureRoom(id: string, initialScene?: ScenePayload): Room {
  let room = rooms.get(id);
  if (!room) {
    room = {
      id,
      scene: initialScene
        ? { elements: initialScene.elements ?? [], files: initialScene.files ?? {} }
        : { elements: [], files: {} },
      participants: new Map(),
    };
    rooms.set(id, room);
  }
  return room;
}

export function removeRoom(id: string): void {
  rooms.delete(id);
}

export function publicParticipants(room: Room): PublicParticipant[] {
  const byUser = new Map<string, PublicParticipant>();
  for (const p of room.participants.values()) {
    byUser.set(p.userId, {
      userId: p.userId,
      name: p.name,
      image: p.image,
      color: p.color,
      canDraw: p.canDraw,
      isHost: p.isHost,
    });
  }
  return [...byUser.values()];
}

export function connectionsForUser(room: Room, userId: string): Participant[] {
  return [...room.participants.values()].filter((p) => p.userId === userId);
}
