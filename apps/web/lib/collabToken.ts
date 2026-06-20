import jwt from "jsonwebtoken";

export interface CollabTokenPayload {
  userId: string;
  name: string;
  image: string | null;
  roomId: string;
  host: boolean;
}

export function signCollabToken(payload: CollabTokenPayload): string {
  const secret = process.env.COLLAB_JWT_SECRET;
  if (!secret) {
    throw new Error("COLLAB_JWT_SECRET is not set");
  }
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}
