
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/lib/db";
import {
  PARENT_COOKIE_NAME,
  hashToken,
} from "@/lib/parent-access";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PARENT_COOKIE_NAME)?.value;

    // Validasi token dari cookie
    if (
      !token ||
      !/^[a-f0-9]{64}$/.test(token)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi akses tidak tersedia.",
        },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const tokenHash = hashToken(token);

    // Cari peserta yang diizinkan oleh token
    const [aksesRows] = await db.execute(
      `SELECT
          pal.id AS akses_id,
          p.id AS peserta_id,
          p.nama AS nama_peserta,
          p.tanggal_lahir,
          p.sekolah
       FROM parent_access_links pal
       INNER JOIN peserta p
          ON p.id = pal.peserta_id
       WHERE pal.token_hash = ?
         AND pal.revoked_at IS NULL
         AND pal.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (aksesRows.length === 0) {
      const response = NextResponse.json(
        {
          success: false,
          message:
            "Tautan akses sudah tidak berlaku. " +
            "Silakan minta tautan baru kepada admin Manuli.",
        },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );

      response.cookies.set(PARENT_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    const peserta = aksesRows[0];
    const pesertaId = peserta.peserta_id;

    // Ambil riwayat presensi khusus peserta ini
    const [presensi] = await db.execute(
      `SELECT
          pr.id,
          pr.jadwal_id,
          pr.status,
          pr.catatan,
          pr.bukti_foto,
          pr.materi_diajarkan,
          pr.kesimpulan_pemahaman,
          pr.dicatat_pada,
          jl.tanggal,
          jl.jam_mulai,
          jl.jam_selesai,
          jl.lokasi,
          mp.nama AS nama_mata_pelajaran,
          COALESCE(t.nama, u.nama, '-') AS nama_tutor
       FROM presensi pr
       INNER JOIN jadwal_les jl
          ON jl.id = pr.jadwal_id
       LEFT JOIN mata_pelajaran mp
          ON mp.id = jl.mata_pelajaran_id
       LEFT JOIN tutor t
          ON t.user_id = jl.tutor_user_id
       LEFT JOIN users u
          ON u.id = jl.tutor_user_id
       WHERE pr.peserta_id = ?
       ORDER BY jl.tanggal DESC, jl.jam_mulai DESC
       LIMIT 100`,
      [pesertaId]
    );

    // Ambil jadwal les peserta
    const [jadwal] = await db.execute(
      `SELECT
          jl.id,
          jl.tanggal,
          jl.jam_mulai,
          jl.jam_selesai,
          jl.lokasi,
          mp.nama AS nama_mata_pelajaran,
          COALESCE(t.nama, u.nama, '-') AS nama_tutor
       FROM jadwal_les jl
       LEFT JOIN mata_pelajaran mp
          ON mp.id = jl.mata_pelajaran_id
       LEFT JOIN tutor t
          ON t.user_id = jl.tutor_user_id
       LEFT JOIN users u
          ON u.id = jl.tutor_user_id
       WHERE jl.peserta_id = ?
       ORDER BY jl.tanggal ASC, jl.jam_mulai ASC
       LIMIT 100`,
      [pesertaId]
    );

    // Hitung statistik berdasarkan riwayat presensi
    const statistik = {
      totalPresensi: presensi.length,
      hadir: presensi.filter(
        (item) => item.status === "hadir"
      ).length,
      izin: presensi.filter(
        (item) => item.status === "izin"
      ).length,
      sakit: presensi.filter(
        (item) => item.status === "sakit"
      ).length,
      alfa: presensi.filter(
        (item) => item.status === "alfa"
      ).length,
    };

    return NextResponse.json(
      {
        success: true,
        peserta: {
          id: peserta.peserta_id,
          nama: peserta.nama_peserta,
          tanggalLahir: peserta.tanggal_lahir,
          sekolah: peserta.sekolah,
        },
        statistik,
        presensi,
        jadwal,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Referrer-Policy": "no-referrer",
        },
      }
    );
  } catch (error) {
    console.error("Gagal memuat dashboard orang tua:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memuat informasi belajar anak.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
