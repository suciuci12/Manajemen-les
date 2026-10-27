
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { message: "Akses ditolak" },
        { status: 401 }
      );
    }

    // Menghitung jumlah peserta dari tabel peserta
    const [pesertaRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM peserta"
    );

    // Menghitung jumlah tutor dari tabel tutor
    const [tutorRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM tutor"
    );

    // Menghitung jumlah orang tua dari tabel users
    const [orangTuaRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'orang_tua'"
    );

    return NextResponse.json({
      data: {
        peserta: Number(pesertaRows[0].total),
        tutor: Number(tutorRows[0].total),
        orangTua: Number(orangTuaRows[0].total),
      },
    });
  } catch (error) {
    console.error("Gagal memuat statistik:", error);

    return NextResponse.json(
      { message: "Gagal memuat statistik dashboard" },
      { status: 500 }
    );
  }
}
