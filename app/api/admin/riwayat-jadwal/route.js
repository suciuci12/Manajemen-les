
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Akses hanya untuk admin." },
        { status: 403 }
      );
    }

    const [rows] = await db.execute(
      `SELECT
         r.id,
         r.jadwal_id,
         r.tutor_user_id,
         u.nama AS nama_tutor,
         p.nama AS nama_peserta,
         mp.nama AS nama_mata_pelajaran,
         r.tanggal_lama,
         r.jam_mulai_lama,
         r.jam_selesai_lama,
         r.tanggal_baru,
         r.jam_mulai_baru,
         r.jam_selesai_baru,
         r.alasan,
         r.diubah_pada
       FROM jadwal_les_riwayat r
       LEFT JOIN users u
         ON u.id = r.tutor_user_id
       LEFT JOIN jadwal_les jl
         ON jl.id = r.jadwal_id
       LEFT JOIN peserta p
         ON p.id = jl.peserta_id
       LEFT JOIN mata_pelajaran mp
         ON mp.id = jl.mata_pelajaran_id
       ORDER BY r.diubah_pada DESC
       LIMIT 500`
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil riwayat jadwal:", error);

    return NextResponse.json(
      { message: "Gagal mengambil riwayat perubahan jadwal." },
      { status: 500 }
    );
  }
}
