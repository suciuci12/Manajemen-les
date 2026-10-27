
import crypto from "node:crypto";
import { cookies } from "next/headers";
import db from "@/lib/db";

export async function verifyParentAccess() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("manuli_parent_access")?.value;

    if (!token) {
      console.log("[Akses Orang Tua] Cookie tidak ditemukan.");
      return null;
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      console.log("[Akses Orang Tua] Format token tidak valid.");
      return null;
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [rows] = await db.execute(
      `SELECT
          pal.id AS access_id,
          pal.peserta_id,
          p.nama AS nama_peserta,
          p.parent_user_id
       FROM parent_access_links AS pal
       INNER JOIN peserta AS p
         ON p.id = pal.peserta_id
       WHERE pal.token_hash = ?
         AND pal.revoked_at IS NULL
         AND pal.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      console.log(
        "[Akses Orang Tua] Token tidak cocok, akses dicabut, " +
        "kedaluwarsa, atau peserta tidak ditemukan."
      );
      return null;
    }

    console.log(
      "[Akses Orang Tua] Validasi berhasil untuk peserta ID:",
      rows[0].peserta_id
    );

    return rows[0];
  } catch (error) {
    console.error(
      "[Akses Orang Tua] Kesalahan validasi:",
      error.message
    );

    return null;
  }
}
