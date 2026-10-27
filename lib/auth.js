
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import db from "@/lib/db";

export const SESSION_COOKIE = "les_session";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET belum dikonfigurasi dengan benar."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user) {
  return new SignJWT({
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecretKey());
}

export async function getSession() {
  // Ambil cookie pada konteks request yang sedang aktif.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getSecretKey(),
      { algorithms: ["HS256"] }
    );

    const userId = Number(payload.sub);

    if (
      !Number.isSafeInteger(userId) ||
      userId < 1 ||
      typeof payload.email !== "string" ||
      !["admin", "tutor", "orang_tua"].includes(payload.role)
    ) {
      return null;
    }

    const [rows] = await db.execute(
      `SELECT id, nama, email, role
       FROM users
       WHERE id = ? AND email = ? AND role = ?
       LIMIT 1`,
      [userId, payload.email, payload.role]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error(
      "Gagal memvalidasi token sesi:",
      error.message
    );
    return null;
  }
}
