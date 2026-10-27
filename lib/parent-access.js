
import crypto from "node:crypto";

export const PARENT_COOKIE_NAME = "manuli_parent_access";

export function buatTokenAkses() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function cookieAman() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
