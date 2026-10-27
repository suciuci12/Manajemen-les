
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "tutor") {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses." },
        { status: 403 }
      );
    }

    const [rows] = await db.execute(
      `
      SELECT DISTINCT
        p.id,
        p.nama,
        p.tanggal_lahir,
        p.sekolah
      FROM jadwal_les jl
      INNER JOIN peserta p
        ON p.id = jl.peserta_id
      WHERE jl.tutor_user_id = ?
      ORDER BY p.nama ASC
      `,
      [user.id]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil data peserta tutor:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data peserta." },
      { status: 500 }
    );
  }
}
