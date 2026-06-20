export interface PublicParticipant {
  userId: string;
  name: string;
  image: string | null;
  color: string;
  canDraw: boolean;
  isHost: boolean;
}

export interface ScenePayload {
  elements: unknown[];
  files: Record<string, unknown>;
}

export type ClientMessage =
  | { type: "join"; token: string; initialScene?: ScenePayload }
  | { type: "scene-update"; elements: unknown[]; files?: Record<string, unknown> }
  | { type: "cursor"; x: number; y: number }
  | { type: "set-permission"; targetUserId: string; canDraw: boolean }
  | { type: "kick"; targetUserId: string }
  | { type: "end-room" };

export type ServerMessage =
  | {
      type: "init";
      you: PublicParticipant;
      scene: ScenePayload;
      participants: PublicParticipant[];
    }
  | { type: "participants"; participants: PublicParticipant[] }
  | {
      type: "scene-update";
      from: string;
      elements: unknown[];
      files: Record<string, unknown>;
    }
  | {
      type: "cursor";
      userId: string;
      name: string;
      color: string;
      x: number;
      y: number;
    }
  | { type: "permission"; canDraw: boolean }
  | { type: "kicked" }
  | { type: "host-left" }
  | { type: "room-ended" }
  | { type: "error"; message: string };
