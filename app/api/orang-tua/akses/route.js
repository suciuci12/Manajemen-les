
import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  PARENT_COOKIE_NAME,
  hashToken,
  cookieAman,
} from "@/lib/parent-access";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const token =
      typeof body?.token === "string" ? body.token.trim() : "";

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format token tidak valid.",
        },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      `SELECT id, peserta_id, expires_at, revoked_at
       FROM parent_access_links
       WHERE token_hash = ?
       LIMIT 1`,
      [hashToken(token)]
    );

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Tautan tidak ditemukan. Silakan minta tautan baru kepada admin.",
        },
        { status: 401 }
      );
    }

    const akses = rows[0];

    if (akses.revoked_at !== null) {
      return NextResponse.json(
        {
          success: false,
          message: "Tautan sudah dinonaktifkan. Silakan minta tautan baru.",
        },
        { status: 401 }
      );
    }

    const kedaluwarsa = new Date(akses.expires_at);

    if (
      Number.isNaN(kedaluwarsa.getTime()) ||
      kedaluwarsa.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tautan sudah kedaluwarsa. Silakan minta tautan baru.",
        },
        { status: 401 }
      );
    }

    const [peserta] = await db.execute(
      "SELECT id FROM peserta WHERE id = ? LIMIT 1",
      [akses.peserta_id]
    );

    if (!peserta.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Data peserta tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Tautan berhasil divalidasi.",
    });

    response.cookies.set(
      PARENT_COOKIE_NAME,
      token,
      cookieAman()
    );

    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");

    return response;
  } catch (error) {
    console.error("Validasi tautan orang tua:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server saat memvalidasi tautan.",
      },
      { status: 500 }
    );
  }
}
