import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  name: string;
  image: string | null;
  roomId: string;
  host: boolean;
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = process.env.COLLAB_JWT_SECRET;
  if (!secret) {
    throw new Error("COLLAB_JWT_SECRET is not set");
  }
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded !== "object" || decoded === null) return null;
    const payload = decoded as Record<string, unknown>;
    if (!payload.userId || !payload.roomId) return null;
    return {
      userId: String(payload.userId),
      name: typeof payload.name === "string" ? payload.name : "Anonymous",
      image: typeof payload.image === "string" ? payload.image : null,
      roomId: String(payload.roomId),
      host: payload.host === true,
    };
  } catch {
    return null;
  }
}
