
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  buatTokenAkses,
  hashToken,
} from "@/lib/parent-access";

export async function POST(request) {
  let connection;

  try {
    // 1. Pastikan pengguna adalah admin
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses hanya tersedia untuk admin.",
        },
        { status: 403 }
      );
    }

    // 2. Validasi alamat aplikasi
    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "APP_URL belum diatur di .env.local.",
        },
        { status: 500 }
      );
    }

    // 3. Ambil ID peserta
    const body = await request.json();
    const pesertaId = Number(body.pesertaId);

    if (
      !Number.isSafeInteger(pesertaId) ||
      pesertaId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ID peserta tidak valid.",
        },
        { status: 400 }
      );
    }

    // 4. Pastikan peserta terhubung dengan orang tua
    const [pesertaRows] = await db.execute(
      `SELECT
          p.id,
          p.nama,
          p.parent_user_id,
          u.nama AS nama_orang_tua
       FROM peserta p
       LEFT JOIN users u
          ON u.id = p.parent_user_id
          AND u.role = 'orang_tua'
       WHERE p.id = ?
       LIMIT 1`,
      [pesertaId]
    );

    if (pesertaRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Peserta tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const peserta = pesertaRows[0];

    if (!peserta.parent_user_id || !peserta.nama_orang_tua) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akun orang tua belum terhubung dengan peserta.",
        },
        { status: 400 }
      );
    }

    // 5. Buat token dan simpan hash-nya
    const token = buatTokenAkses();
    const tokenHash = hashToken(token);

    const masaBerlaku = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

     const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const link = `${baseUrl}/orang-tua/akses?token=${token}`;

    link.searchParams.set("token", token);

    // 6. Perbarui tautan secara transaksional
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE parent_access_links
       SET revoked_at = NOW()
       WHERE peserta_id = ?
         AND revoked_at IS NULL`,
      [pesertaId]
    );

    await connection.execute(
      `INSERT INTO parent_access_links
        (peserta_id, token_hash, expires_at, created_by)
       VALUES (?, ?, ?, ?)`,
      [
        pesertaId,
        tokenHash,
        masaBerlaku,
        session.id,
      ]
    );

    await connection.commit();

    const pesanWhatsApp =
      `Halo ${peserta.nama_orang_tua}, berikut tautan ` +
      `untuk memantau jadwal dan presensi les ` +
      `${peserta.nama} melalui Manuli:\n\n${link.toString()}\n\n` +
      `Tautan berlaku selama 30 hari. Mohon tidak membagikannya ` +
      `kepada orang lain.`;

    return NextResponse.json({
      success: true,
      message: "Tautan akses berhasil dibuat.",
      namaPeserta: peserta.nama,
      namaOrangTua: peserta.nama_orang_tua,
      link: link.toString(),
      whatsappUrl:
        "https://wa.me/?text=" +
        encodeURIComponent(pesanWhatsApp),
      berlakuSampai: masaBerlaku.toISOString(),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Gagal membuat tautan orang tua:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat tautan akses orang tua.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
