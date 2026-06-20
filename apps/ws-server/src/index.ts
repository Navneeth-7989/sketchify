import http from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";
import { verifyToken } from "./auth.js";
import {
  connectionsForUser,
  ensureRoom,
  getRoom,
  pickColor,
  publicParticipants,
  removeRoom,
  type Participant,
  type Room,
} from "./rooms.js";
import type { ClientMessage, ServerMessage } from "./protocol.js";

const PORT = Number(process.env.PORT ?? 8080);

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(
  room: Room,
  message: ServerMessage,
  exceptConnectionId?: string
): void {
  for (const p of room.participants.values()) {
    if (p.connectionId === exceptConnectionId) continue;
    send(p.ws, message);
  }
}

function broadcastParticipants(room: Room): void {
  broadcast(room, { type: "participants", participants: publicParticipants(room) });
}

interface Conn {
  participant: Participant;
  room: Room;
}

function leave(conn: Conn | null): void {
  if (!conn) return;
  const { room, participant } = conn;
  room.participants.delete(participant.connectionId);
  if (room.participants.size === 0) {
    removeRoom(room.id);
    return;
  }
  broadcastParticipants(room);
}

wss.on("connection", (ws) => {
  let conn: Conn | null = null;

  ws.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      return;
    }

    if (msg.type === "join") {
      if (conn) return;
      const payload = verifyToken(msg.token);
      if (!payload) {
        send(ws, { type: "error", message: "Unauthorized" });
        ws.close();
        return;
      }

      const room = ensureRoom(payload.roomId, msg.initialScene);
      const participant: Participant = {
        connectionId: randomUUID(),
        ws,
        userId: payload.userId,
        name: payload.name,
        image: payload.image,
        color: pickColor(payload.userId),
        canDraw: true,
        isHost: payload.host,
      };
      room.participants.set(participant.connectionId, participant);
      conn = { participant, room };

      send(ws, {
        type: "init",
        you: {
          userId: participant.userId,
          name: participant.name,
          image: participant.image,
          color: participant.color,
          canDraw: participant.canDraw,
          isHost: participant.isHost,
        },
        scene: room.scene,
        participants: publicParticipants(room),
      });
      broadcastParticipants(room);
      return;
    }

    if (!conn) return;
    const { room, participant } = conn;

    if (msg.type === "scene-update") {
      if (!participant.canDraw) return;
      room.scene = {
        elements: Array.isArray(msg.elements) ? msg.elements : [],
        files: msg.files ?? room.scene.files,
      };
      broadcast(
        room,
        {
          type: "scene-update",
          from: participant.userId,
          elements: room.scene.elements,
          files: room.scene.files,
        },
        participant.connectionId
      );
      return;
    }

    if (msg.type === "cursor") {
      broadcast(
        room,
        {
          type: "cursor",
          userId: participant.userId,
          name: participant.name,
          color: participant.color,
          x: msg.x,
          y: msg.y,
        },
        participant.connectionId
      );
      return;
    }

    if (msg.type === "set-permission") {
      if (!participant.isHost) return;
      const targets = connectionsForUser(room, msg.targetUserId);
      for (const t of targets) {
        if (t.isHost) continue;
        t.canDraw = msg.canDraw;
        send(t.ws, { type: "permission", canDraw: msg.canDraw });
      }
      broadcastParticipants(room);
      return;
    }

    if (msg.type === "kick") {
      if (!participant.isHost) return;
      if (msg.targetUserId === participant.userId) return;
      const targets = connectionsForUser(room, msg.targetUserId);
      for (const t of targets) {
        send(t.ws, { type: "kicked" });
        t.ws.close();
        room.participants.delete(t.connectionId);
      }
      broadcastParticipants(room);
      return;
    }

    if (msg.type === "end-room") {
      if (!participant.isHost) return;
      broadcast(room, { type: "room-ended" });
      for (const p of room.participants.values()) {
        p.ws.close();
      }
      removeRoom(room.id);
      conn = null;
      return;
    }
  });

  ws.on("close", () => {
    leave(conn);
    conn = null;
  });

  ws.on("error", () => {
    leave(conn);
    conn = null;
  });
});

server.listen(PORT, () => {
  console.log(`ws-server listening on :${PORT}`);
});

export { getRoom };
